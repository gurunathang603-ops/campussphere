from rest_framework.routers import SimpleRouter

from . import views

router = SimpleRouter()
router.register("documents", views.DocumentViewSet, basename="document")
urlpatterns = router.urls
