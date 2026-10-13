from django.db import models

from config.validators import IMAGE_EXT, PDF_EXT, max_5mb, max_15mb, validate_pdf


class Faculty(models.Model):
    department = models.ForeignKey("departments.Department", null=True, blank=True, on_delete=models.SET_NULL, related_name="faculty")
    user = models.OneToOneField("accounts.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="faculty_profile")
    name = models.CharField(max_length=150)
    designation = models.CharField(max_length=100)
    qualification = models.CharField(max_length=200, blank=True)
    specialization = models.CharField(max_length=200, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    subjects = models.TextField(blank=True, help_text="Comma separated subjects handled")
    photo = models.ImageField(upload_to="faculty/", validators=[IMAGE_EXT, max_5mb], null=True, blank=True)
    order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=True)

    class Meta:
        ordering = ["order", "name"]
        verbose_name_plural = "faculty"

    def __str__(self):
        return self.name


class Timetable(models.Model):
    DAYS = [(d, d) for d in ("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")]
    department = models.ForeignKey("departments.Department", null=True, blank=True, on_delete=models.SET_NULL, related_name="timetable")
    year = models.PositiveSmallIntegerField(choices=[(i, f"Year {i}") for i in range(1, 4)], default=1)
    section = models.CharField(max_length=5, choices=[("A", "A")], default="A")
    day = models.CharField(max_length=10, choices=DAYS)
    period = models.PositiveSmallIntegerField()
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    subject = models.CharField(max_length=150)
    faculty = models.ForeignKey(Faculty, null=True, blank=True, on_delete=models.SET_NULL, related_name="periods")
    room = models.CharField(max_length=50, blank=True)
    is_published = models.BooleanField(default=True)

    class Meta:
        ordering = ["year", "section", "period"]

    def __str__(self):
        return f"Y{self.year}{self.section} {self.day} P{self.period} {self.subject}"


class Syllabus(models.Model):
    department = models.ForeignKey("departments.Department", null=True, blank=True, on_delete=models.SET_NULL, related_name="syllabus")
    regulation = models.CharField(max_length=20, default="R2021")
    year = models.PositiveSmallIntegerField(choices=[(i, f"Year {i}") for i in range(1, 5)])
    semester = models.PositiveSmallIntegerField(choices=[(i, f"Semester {i}") for i in range(1, 7)])
    subject_code = models.CharField(max_length=20)
    subject_name = models.CharField(max_length=200)
    credits = models.PositiveSmallIntegerField(default=3)
    pdf = models.FileField(upload_to="syllabus/", validators=[PDF_EXT, max_15mb, validate_pdf], null=True, blank=True)
    is_published = models.BooleanField(default=True)

    class Meta:
        ordering = ["regulation", "semester", "subject_code"]
        verbose_name_plural = "syllabus"

    def __str__(self):
        return f"{self.subject_code} {self.subject_name}"
