from rest_framework import serializers

from .models import Faculty, Syllabus, Timetable


class FacultySerializer(serializers.ModelSerializer):
    subjects_list = serializers.SerializerMethodField()

    class Meta:
        model = Faculty
        fields = "__all__"
        read_only_fields = ["department", "user"]

    def get_subjects_list(self, obj):
        return [s.strip() for s in obj.subjects.split(",") if s.strip()]


class TimetableSerializer(serializers.ModelSerializer):
    faculty_name = serializers.SerializerMethodField()

    class Meta:
        model = Timetable
        fields = "__all__"
        read_only_fields = ["department"]

    def get_faculty_name(self, obj):
        return obj.faculty.name if obj.faculty else ""

    def validate(self, a):
        s, e = a.get("start_time"), a.get("end_time")
        if s and e and e <= s:
            raise serializers.ValidationError({"end_time": "End time must be after start time."})
        return a


class SyllabusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Syllabus
        fields = "__all__"
        read_only_fields = ["department"]
