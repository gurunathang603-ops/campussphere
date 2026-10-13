from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from config.validators import IMAGE_EXT, max_5mb


def default_reminder_minutes():
    return [10080, 4320, 1440, 60]


def default_notification_channels():
    return ["in_app", "email", "sms", "push"]


class Event(models.Model):
    class Audience(models.TextChoices):
        ALL = "all", "All students and staff"
        STUDENTS = "students", "All students"
        STAFF = "staff", "All staff"
        DEPARTMENT = "department", "This department"
        CLASS = "class", "A specific class"
        SELECTED = "selected", "Selected users"

    class Type(models.TextChoices):
        CONFERENCE = "conference", "Conference"
        WORKSHOP = "workshop", "Workshop"
        SEMINAR = "seminar", "Seminar"
        SPORTS_DAY = "sports_day", "Sports Day"
        PONGAL = "pongal", "Pongal"
        CULTURAL = "cultural", "Cultural Event"
        SYMPOSIUM = "symposium", "Symposium"
        HACKATHON = "hackathon", "Hackathon"
        TECHNICAL = "technical", "Technical Event"
        OTHER = "other", "Other"

    department = models.ForeignKey("departments.Department", null=True, blank=True, on_delete=models.SET_NULL, related_name="events")
    title = models.CharField(max_length=200)
    event_type = models.CharField(max_length=20, choices=Type.choices, default=Type.OTHER)
    date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    time = models.TimeField(null=True, blank=True)
    venue = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    banner = models.ImageField(upload_to="events/banners/", validators=[IMAGE_EXT, max_5mb], null=True, blank=True)
    organizers = models.CharField(max_length=300, blank=True)
    coordinator = models.CharField("Faculty coordinator", max_length=150, blank=True)
    registration_link = models.URLField(blank=True)
    reminder_minutes = models.JSONField(default=default_reminder_minutes, blank=True)
    notification_channels = models.JSONField(default=default_notification_channels, blank=True)
    target_audience = models.CharField(max_length=12, choices=Audience.choices, default=Audience.DEPARTMENT)
    target_year = models.PositiveSmallIntegerField(null=True, blank=True)
    target_section = models.CharField(max_length=5, blank=True)
    target_user_ids = models.JSONField(default=list, blank=True)
    is_cancelled = models.BooleanField(default=False)
    schedule_text = models.TextField(blank=True, help_text="One item per line:  time | title | speaker")
    participants_count = models.PositiveIntegerField(default=0)
    participants = models.TextField(blank=True, help_text="One participant / team per line")
    results = models.TextField(blank=True)
    is_published = models.BooleanField(default=True)
    created_by = models.ForeignKey("accounts.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "-id"]

    def clean(self):
        if self.end_date and self.end_date < self.date:
            raise ValidationError({"end_date": "End date cannot be before the start date."})
        if not isinstance(self.reminder_minutes, list) or any(
            not isinstance(value, int) or value not in (10080, 4320, 1440, 60)
            for value in self.reminder_minutes
        ):
            raise ValidationError({"reminder_minutes": "Choose valid reminder intervals."})
        if not isinstance(self.notification_channels, list) or any(
            value not in ("in_app", "email", "sms", "push") for value in self.notification_channels
        ):
            raise ValidationError({"notification_channels": "Choose valid notification channels."})

    @property
    def is_upcoming(self):
        return (self.end_date or self.date) >= timezone.localdate()

    def __str__(self):
        return self.title


class EventGallery(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="gallery")
    image = models.ImageField(upload_to="events/gallery/", validators=[IMAGE_EXT, max_5mb])
    caption = models.CharField(max_length=200, blank=True)

    class Meta:
        verbose_name_plural = "event gallery"

    def __str__(self):
        return f"{self.event} image"


class EventRegistration(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="registrations")
    student = models.ForeignKey("accounts.Student", on_delete=models.CASCADE, related_name="event_registrations")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        constraints = [
            models.UniqueConstraint(fields=["event", "student"], name="unique_event_student_registration"),
        ]

    def __str__(self):
        return f"{self.student} - {self.event}"
