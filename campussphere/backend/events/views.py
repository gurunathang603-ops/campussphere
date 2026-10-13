from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Count, Exists, OuterRef, Q
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.base import ContentViewSet
from accounts.models import Student

from .models import Event, EventGallery, EventRegistration
from .serializers import EventGallerySerializer, EventSerializer


class EventViewSet(ContentViewSet):
    queryset = Event.objects.prefetch_related("gallery").annotate(
        registered_students_count=Count("registrations", distinct=True),
    )
    serializer_class = EventSerializer
    search_fields = ("title", "description", "venue", "organizers", "coordinator")

    def get_queryset(self):
        qs, p, today = super().get_queryset(), self.request.query_params, timezone.localdate()
        user = self.request.user
        registrations = EventRegistration.objects.filter(event_id=OuterRef("pk"))
        if user.is_authenticated and user.role == "student":
            registrations = registrations.filter(student__user_id=user.pk)
        else:
            registrations = registrations.none()
        qs = qs.annotate(is_registered=Exists(registrations))
        if p.get("type"):
            qs = qs.filter(event_type=p["type"])
        if p.get("upcoming"):
            qs = qs.filter(Q(date__gte=today) | Q(end_date__gte=today)).order_by("date", "time")
        elif p.get("past"):
            qs = qs.filter(Q(end_date__lt=today) | Q(end_date__isnull=True, date__lt=today)).order_by("-date")
        return qs

    def _save_gallery(self, event):
        for f in self.request.FILES.getlist("gallery_uploads"):
            g = EventGallery(event=event, image=f)
            try:
                g.full_clean()
            except DjangoValidationError as e:
                raise ValidationError({"gallery_uploads": e.messages})
            g.save()

    def perform_create(self, serializer):
        profile = getattr(self.request.user, "staff_profile", None) or getattr(self.request.user, "hod_profile", None)
        department = getattr(profile, "department", None)
        if department:
            serializer.save(created_by=self.request.user, department=department)
        else:
            super().perform_create(serializer)
        self._save_gallery(serializer.instance)

    def perform_update(self, serializer):
        serializer.save()
        self._save_gallery(serializer.instance)

    def _student_for_registration(self):
        if self.request.user.role != "student":
            raise PermissionDenied("Only students can register for events.")
        try:
            return self.request.user.student_profile
        except Student.DoesNotExist:
            raise PermissionDenied("A student profile is required to register for events.")

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def register(self, request, pk=None):
        event = self.get_object()
        student = self._student_for_registration()
        if event.is_cancelled:
            raise ValidationError({"detail": "This event has been cancelled."})
        if not event.is_upcoming:
            raise ValidationError({"detail": "Registration is closed for this event."})
        _, created = EventRegistration.objects.get_or_create(event=event, student=student)
        count = EventRegistration.objects.filter(event=event).count()
        return Response(
            {"is_registered": True, "registered_students_count": count},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    @action(detail=True, methods=["delete"], permission_classes=[IsAuthenticated])
    def unregister(self, request, pk=None):
        event = self.get_object()
        student = self._student_for_registration()
        EventRegistration.objects.filter(event=event, student=student).delete()
        count = EventRegistration.objects.filter(event=event).count()
        return Response({"is_registered": False, "registered_students_count": count})


class EventGalleryViewSet(ContentViewSet):
    queryset = EventGallery.objects.all()
    serializer_class = EventGallerySerializer
    filter_fields = ("event",)
    staff_can_delete = True
