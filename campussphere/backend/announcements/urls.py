from django.urls import path
from rest_framework.routers import SimpleRouter

from . import views

router = SimpleRouter()
router.register("announcements", views.AnnouncementViewSet, basename="announcement")

urlpatterns = [
    path("notifications/", views.NotificationListView.as_view()),
    path("notifications/read-all/", views.NotificationReadView.as_view()),
    path("notifications/<int:pk>/read/", views.NotificationReadView.as_view()),
    path("notifications/preferences/", views.NotificationPreferencesView.as_view()),
    path("notifications/push-subscriptions/", views.PushSubscriptionView.as_view()),
    path("notifications/send/", views.NotificationSendView.as_view()),
    path("notifications/preview/", views.NotificationPreviewView.as_view()),
    path("notifications/test/", views.NotificationTestView.as_view()),
    path("notifications/history/", views.NotificationHistoryView.as_view()),
    path("notifications/providers/twilio/status/", views.TwilioStatusCallbackView.as_view()),
] + router.urls
