from datetime import datetime, time, timedelta

from django.db import transaction
from django.utils import timezone

from announcements.models import Notification, NotificationDelivery


REMINDER_LABELS = {
    10080: "7 days",
    4320: "3 days",
    1440: "1 day",
    60: "1 hour",
}


def event_start(event):
    local_time = event.time or time.min
    return timezone.make_aware(datetime.combine(event.date, local_time), timezone.get_current_timezone())


def sync_event_reminders(event, previous=None):
    starts_at = event_start(event)
    rescheduled = bool(previous and (
        previous.get("date") != event.date or previous.get("time") != event.time
    ))
    if previous and (
        (previous.get("is_cancelled") and not event.is_cancelled)
        or (not previous.get("is_published") and event.is_published)
    ):
        Notification.objects.filter(
            event=event, cancelled_notice=True, delivery_status="pending"
        ).update(delivery_status="cancelled", processed_at=timezone.now())
        Notification.objects.filter(
            event=event, reminder_minutes__isnull=False, delivery_status="cancelled"
        ).delete()
    if previous and previous.get("is_published") and not previous.get("is_cancelled") and event.is_cancelled:
        Notification.objects.filter(
            event=event, cancelled_notice=False,
            delivery_status__in=("pending", "failed"), processed_at__isnull=True,
        ).update(
            delivery_status="cancelled", processed_at=timezone.now()
        )
        Notification.objects.create(
            event=event,
            title=f"Cancelled: {event.title}",
            message=f"{event.title} scheduled for {starts_at:%d %b %Y, %I:%M %p} has been cancelled.",
            kind=Notification.Kind.EVENT,
            link=f"/events/{event.pk}",
            audience=_notification_audience(event.target_audience),
            department=event.department,
            target_year=event.target_year,
            target_section=event.target_section,
            target_user_ids=event.target_user_ids,
            channels=event.notification_channels,
            scheduled_for=timezone.now(),
            cancelled_notice=True,
        )
        return
    if not event.is_published:
        Notification.objects.filter(
            event=event, cancelled_notice=False,
            delivery_status__in=("pending", "failed"), processed_at__isnull=True,
        ).update(delivery_status="cancelled", processed_at=timezone.now())
        return
    if event.is_cancelled:
        return

    selected = set(event.reminder_minutes)
    existing = {
        item.reminder_minutes: item
        for item in Notification.objects.filter(event=event, reminder_minutes__isnull=False)
    }
    for minutes in set(existing) - selected:
        item = existing[minutes]
        if item.delivery_status == "pending":
            item.delete()

    for minutes in selected:
        scheduled_for = starts_at - timedelta(minutes=minutes)
        title = f"Reminder: {event.title}"
        time_text = starts_at.strftime("%d %b %Y at %I:%M %p")
        message = f"{event.title} starts {time_text} (reminder: {REMINDER_LABELS.get(minutes, f'{minutes} minutes')} before)."
        if event.venue:
            message += f" Venue: {event.venue}."
        if event.description:
            message += f" {event.description[:500]}"
        if event.registration_link:
            message += f" Register: {event.registration_link}"
        item = existing.get(minutes)
        if item is None:
            if scheduled_for <= timezone.now():
                continue
            Notification.objects.create(
                event=event,
                reminder_minutes=minutes,
                title=title,
                message=message,
                kind=Notification.Kind.EVENT,
                link=f"/events/{event.pk}",
                audience=_notification_audience(event.target_audience),
                department=event.department,
                target_year=event.target_year,
                target_section=event.target_section,
                target_user_ids=event.target_user_ids,
                channels=event.notification_channels,
                scheduled_for=scheduled_for,
            )
        elif item:
            if item.delivery_status == "failed" and item.processed_at and rescheduled:
                NotificationDelivery.objects.filter(
                    notification=item, status=NotificationDelivery.Status.FAILED
                ).update(status=NotificationDelivery.Status.PENDING, attempts=0, error="")
                item.delivery_status = "pending"
                item.processed_at = None
            if item.delivery_status not in ("pending", "failed") or item.processed_at is not None:
                continue
            item.title = title
            item.message = message
            item.scheduled_for = scheduled_for
            item.audience = _notification_audience(event.target_audience)
            item.department = event.department
            item.target_year = event.target_year
            item.target_section = event.target_section
            item.target_user_ids = event.target_user_ids
            item.channels = event.notification_channels
            item.delivery_status = "pending"
            item.save(update_fields=[
                "title", "message", "scheduled_for", "audience", "department",
                "target_year", "target_section", "target_user_ids", "channels",
                "delivery_status", "processed_at",
            ])
            NotificationDelivery.objects.filter(notification=item).exclude(channel="in_app").exclude(
                channel__in=event.notification_channels
            ).exclude(status=NotificationDelivery.Status.SENT).update(
                status=NotificationDelivery.Status.SKIPPED, error=""
            )


def _notification_audience(value):
    return {
        "students": Notification.Audience.STUDENT,
        "staff": Notification.Audience.STAFF,
        "department": Notification.Audience.DEPARTMENT,
        "class": Notification.Audience.CLASS,
        "selected": Notification.Audience.SELECTED,
    }.get(value, Notification.Audience.ALL)


def remember_event_state(sender, instance, **kwargs):
    instance._notification_previous = None
    if instance.pk:
        instance._notification_previous = sender.objects.filter(pk=instance.pk).values(
            "date", "time", "is_published", "is_cancelled"
        ).first()


def update_event_reminders(sender, instance, **kwargs):
    previous = getattr(instance, "_notification_previous", None)
    transaction.on_commit(lambda: sync_event_reminders(instance, previous))
