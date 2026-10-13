from rest_framework.routers import SimpleRouter

from . import views

router = SimpleRouter()
router.register("events", views.EventViewSet, basename="event")
router.register("event-gallery", views.EventGalleryViewSet, basename="event-gallery")
urlpatterns = router.urls
