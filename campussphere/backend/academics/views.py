from accounts.base import ContentViewSet

from .models import Faculty, Syllabus, Timetable
from .serializers import FacultySerializer, SyllabusSerializer, TimetableSerializer


class FacultyViewSet(ContentViewSet):
    queryset = Faculty.objects.all()
    serializer_class = FacultySerializer
    write_level = "hod"  # only HOD-level users manage faculty profiles
    search_fields = ("name", "designation", "specialization", "subjects")


class TimetableViewSet(ContentViewSet):
    queryset = Timetable.objects.select_related("faculty")
    serializer_class = TimetableSerializer
    filter_fields = ("year", "section", "day")
    search_fields = ("subject", "room", "faculty__name")


class SyllabusViewSet(ContentViewSet):
    queryset = Syllabus.objects.all()
    serializer_class = SyllabusSerializer
    filter_fields = ("year", "semester", "regulation")
    search_fields = ("subject_name", "subject_code")
