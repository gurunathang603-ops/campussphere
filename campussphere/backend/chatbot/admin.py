from django.contrib import admin

from .models import ChatHistory


@admin.register(ChatHistory)
class ChatHistoryAdmin(admin.ModelAdmin):
    list_display = ("message", "intent", "user", "used_llm", "created_at")
    list_filter = ("intent", "used_llm")
    search_fields = ("message", "response")
