from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Q
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from accounts.base import ContentViewSet

from .models import Event, EventGallery
from .serializers import EventGallerySerializer, EventSerializer


class EventViewSet(ContentViewSet):
    queryset = Event.objects.prefetch_related("gallery").all()
    serializer_class = EventSerializer
    search_fields = ("title", "description", "venue", "organizers", "coordinator")

    def get_queryset(self):
        qs, p, today = super().get_queryset(), self.request.query_params, timezone.localdate()
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


class EventGalleryViewSet(ContentViewSet):
    queryset = EventGallery.objects.all()
    serializer_class = EventGallerySerializer
    filter_fields = ("event",)
    staff_can_delete = True
