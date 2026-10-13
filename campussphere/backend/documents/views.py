import mimetypes

from django.http import FileResponse
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny

from accounts.base import ContentViewSet

from .models import Document
from .serializers import DocumentSerializer
from .utils import visible_documents


class DocumentViewSet(ContentViewSet):
    queryset = Document.objects.select_related("event")
    serializer_class = DocumentSerializer
    filter_fields = ("category", "event")
    search_fields = ("title", "description")

    def get_queryset(self):
        return visible_documents(super().get_queryset(), self.request.user)

    @action(detail=True, methods=["get"], permission_classes=[AllowAny])
    def download(self, request, pk=None):
        """Permission-checked file delivery (restricted docs are never served without auth)."""
        doc = self.get_object()  # queryset already filtered by visibility -> 404 if not allowed
        ctype = mimetypes.guess_type(doc.file.name)[0] or "application/octet-stream"
        resp = FileResponse(doc.file.open("rb"), content_type=ctype)
        disp = "attachment" if request.query_params.get("dl") else "inline"
        resp["Content-Disposition"] = f'{disp}; filename="{doc.file.name.split("/")[-1]}"'
        return resp
