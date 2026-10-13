from django.contrib import admin

from .models import Event, EventGallery, EventRegistration


class GalleryInline(admin.TabularInline):
    model = EventGallery
    extra = 1


class RegistrationInline(admin.TabularInline):
    model = EventRegistration
    fields = ("student", "created_at")
    readonly_fields = fields
    extra = 0
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("title", "event_type", "date", "venue", "registered_students", "is_published")
    list_filter = ("event_type", "is_published")
    list_editable = ("is_published",)
    search_fields = ("title", "venue")
    inlines = [GalleryInline, RegistrationInline]

    @admin.display(description="Registered students")
    def registered_students(self, obj):
        return obj.registrations.count()
