import json
import logging

import requests
from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone

from django.contrib.auth import get_user_model
from accounts.models import HOD, Staff, Student
from .models import Notification, NotificationDelivery, NotificationPreference

logger = logging.getLogger(__name__)


def recipients_for(notification):
    users = get_user_model().objects.filter(is_active=True)
    if notification.audience == Notification.Audience.STUDENT:
        users = users.filter(role="student")
    elif notification.audience == Notification.Audience.STAFF:
        users = users.filter(role__in=("staff", "hod"))
    elif notification.audience == Notification.Audience.DEPARTMENT:
        student_ids = Student.objects.filter(department=notification.department).order_by().values("user_id")
        staff_ids = Staff.objects.filter(department=notification.department).order_by().values("user_id")
        hod_ids = HOD.objects.filter(department=notification.department).order_by().values("user_id")
        users = users.filter(id__in=student_ids.union(staff_ids, hod_ids))
    elif notification.audience == Notification.Audience.CLASS:
        users = users.filter(
            role="student",
            student_profile__year=notification.target_year,
            student_profile__section=notification.target_section,
        )
        if notification.department_id:
            users = users.filter(student_profile__department=notification.department)
    elif notification.audience == Notification.Audience.SELECTED:
        users = users.filter(id__in=notification.target_user_ids)
    return users.distinct()


@transaction.atomic
def process_notification(notification_id):
    notification = Notification.objects.select_for_update().select_related("event", "department").filter(pk=notification_id).first()
    if not notification:
        return
    now = timezone.now()
    users = recipients_for(notification)
    channel_names = list(dict.fromkeys(["in_app", *notification.channels]))
    has_failures = False
    for user in users.iterator():
        preference, _ = NotificationPreference.objects.get_or_create(user=user)
        for channel in channel_names:
            delivery, _ = NotificationDelivery.objects.get_or_create(
                notification=notification, user=user, channel=channel
            )
            if delivery.status in (
                NotificationDelivery.Status.SENT,
                NotificationDelivery.Status.DELIVERED,
                NotificationDelivery.Status.SKIPPED,
            ):
                continue
            if delivery.attempts >= 3:
                has_failures = True
                continue
            if not _channel_enabled(user, preference, channel):
                delivery.status = NotificationDelivery.Status.SKIPPED
                delivery.error = ""
                delivery.save(update_fields=["status", "error", "updated_at"])
                continue
            delivery.attempts += 1
            try:
                provider_id = _deliver(notification, user, channel)
            except Exception as error:
                delivery.status = NotificationDelivery.Status.FAILED
                delivery.error = str(error)[:300]
                has_failures = True
                logger.exception(
                    "Notification delivery failed: notification=%s user=%s channel=%s",
                    notification.pk, user.pk, channel,
                )
            else:
                delivery.status = NotificationDelivery.Status.SENT
                delivery.error = ""
                delivery.provider_id = provider_id or ""
            delivery.save()

    remaining = NotificationDelivery.objects.filter(
        notification=notification,
        status__in=(NotificationDelivery.Status.PENDING, NotificationDelivery.Status.FAILED),
        attempts__lt=3,
    ).exists()
    if remaining:
        Notification.objects.filter(pk=notification.pk).update(delivery_status="failed", processed_at=None)
    else:
        final_status = "failed" if has_failures else "sent"
        Notification.objects.filter(pk=notification.pk).update(
            delivery_status=final_status, processed_at=now
        )


def _channel_enabled(user, preference, channel):
    if channel == "in_app":
        return True
    if channel == "email":
        return preference.email_enabled and bool(user.email)
    if channel == "sms":
        return preference.sms_enabled and user.sms_consent and bool(user.phone)
    if channel == "push":
        return preference.push_enabled and user.push_subscriptions.exists()
    return False


