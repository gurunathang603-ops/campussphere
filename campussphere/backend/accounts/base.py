from django.db.models import Q
from rest_framework import viewsets

from .permissions import ContentPermission, is_staff_level


class ContentViewSet(viewsets.ModelViewSet):
    """Shared behaviour for content resources.
    - public users only see published rows; staff/HOD pass ?manage=1 to also see drafts
    - exact-match filters (filter_fields), text search (?q=) and ?limit=
    - auto-fills created_by / department on create"""
    permission_classes = [ContentPermission]
    write_level = "staff"
    filter_fields = ()
    search_fields = ()

    def _has(self, name):
        return any(f.name == name for f in self.queryset.model._meta.get_fields())

    def get_queryset(self):
        qs = super().get_queryset()
        p = self.request.query_params
        manage = p.get("manage") and is_staff_level(self.request.user)
        if not manage and self._has("is_published"):
            qs = qs.filter(is_published=True)
        for f in self.filter_fields:
            v = p.get(f)
            if v not in (None, ""):
                qs = qs.filter(**{f: v})
        q = (p.get("q") or "").strip()
        if q and self.search_fields:
            cond = Q()
            for f in self.search_fields:
                cond |= Q(**{f + "__icontains": q})
            qs = qs.filter(cond)
        return qs

    def filter_queryset(self, queryset):
        qs = super().filter_queryset(queryset)
        limit = self.request.query_params.get("limit")
        if self.action == "list" and limit and limit.isdigit():
            qs = qs[: int(limit)]
        return qs

    def perform_create(self, serializer):
        from departments.models import Department
        extra = {}
        if self._has("created_by"):
            extra["created_by"] = self.request.user
        if self._has("department") and "department" not in serializer.validated_data:
            extra["department"] = Department.objects.first()
        serializer.save(**extra)
