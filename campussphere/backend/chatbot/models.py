from django.conf import settings
from django.db import models


class ChatHistory(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="chats")
    session_id = models.CharField(max_length=64, blank=True, db_index=True)
    message = models.TextField()
    response = models.TextField()
    intent = models.CharField(max_length=40, blank=True)
    used_llm = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "chat history"

    def __str__(self):
        return self.message[:60]
