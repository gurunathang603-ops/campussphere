from django.contrib import admin

from .models import Achievement, CollegeSettings, Department, GalleryImage

admin.site.register(CollegeSettings)
admin.site.register(Department)


@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "person_name", "date", "is_published")
    list_filter = ("category", "is_published")
    list_editable = ("is_published",)


@admin.register(GalleryImage)
class GalleryAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "is_published", "created_at")
    list_filter = ("category", "is_published")
    list_editable = ("is_published",)
