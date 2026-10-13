import base64
import hashlib
import hmac

from django.test import TestCase
from django.utils import timezone
from django.test.utils import override_settings
from unittest.mock import patch

from accounts.models import User
from accounts.models import HOD
from departments.models import Department
from rest_framework.test import APIClient

from .delivery import recipients_for
from .models import Notification, NotificationDelivery, NotificationPreference


class NotificationDeliveryTests(TestCase):
    def test_selected_audience_is_limited_to_configured_account_ids(self):
        selected = User.objects.create_user(username="selected-user", password="password", role="student")
        other = User.objects.create_user(username="other-user", password="password", role="staff")
        notification = Notification.objects.create(
            title="Selected announcement",
            audience=Notification.Audience.SELECTED,
            target_user_ids=[selected.pk],
        )

        self.assertEqual(list(recipients_for(notification)), [selected])
        NotificationDelivery.objects.create(
            notification=notification, user=selected, channel="email", status="sent"
        )
        self.assertEqual(notification.deliveries.count(), 1)
        self.assertNotEqual(selected.pk, other.pk)

    def test_department_delivery_includes_its_hod(self):
        department = Department.objects.create(name="Computer Science")
        hod = User.objects.create_user(username="dept-hod", password="password", role="hod")
        HOD.objects.create(user=hod, department=department, hod_id="HOD-1")
        notification = Notification.objects.create(
            title="Department reminder", audience=Notification.Audience.DEPARTMENT, department=department
        )

        self.assertEqual(list(recipients_for(notification)), [hod])

    def test_delivery_channel_is_unique_per_user_and_notification(self):
        user = User.objects.create_user(username="student-user", password="password", role="student")
        notification = Notification.objects.create(title="Workshop", audience=Notification.Audience.ALL)

        NotificationDelivery.objects.get_or_create(notification=notification, user=user, channel="email")
        NotificationDelivery.objects.get_or_create(notification=notification, user=user, channel="email")

        self.assertEqual(notification.deliveries.count(), 1)

    def test_in_app_processing_is_idempotent(self):
        user = User.objects.create_user(username="in-app-user", password="password", role="student")
        notification = Notification.objects.create(
            title="Workshop", audience=Notification.Audience.ALL, channels=["in_app"]
        )

        from .delivery import process_notification
        process_notification(notification.pk)
        process_notification(notification.pk)

        self.assertEqual(notification.deliveries.filter(user=user, channel="in_app", status="sent").count(), 1)

    def test_sms_requires_explicit_consent_and_an_international_phone(self):
        user = User.objects.create_user(username="sms-user", password="password", role="student")
        client = APIClient()
        client.force_authenticate(user=user)
        response = client.patch("/api/notifications/preferences/", {"sms_enabled": True}, format="json")
        self.assertEqual(response.status_code, 400)

        response = client.patch(
            "/api/notifications/preferences/",
            {"sms_consent": True, "phone": "+919876543210"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(user.sms_consent)
        self.assertEqual(user.phone, "+919876543210")

    def test_selected_notification_is_visible_only_to_selected_user(self):
        selected = User.objects.create_user(username="selected-inbox", password="password", role="student")
        other = User.objects.create_user(username="other-inbox", password="password", role="student")
        Notification.objects.create(
            title="Private reminder", audience=Notification.Audience.SELECTED,
            target_user_ids=[selected.pk], scheduled_for=timezone.now(),
        )
        client = APIClient()
        client.force_authenticate(user=selected)
        self.assertEqual(client.get("/api/notifications/").data["results"][0]["title"], "Private reminder")
        client.force_authenticate(user=other)
        self.assertEqual(client.get("/api/notifications/").data["results"], [])

    def test_staff_history_reports_recipient_delivery_totals(self):
        staff = User.objects.create_user(username="history-staff", password="password", role="staff")
        recipient = User.objects.create_user(username="history-recipient", password="password", role="student")
        notification = Notification.objects.create(title="Department reminder", channels=["in_app"])
        NotificationDelivery.objects.create(
            notification=notification, user=recipient, channel="in_app", status="sent"
        )
        NotificationDelivery.objects.create(
            notification=notification, user=recipient, channel="sms", status="delivered"
        )
        client = APIClient()
        client.force_authenticate(user=staff)

        response = client.get("/api/notifications/history/")

        row = response.data["results"][0]
        self.assertEqual(row["title"], "Department reminder")
        self.assertEqual(row["recipients"], 1)
        self.assertEqual(row["sent"], 1)
        self.assertEqual(row["delivered"], 1)

    @patch("announcements.delivery._deliver", return_value="provider-message-1")
    def test_staff_test_email_is_sent_only_to_the_requesting_admin(self, deliver):
        staff = User.objects.create_user(
            username="test-mail-admin", password="Test-only-password-938!", role="staff", email="admin@example.com"
        )
        client = APIClient()
        client.force_authenticate(user=staff)

        response = client.post("/api/notifications/test/", {"channels": ["email"]}, format="json")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["results"][0]["channel"], "email")
        self.assertEqual(response.data["results"][0]["status"], "sent")
        notification = Notification.objects.get(pk=response.data["id"])
        self.assertEqual(notification.target_user_ids, [staff.pk])
        deliver.assert_any_call(notification, staff, "email")

    def test_notification_preview_counts_contacts_and_consented_sms(self):
        staff = User.objects.create_user(username="preview-staff", password="Test-only-password-938!", role="staff")
        User.objects.create_user(
            username="preview-student", password="Test-only-password-938!", role="student", email="student@example.com"
        )
        sms_user = User.objects.create_user(
            username="preview-sms", password="Test-only-password-938!", role="student", email="sms@example.com",
            phone="+919876543210", sms_consent=True,
        )
        NotificationPreference.objects.create(user=sms_user, sms_enabled=True)
        client = APIClient()
        client.force_authenticate(user=staff)

        response = client.post("/api/notifications/preview/", {"audience": "all"}, format="json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, {"recipients": 3, "email_recipients": 2, "sms_recipients": 1})

    @override_settings(
        TWILIO_STATUS_CALLBACK_URL="https://portal.example.edu/api/notifications/providers/twilio/status/",
        TWILIO_AUTH_TOKEN="test-auth-token",
    )
    def test_twilio_delivery_callback_requires_signature_and_marks_delivered(self):
        notification = Notification.objects.create(title="SMS reminder")
        delivery = NotificationDelivery.objects.create(
            notification=notification, user=User.objects.create_user(
                username="callback-user", password="Test-only-password-938!"
            ),
            channel="sms", provider_id="SM123",
        )
        callback_url = "https://portal.example.edu/api/notifications/providers/twilio/status/"
        form_data = {"MessageSid": "SM123", "MessageStatus": "delivered"}
        signature_payload = callback_url + "".join(
            f"{key}{form_data[key]}" for key in sorted(form_data)
        )
        signature = base64.b64encode(
            hmac.new(b"test-auth-token", signature_payload.encode(), hashlib.sha1).digest()
        ).decode()
        client = APIClient()

        response = client.post(
            "/api/notifications/providers/twilio/status/",
            form_data,
            HTTP_X_TWILIO_SIGNATURE=signature,
        )

        self.assertEqual(response.status_code, 204)
        delivery.refresh_from_db()
        self.assertEqual(delivery.status, NotificationDelivery.Status.DELIVERED)

        response = client.post(
            "/api/notifications/providers/twilio/status/",
            {"MessageSid": "SM123", "MessageStatus": "failed"},
            HTTP_X_TWILIO_SIGNATURE="not-valid",
        )
        self.assertEqual(response.status_code, 403)
