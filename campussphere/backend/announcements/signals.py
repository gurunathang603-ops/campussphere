"""Auto-create notifications when content is published."""
from datetime import timedelta

from django.db.models.signals import post_save, pre_save
from django.utils import timezone


def notify(title, message, kind, link, audience="all", dedupe_minutes=0, event=None, channels=None):
    from .models import Notification
    if dedupe_minutes and Notification.objects.filter(
            kind=kind, created_at__gte=timezone.now() - timedelta(minutes=dedupe_minutes)).exists():
        return
    notification = Notification(
        title=title, message=message, kind=kind, link=link, audience=audience,
        channels=channels if channels is not None else ["email", "push"], scheduled_for=timezone.now(),
    )
    if event:
        notification.event = event
        notification.department = event.department
        notification.target_year = event.target_year
        notification.target_section = event.target_section
        notification.target_user_ids = event.target_user_ids
    notification.save()


def remember_published_state(sender, instance, **kw):
    if instance.pk:
        instance._was_published = sender.objects.filter(pk=instance.pk).values_list("is_published", flat=True).first()
    else:
        instance._was_published = False


def on_event(sender, instance, created, **kw):
    if instance.is_published and not instance.is_cancelled and (created or not instance._was_published):
        audience = {
            "students": "student", "staff": "staff", "department": "department",
            "class": "class", "selected": "selected",
        }.get(instance.target_audience, "all")
        details = f"{instance.get_event_type_display()} on {instance.date:%d %b %Y}"
        if instance.time:
            details += f" at {instance.time:%I:%M %p}"
        if instance.venue:
            details += f" at {instance.venue}"
        if instance.description:
            details += f". {instance.description[:500]}"
        if instance.registration_link:
            details += f" Register: {instance.registration_link}"
        notify(
            f"New event: {instance.title}", details, "event", f"/events/{instance.id}",
            audience=audience, event=instance, channels=instance.notification_channels,
        )


def on_announcement(sender, instance, created, **kw):
    if instance.is_published and (created or not instance._was_published):
        kind = "announcement" if instance.priority == "normal" else "important"
        prefix = "" if instance.priority == "normal" else f"{instance.get_priority_display().upper()}: "
        notify(f"{prefix}{instance.title}", instance.description, kind, "/announcements")


def on_document(sender, instance, created, **kw):
    if created and instance.is_published:
        audience = {"public": "all", "student": "student", "staff": "staff"}[instance.visibility]
        notify(f"New document: {instance.title}", instance.get_category_display(), "document", "/documents", audience)


def on_timetable(sender, instance, **kw):
    notify("Timetable updated", "The class timetable has been updated. Please check the latest schedule.",
           "timetable", "/timetable", dedupe_minutes=30)


def connect():
    from academics.models import Timetable
    from documents.models import Document
    from events.models import Event
    from events.reminders import remember_event_state, update_event_reminders

    from .models import Announcement
    pre_save.connect(remember_published_state, sender=Event, dispatch_uid="remember_event_publication")
    pre_save.connect(remember_event_state, sender=Event, dispatch_uid="remember_event_reminder_state")
    pre_save.connect(remember_published_state, sender=Announcement, dispatch_uid="remember_announcement_publication")
    post_save.connect(on_event, sender=Event, dispatch_uid="n_event")
    post_save.connect(update_event_reminders, sender=Event, dispatch_uid="sync_event_reminders")
    post_save.connect(on_announcement, sender=Announcement, dispatch_uid="n_ann")
    post_save.connect(on_document, sender=Document, dispatch_uid="n_doc")
    post_save.connect(on_timetable, sender=Timetable, dispatch_uid="n_tt")
