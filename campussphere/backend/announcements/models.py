from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone

from config.validators import DOC_EXT, max_15mb


class Announcement(models.Model):
    class Priority(models.TextChoices):
        NORMAL = "normal", "Normal"
        IMPORTANT = "important", "Important"
        URGENT = "urgent", "Urgent"

    department = models.ForeignKey("departments.Department", null=True, blank=True, on_delete=models.SET_NULL, related_name="announcements")
    title = models.CharField(max_length=200)
    description = models.TextField()
    date = models.DateField(default=timezone.localdate)
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.NORMAL)
    attachment = models.FileField(upload_to="announcements/", validators=[DOC_EXT, max_15mb], null=True, blank=True)
    is_published = models.BooleanField(default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "-id"]

    @property
    def is_new(self):
        return self.date >= timezone.localdate() - timedelta(days=7)

    def __str__(self):
        return self.title


class Notification(models.Model):
    class Kind(models.TextChoices):
        EVENT = "event", "New event"
        ANNOUNCEMENT = "announcement", "New announcement"
        DOCUMENT = "document", "New document"
        TIMETABLE = "timetable", "Timetable update"
        IMPORTANT = "important", "Important"

    class Audience(models.TextChoices):
        ALL = "all", "Everyone"
        STUDENT = "student", "Students"
        STAFF = "staff", "Staff"
        DEPARTMENT = "department", "Department"
        CLASS = "class", "Class"
        SELECTED = "selected", "Selected users"

    title = models.CharField(max_length=200)
    message = models.TextField(blank=True)
    kind = models.CharField(max_length=20, choices=Kind.choices, default=Kind.IMPORTANT)
    link = models.CharField(max_length=200, blank=True)
    audience = models.CharField(max_length=12, choices=Audience.choices, default=Audience.ALL)
    department = models.ForeignKey("departments.Department", null=True, blank=True, on_delete=models.SET_NULL)
    target_year = models.PositiveSmallIntegerField(null=True, blank=True)
    target_section = models.CharField(max_length=5, blank=True)
    target_user_ids = models.JSONField(default=list, blank=True)
    event = models.ForeignKey("events.Event", null=True, blank=True, on_delete=models.CASCADE, related_name="notifications")
    reminder_minutes = models.PositiveIntegerField(null=True, blank=True)
    scheduled_for = models.DateTimeField(null=True, blank=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    delivery_status = models.CharField(max_length=12, default="pending")
    channels = models.JSONField(default=list, blank=True)
    cancelled_notice = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    read_by = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name="read_notifications")

    class Meta:
        ordering = ["-created_at", "-id"]
        constraints = [
            models.UniqueConstraint(
                fields=("event", "reminder_minutes"),
                condition=models.Q(event__isnull=False, reminder_minutes__isnull=False),
                name="unique_event_reminder_interval",
            ),
        ]

    def __str__(self):
        return self.title


class NotificationDelivery(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SENT = "sent", "Sent"
        DELIVERED = "delivered", "Delivered"
        FAILED = "failed", "Failed"
        SKIPPED = "skipped", "Skipped"

    notification = models.ForeignKey(Notification, on_delete=models.CASCADE, related_name="deliveries")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notification_deliveries")
    channel = models.CharField(max_length=10)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    attempts = models.PositiveSmallIntegerField(default=0)
    provider_id = models.CharField(max_length=100, blank=True)
    error = models.CharField(max_length=300, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=("notification", "user", "channel"), name="unique_notification_delivery")
        ]
        ordering = ["-updated_at"]


class NotificationPreference(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notification_preferences")
    email_enabled = models.BooleanField(default=True)
    sms_enabled = models.BooleanField(default=False)
    push_enabled = models.BooleanField(default=False)


class PushSubscription(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="push_subscriptions")
    endpoint = models.URLField(max_length=1000, unique=True)
    p256dh = models.CharField(max_length=200)
    auth = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
