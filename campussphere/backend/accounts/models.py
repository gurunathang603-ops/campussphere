from django.contrib.auth.models import AbstractUser
from django.contrib.auth.models import UserManager as DjangoUserManager
from django.core.validators import RegexValidator
from django.db import models


class UserManager(DjangoUserManager):
    def create_superuser(self, username, email=None, password=None, **extra):
        extra.setdefault("role", "hod")
        return super().create_superuser(username, email, password, **extra)


class User(AbstractUser):
    class Role(models.TextChoices):
        STUDENT = "student", "Student"
        STAFF = "staff", "Staff"
        HOD = "hod", "HOD"

    role = models.CharField(max_length=10, choices=Role.choices, default=Role.STUDENT)
    phone = models.CharField(
        max_length=20,
        blank=True,
        validators=[RegexValidator(r"^\+[1-9]\d{7,14}$", "Use an international number such as +919876543210.")],
    )
    sms_consent = models.BooleanField(default=False)
    must_change_password = models.BooleanField(default=True)
    objects = UserManager()

    @property
    def full_name(self):
        return self.get_full_name() or self.username

    @property
    def hod_level(self):
        """HOD, superuser, or staff who were explicitly granted HOD privileges."""
        if self.role == self.Role.HOD or self.is_superuser:
            return True
        if self.role == self.Role.STAFF:
            profile = getattr(self, "staff_profile", None)
            return bool(profile and profile.hod_privileges)
        return False

    def __str__(self):
        return f"{self.full_name} ({self.role})"


class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="student_profile")
    department = models.ForeignKey("departments.Department", null=True, blank=True, on_delete=models.SET_NULL, related_name="students")
    register_number = models.CharField(max_length=30, unique=True)
    year = models.PositiveSmallIntegerField(default=1, choices=[(i, f"Year {i}") for i in range(1, 5)])
    section = models.CharField(max_length=5, default="A")
    attendance_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    class Meta:
        ordering = ["year", "section", "register_number"]

    def __str__(self):
        return f"{self.register_number} - {self.user.full_name}"


class Staff(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="staff_profile")
    department = models.ForeignKey("departments.Department", null=True, blank=True, on_delete=models.SET_NULL, related_name="staff_members")
    staff_id = models.CharField(max_length=30, unique=True)
    designation = models.CharField(max_length=100, blank=True)
    hod_privileges = models.BooleanField(default=False, help_text="Grant this staff member HOD-level management rights.")

    class Meta:
        ordering = ["staff_id"]
        verbose_name_plural = "staff"

    def __str__(self):
        return f"{self.staff_id} - {self.user.full_name}"


class HOD(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="hod_profile")
    department = models.ForeignKey("departments.Department", null=True, blank=True, on_delete=models.SET_NULL, related_name="hods")
    hod_id = models.CharField(max_length=30, unique=True)
    qualification = models.CharField(max_length=200, blank=True)

    class Meta:
        verbose_name = "HOD"
        verbose_name_plural = "HODs"

    def __str__(self):
        return f"HOD {self.user.full_name}"
