from rest_framework.routers import SimpleRouter

from . import views

router = SimpleRouter()
router.register("faculty", views.FacultyViewSet, basename="faculty")
router.register("timetable", views.TimetableViewSet, basename="timetable")
router.register("syllabus", views.SyllabusViewSet, basename="syllabus")
urlpatterns = router.urls
