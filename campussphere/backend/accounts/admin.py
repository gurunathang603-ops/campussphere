from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import HOD, Staff, Student, User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ("username", "first_name", "last_name", "role", "sms_consent", "is_active")
    list_filter = ("role", "sms_consent", "is_active")
    fieldsets = UserAdmin.fieldsets + (("CampusSphere", {"fields": ("role", "phone", "sms_consent")}),)
    add_fieldsets = UserAdmin.add_fieldsets + (("CampusSphere", {"fields": ("role", "phone", "sms_consent")}),)


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ("register_number", "user", "year", "section", "attendance_percentage")
    list_filter = ("year", "section")
    search_fields = ("register_number", "user__first_name", "user__last_name")


@admin.register(Staff)
class StaffAdmin(admin.ModelAdmin):
    list_display = ("staff_id", "user", "designation", "hod_privileges")
    search_fields = ("staff_id", "user__first_name")


@admin.register(HOD)
class HODAdmin(admin.ModelAdmin):
    list_display = ("hod_id", "user", "department")
