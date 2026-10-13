from django.urls import path
from rest_framework.routers import SimpleRouter

from . import views

router = SimpleRouter()
router.register("achievements", views.AchievementViewSet, basename="achievement")
router.register("gallery", views.GalleryViewSet, basename="gallery")

urlpatterns = [
    path("settings/", views.SettingsView.as_view()),
    path("department/", views.DepartmentView.as_view()),
    path("stats/", views.StatsView.as_view()),
] + router.urls
