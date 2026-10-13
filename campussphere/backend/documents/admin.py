from django.contrib import admin

from .models import Document


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "visibility", "is_published", "created_at")
    list_filter = ("category", "visibility", "is_published")
    list_editable = ("is_published",)
    search_fields = ("title",)
