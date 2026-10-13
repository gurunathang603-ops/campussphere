from django.contrib import admin

from .models import Faculty, Syllabus, Timetable


@admin.register(Faculty)
class FacultyAdmin(admin.ModelAdmin):
    list_display = ("name", "designation", "specialization", "email", "is_published")
    list_editable = ("is_published",)
    search_fields = ("name",)


@admin.register(Timetable)
class TimetableAdmin(admin.ModelAdmin):
    list_display = ("year", "section", "day", "period", "subject", "faculty", "room")
    list_filter = ("year", "section", "day")


@admin.register(Syllabus)
class SyllabusAdmin(admin.ModelAdmin):
    list_display = ("subject_code", "subject_name", "regulation", "year", "semester", "is_published")
    list_filter = ("regulation", "year", "semester", "is_published")
    search_fields = ("subject_code", "subject_name")
