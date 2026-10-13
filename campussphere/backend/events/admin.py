from django.contrib import admin

from .models import Event, EventGallery


class GalleryInline(admin.TabularInline):
    model = EventGallery
    extra = 1


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("title", "event_type", "date", "venue", "is_published")
    list_filter = ("event_type", "is_published")
    list_editable = ("is_published",)
    search_fields = ("title", "venue")
    inlines = [GalleryInline]
