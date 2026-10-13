from datetime import time, timedelta

from django.test import TestCase
from django.utils import timezone

from announcements.models import Notification

from .models import Event
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
