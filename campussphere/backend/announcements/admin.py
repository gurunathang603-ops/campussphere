from django.contrib import admin

from .models import Announcement, Notification


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ("title", "priority", "date", "is_published")
    list_filter = ("priority", "is_published")
    list_editable = ("is_published",)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("title", "kind", "audience", "delivery_status", "scheduled_for", "created_at")
    list_filter = ("kind", "audience", "delivery_status")
