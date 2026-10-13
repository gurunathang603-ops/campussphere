import os
import uuid

from django.db import models

from config.validators import DOC_EXT, max_15mb


def document_path(instance, filename):
    # random folder makes stored URLs hard to guess
    return f"documents/{uuid.uuid4().hex[:12]}/{os.path.basename(filename)}"


class Document(models.Model):
    class Category(models.TextChoices):
        SYLLABUS = "syllabus", "Syllabus"
        TIMETABLE = "timetable", "Timetable"
        CIRCULAR = "circular", "Circulars"
        EVENT = "event", "Event Documents"
        CONFERENCE = "conference", "Conference Documents"
        WORKSHOP = "workshop", "Workshop Documents"
        ACADEMIC = "academic", "Academic Documents"
        REPORT = "report", "Department Reports"
        STUDENT = "student", "Student Documents"

    class Visibility(models.TextChoices):
        PUBLIC = "public", "Public (everyone)"
        STUDENT = "student", "Logged-in students & staff"
        STAFF = "staff", "Staff & HOD only"

    department = models.ForeignKey("departments.Department", null=True, blank=True, on_delete=models.SET_NULL, related_name="documents")
    event = models.ForeignKey("events.Event", null=True, blank=True, on_delete=models.SET_NULL, related_name="documents")
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.ACADEMIC)
    description = models.CharField(max_length=300, blank=True)
    file = models.FileField(upload_to=document_path, validators=[DOC_EXT, max_15mb])
    visibility = models.CharField(max_length=10, choices=Visibility.choices, default=Visibility.PUBLIC)
    is_published = models.BooleanField(default=True)
    created_by = models.ForeignKey("accounts.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return self.title
