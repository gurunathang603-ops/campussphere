from django.utils import timezone
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.base import ContentViewSet
from accounts.permissions import IsHODLevel, IsStaffLevel, is_hod_level

from .models import Achievement, CollegeSettings, Department, GalleryImage
from .serializers import (AchievementSerializer, CollegeSettingsSerializer, DepartmentSerializer,
                          GalleryImageSerializer)


class SettingsView(APIView):
    """Public GET. Only HOD-level users may change college branding."""

    def get_permissions(self):
        return [AllowAny()] if self.request.method == "GET" else [IsHODLevel()]

    def get(self, request):
        return Response(CollegeSettingsSerializer(CollegeSettings.load(), context={"request": request}).data)

    def patch(self, request):
        s = CollegeSettingsSerializer(CollegeSettings.load(), data=request.data, partial=True, context={"request": request})
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data)

    put = patch


STAFF_EDITABLE = {"tagline", "description", "vision", "mission", "programs", "hod_message", "email", "phone", "established_year"}


class DepartmentView(APIView):
    """Public GET. Staff may edit descriptive text; HOD-level may also change name/logos/images."""

    def get_permissions(self):
        return [AllowAny()] if self.request.method == "GET" else [IsStaffLevel()]

    def _dept(self):
        return Department.objects.first() or Department.objects.create(name="Department")

    def get(self, request):
        return Response(DepartmentSerializer(self._dept(), context={"request": request}).data)

    def patch(self, request):
        data = request.data
        if not is_hod_level(request.user):
            data = {k: data[k] for k in STAFF_EDITABLE if k in data}
        s = DepartmentSerializer(self._dept(), data=data, partial=True, context={"request": request})
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data)

    put = patch


class AchievementViewSet(ContentViewSet):
    queryset = Achievement.objects.all()
    serializer_class = AchievementSerializer
    filter_fields = ("category",)
    search_fields = ("title", "person_name", "description")


class GalleryViewSet(ContentViewSet):
    queryset = GalleryImage.objects.all()
    serializer_class = GalleryImageSerializer
    filter_fields = ("category",)
    search_fields = ("title",)
    staff_can_delete = True


class StatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        from accounts.models import Staff, Student
        from announcements.models import Announcement
        from documents.models import Document
        from events.models import Event

        today = timezone.localdate()
        ev = Event.objects.filter(is_published=True)
        docs = Document.objects.filter(is_published=True)
        return Response({
            "students": Student.objects.count(),
            "staff": Staff.objects.count(),
            "events_total": ev.count(),
            "events_conducted": ev.filter(date__lt=today).count(),
            "upcoming_events": ev.filter(date__gte=today).count(),
            "workshops": ev.filter(event_type="workshop").count(),
            "conferences": ev.filter(event_type="conference").count(),
            "achievements": Achievement.objects.filter(is_published=True).count(),
            "documents": docs.count(),
            "announcements": Announcement.objects.filter(is_published=True).count(),
            "gallery": GalleryImage.objects.filter(is_published=True).count(),
            "events_by_type": [{"type": v, "label": l, "count": ev.filter(event_type=v).count()} for v, l in Event.Type.choices],
            "documents_by_category": [{"category": v, "label": l, "count": docs.filter(category=v).count()} for v, l in Document.Category.choices],
        })
