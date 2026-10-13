from rest_framework import serializers

from .models import Event, EventGallery


class EventGallerySerializer(serializers.ModelSerializer):
    class Meta:
        model = EventGallery
        fields = "__all__"


class EventSerializer(serializers.ModelSerializer):
    gallery = EventGallerySerializer(many=True, read_only=True)
    schedule = serializers.SerializerMethodField()
    documents = serializers.SerializerMethodField()
    type_label = serializers.CharField(source="get_event_type_display", read_only=True)
    is_upcoming = serializers.BooleanField(read_only=True)

    class Meta:
        model = Event
        fields = "__all__"
        read_only_fields = ["created_by", "department", "created_at"]

    def validate(self, attrs):
        start = attrs.get("date", getattr(self.instance, "date", None))
        end = attrs.get("end_date", getattr(self.instance, "end_date", None))
        if start and end and end < start:
            raise serializers.ValidationError({"end_date": "End date cannot be before the start date."})
        reminder_minutes = attrs.get("reminder_minutes", getattr(self.instance, "reminder_minutes", []))
        if not isinstance(reminder_minutes, list) or any(
            type(value) is not int or value not in (10080, 4320, 1440, 60) for value in reminder_minutes
        ):
            raise serializers.ValidationError({"reminder_minutes": "Choose reminders at 7 days, 3 days, 1 day, or 1 hour."})
        channels = attrs.get("notification_channels", getattr(self.instance, "notification_channels", []))
        if not isinstance(channels, list) or any(value not in ("in_app", "email", "sms", "push") for value in channels):
            raise serializers.ValidationError({"notification_channels": "Choose valid notification channels."})
        target_users = attrs.get("target_user_ids", getattr(self.instance, "target_user_ids", []))
        if not isinstance(target_users, list) or any(type(value) is not int or value < 1 for value in target_users):
            raise serializers.ValidationError({"target_user_ids": "User IDs must be a list of positive integers."})
        if attrs.get("target_audience", getattr(self.instance, "target_audience", "")) == "selected" and not target_users:
            raise serializers.ValidationError({"target_user_ids": "Add at least one user ID for a selected audience."})
        target_audience = attrs.get("target_audience", getattr(self.instance, "target_audience", ""))
        target_year = attrs.get("target_year", getattr(self.instance, "target_year", None))
        target_section = attrs.get("target_section", getattr(self.instance, "target_section", ""))
        if target_audience == "class" and (target_year not in (1, 2, 3, 4) or not target_section):
            raise serializers.ValidationError({"target_year": "Choose a year and section for the class audience."})
        return attrs

    def get_schedule(self, obj):
        rows = []
        for line in obj.schedule_text.splitlines():
            parts = [p.strip() for p in line.split("|")]
            if parts and parts[0]:
                rows.append({"time": parts[0], "title": parts[1] if len(parts) > 1 else "",
                             "speaker": parts[2] if len(parts) > 2 else ""})
        return rows

    def get_documents(self, obj):
        from documents.serializers import DocumentSerializer
        from documents.utils import visible_documents
        request = self.context.get("request")
        docs = visible_documents(obj.documents.filter(is_published=True), getattr(request, "user", None))
        return DocumentSerializer(docs, many=True, context=self.context).data
