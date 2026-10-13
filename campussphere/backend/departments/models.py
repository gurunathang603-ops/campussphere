from django.db import models

from config.validators import IMAGE_EXT, max_5mb

IMG = dict(validators=[IMAGE_EXT, max_5mb], blank=True, null=True)


class CollegeSettings(models.Model):
    """Singleton row holding college-wide branding."""
    college_name = models.CharField(max_length=200, default="Your College Name")
    college_tagline = models.CharField(max_length=250, blank=True)
    college_logo = models.ImageField(upload_to="branding/", **IMG)
    favicon = models.ImageField(upload_to="branding/", **IMG)
    banner = models.ImageField(upload_to="branding/", **IMG)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=40, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)
    facebook = models.URLField(blank=True)
    instagram = models.URLField(blank=True)
    linkedin = models.URLField(blank=True)
    youtube = models.URLField(blank=True)
    twitter = models.URLField(blank=True)

    class Meta:
        verbose_name = "College settings"
        verbose_name_plural = "College settings"

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    def __str__(self):
        return self.college_name


class Department(models.Model):
    name = models.CharField(max_length=200)
    short_name = models.CharField(max_length=30, blank=True)
    code = models.CharField(max_length=20, blank=True)
    tagline = models.CharField(max_length=250, blank=True)
    description = models.TextField(blank=True)
    vision = models.TextField(blank=True)
    mission = models.TextField(blank=True)
    programs = models.TextField(blank=True, help_text="One programme per line")
    hod_message = models.TextField(blank=True)
    established_year = models.PositiveIntegerField(null=True, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=40, blank=True)
    logo = models.ImageField(upload_to="branding/", **IMG)
    hero_image = models.ImageField(upload_to="branding/", **IMG)
    about_image = models.ImageField(upload_to="branding/", **IMG)

    def __str__(self):
        return self.name


class Achievement(models.Model):
    class Category(models.TextChoices):
        STUDENT = "student", "Student"
        FACULTY = "faculty", "Faculty"
        AWARD = "award", "Award"
        HACKATHON = "hackathon", "Hackathon"
        SPORTS = "sports", "Sports"
        CONFERENCE = "conference", "Conference"

    department = models.ForeignKey(Department, null=True, blank=True, on_delete=models.SET_NULL, related_name="achievements")
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.STUDENT)
    person_name = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    date = models.DateField(null=True, blank=True)
    image = models.ImageField(upload_to="achievements/", **IMG)
    is_published = models.BooleanField(default=True)

    class Meta:
        ordering = ["-date", "-id"]

    def __str__(self):
        return self.title


class GalleryImage(models.Model):
    class Category(models.TextChoices):
        EVENTS = "events", "Events"
        SPORTS = "sports", "Sports"
        CONFERENCE = "conference", "Conference"
        WORKSHOPS = "workshops", "Workshops"
        CULTURAL = "cultural", "Cultural"
        ACTIVITIES = "activities", "Department Activities"

    title = models.CharField(max_length=150, blank=True)
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.EVENTS)
    image = models.ImageField(upload_to="gallery/", validators=[IMAGE_EXT, max_5mb])
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return self.title or f"Image {self.pk}"