def _deliver(notification, user, channel):
    if channel == "in_app":
        return ""
    if channel == "email":
        sent_count = send_mail(
            subject=notification.title,
            message=f"{notification.message}\n\nView details: {settings.FRONTEND_ORIGIN}{notification.link}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        if sent_count != 1:
            raise RuntimeError("The email backend did not accept the message.")
        return ""
    if channel == "sms":
        account_sid = settings.TWILIO_ACCOUNT_SID
        auth_token = settings.TWILIO_AUTH_TOKEN
        sender = settings.TWILIO_FROM_NUMBER
        if not all((account_sid, auth_token, sender)):
            raise RuntimeError("SMS gateway is not configured.")
        event = notification.event
        if event:
            event_details = f"Reminder: {event.title}, {event.date:%d %b}"
            if event.time:
                event_details += f" at {event.time:%I:%M %p}"
            venue = event.venue
        else:
            event_details, venue = notification.title, ""
        body = f"{event_details}. {('Venue: ' + venue + '. ') if venue else ''}"
        if event and event.registration_link:
            body += f"Register: {event.registration_link} "
        body += f"Details: {settings.FRONTEND_ORIGIN}{notification.link}"
        data = {"To": user.phone, "From": sender, "Body": body[:1500]}
        if settings.TWILIO_STATUS_CALLBACK_URL:
            data["StatusCallback"] = settings.TWILIO_STATUS_CALLBACK_URL
        response = requests.post(
            f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json",
            data=data,
            auth=(account_sid, auth_token),
            timeout=15,
        )
        response.raise_for_status()
        payload = response.json()
        if payload.get("error_code"):
            raise RuntimeError(payload.get("message", "SMS provider rejected the message."))
        if payload.get("status") in ("failed", "undelivered"):
            raise RuntimeError(payload.get("message", "SMS provider failed to queue the message."))
        message_sid = payload.get("sid")
        if not isinstance(message_sid, str) or not message_sid:
            raise RuntimeError("SMS provider response did not include a message ID.")
        return message_sid
    if channel == "push":
        if not settings.WEBPUSH_PRIVATE_KEY or not settings.WEBPUSH_PUBLIC_KEY:
            raise RuntimeError("Web Push is not configured.")
        from pywebpush import WebPushException, webpush

        success_count = 0
        for subscription in user.push_subscriptions.all():
            try:
                response = webpush(
                    subscription_info={
                        "endpoint": subscription.endpoint,
                        "keys": {"p256dh": subscription.p256dh, "auth": subscription.auth},
                    },
                    data=json.dumps({
                        "title": notification.title,
                        "body": notification.message[:240],
                        "url": notification.link,
                        "vibrate": [150, 70, 150],
                        "tag": f"campussphere-notification-{notification.pk}",
                    }),
                    vapid_private_key=settings.WEBPUSH_PRIVATE_KEY,
                    vapid_claims={"sub": settings.WEBPUSH_CONTACT},
                    timeout=15,
                )
            except WebPushException as error:
                if getattr(error, "response", None) and error.response.status_code in (404, 410):
                    subscription.delete()
                    continue
                raise
            if response.status_code >= 400:
                raise RuntimeError(f"Push provider returned HTTP {response.status_code}.")
            success_count += 1
        if not success_count:
            raise RuntimeError("All browser push subscriptions have expired.")
        return ""
    raise ValueError(f"Unsupported notification channel: {channel}")


def process_due_notifications():
    from events.models import Event
    from events.reminders import event_start, sync_event_reminders

    now = timezone.now()
    for event in Event.objects.filter(is_published=True, is_cancelled=False, date__gte=timezone.localdate()):
        if event.reminder_minutes and event_start(event) > now and not event.notifications.filter(
            reminder_minutes__isnull=False
        ).exists():
            sync_event_reminders(event)
    due = list(Notification.objects.filter(
        scheduled_for__lte=now,
        processed_at__isnull=True,
    ).values_list("id", flat=True)[:100])
    for notification_id in due:
        process_notification(notification_id)
