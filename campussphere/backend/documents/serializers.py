import os

from rest_framework import serializers

from .models import Document


class DocumentSerializer(serializers.ModelSerializer):
    category_label = serializers.CharField(source="get_category_display", read_only=True)
    visibility_label = serializers.CharField(source="get_visibility_display", read_only=True)

    class Meta:
        model = Document
        fields = "__all__"
        read_only_fields = ["created_by", "department", "created_at"]

    def to_representation(self, obj):
        data = super().to_representation(obj)
        data["download_url"] = f"/api/documents/{obj.id}/download/"
        data["filename"] = os.path.basename(obj.file.name) if obj.file else ""
        if obj.visibility != "public":  # never expose direct media URL of restricted files
            data["file"] = None
        return data
