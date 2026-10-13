from datetime import time, timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from announcements.models import Notification
from accounts.models import Student, User

from .models import Event, EventRegistration
from .reminders import sync_event_reminders


class EventReminderScheduleTests(TestCase):
    def setUp(self):
        self.event = Event.objects.create(
            title="AI Workshop",
            date=timezone.localdate() + timedelta(days=10),
            time=time(10, 0),
            venue="Lab 3",
            description="Hands-on session",
            registration_link="https://example.com/register",
        )

    def test_published_event_creates_an_immediate_audience_notice(self):
        notice = Notification.objects.get(event=self.event, reminder_minutes__isnull=True, cancelled_notice=False)

        self.assertEqual(notice.audience, Notification.Audience.DEPARTMENT)
        self.assertIsNotNone(notice.scheduled_for)
        self.assertIn("Lab 3", notice.message)
        self.assertIn("https://example.com/register", notice.message)

    def test_schedule_is_idempotent_and_includes_event_details(self):
        sync_event_reminders(self.event)
        sync_event_reminders(self.event)

        reminders = Notification.objects.filter(event=self.event, reminder_minutes__isnull=False)
        self.assertEqual(reminders.count(), 4)
        self.assertEqual(reminders.values("reminder_minutes").distinct().count(), 4)
        self.assertIn("AI Workshop", reminders.first().message)
        self.assertIn("Lab 3", reminders.first().message)
        self.assertIn("https://example.com/register", reminders.first().message)

    def test_reschedule_updates_pending_reminders_without_duplicates(self):
        sync_event_reminders(self.event)
        reminder = Notification.objects.get(event=self.event, reminder_minutes=1440)
        old_schedule = reminder.scheduled_for

        previous = {"date": self.event.date, "time": self.event.time, "is_published": True, "is_cancelled": False}
        self.event.date += timedelta(days=3)
        self.event.save()
        sync_event_reminders(self.event, previous)

        reminder.refresh_from_db()
        self.assertGreater(reminder.scheduled_for, old_schedule)
        self.assertEqual(Notification.objects.filter(event=self.event, reminder_minutes=1440).count(), 1)

    def test_cancellation_creates_audience_notice_and_stops_pending_reminders(self):
        sync_event_reminders(self.event)
        previous = {"date": self.event.date, "time": self.event.time, "is_published": True, "is_cancelled": False}
        self.event.is_cancelled = True
        self.event.save()
        sync_event_reminders(self.event, previous)

        self.assertEqual(
            Notification.objects.filter(event=self.event, reminder_minutes__isnull=False, delivery_status="cancelled").count(),
            4,
        )
        notice = Notification.objects.get(event=self.event, cancelled_notice=True)
        self.assertEqual(notice.audience, Notification.Audience.DEPARTMENT)
        self.assertIn("cancelled", notice.message)


class EventRegistrationTests(TestCase):
    def setUp(self):
        self.event = Event.objects.create(
            title="AI Workshop",
            date=timezone.localdate() + timedelta(days=10),
            is_published=True,
        )
        self.student_user = User.objects.create_user(username="student1", password="student-pass", role="student")
        self.student = Student.objects.create(user=self.student_user, register_number="STU001")
        self.staff_user = User.objects.create_user(username="staff1", password="staff-pass", role="staff")
        self.client = APIClient()

    def register_url(self):
        return f"/api/events/{self.event.pk}/register/"

    def detail_url(self):
        return f"/api/events/{self.event.pk}/"

    def test_student_registration_is_unique_and_updates_public_count(self):
        self.client.force_authenticate(self.student_user)

        response = self.client.post(self.register_url())
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data["is_registered"])
        self.assertEqual(response.data["registered_students_count"], 1)

        duplicate = self.client.post(self.register_url())
        self.assertEqual(duplicate.status_code, 200)
        self.assertEqual(duplicate.data["registered_students_count"], 1)
        self.assertEqual(EventRegistration.objects.filter(event=self.event).count(), 1)

        detail = self.client.get(self.detail_url())
        self.assertEqual(detail.data["registered_students_count"], 1)
        self.assertTrue(detail.data["is_registered"])

    def test_student_can_cancel_registration(self):
        EventRegistration.objects.create(event=self.event, student=self.student)
        self.client.force_authenticate(self.student_user)

        response = self.client.delete(f"/api/events/{self.event.pk}/unregister/")

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["is_registered"])
        self.assertEqual(response.data["registered_students_count"], 0)

    def test_only_students_with_profiles_can_register(self):
        self.client.force_authenticate(self.staff_user)
        self.assertEqual(self.client.post(self.register_url()).status_code, 403)

        student_without_profile = User.objects.create_user(
            username="no-profile", password="student-pass", role="student",
        )
        self.client.force_authenticate(student_without_profile)
        self.assertEqual(self.client.post(self.register_url()).status_code, 403)

    def test_registration_is_closed_for_past_or_cancelled_events(self):
        self.client.force_authenticate(self.student_user)
        self.event.date = timezone.localdate() - timedelta(days=1)
        self.event.save()
        self.assertEqual(self.client.post(self.register_url()).status_code, 400)

        self.event.date = timezone.localdate() + timedelta(days=1)
        self.event.is_cancelled = True
        self.event.save()
        self.assertEqual(self.client.post(self.register_url()).status_code, 400)
