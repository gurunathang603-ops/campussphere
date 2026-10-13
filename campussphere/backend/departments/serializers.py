from rest_framework import serializers

from .models import Achievement, CollegeSettings, Department, GalleryImage


class CollegeSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = CollegeSettings
        fields = "__all__"


class DepartmentSerializer(serializers.ModelSerializer):
    hod = serializers.SerializerMethodField()
    programs_list = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = "__all__"

    def get_hod(self, obj):
        from accounts.models import HOD
        h = HOD.objects.filter(department=obj).select_related("user").first() or HOD.objects.select_related("user").first()
        if not h:
            return None
        return {"name": h.user.full_name, "email": h.user.email, "qualification": h.qualification, "hod_id": h.hod_id}

    def get_programs_list(self, obj):
        return [p.strip() for p in obj.programs.splitlines() if p.strip()]


class AchievementSerializer(serializers.ModelSerializer):
    category_label = serializers.CharField(source="get_category_display", read_only=True)

    class Meta:
        model = Achievement
        fields = "__all__"
        read_only_fields = ["department"]


class GalleryImageSerializer(serializers.ModelSerializer):
    category_label = serializers.CharField(source="get_category_display", read_only=True)

    class Meta:
        model = GalleryImage
        fields = "__all__"
