from django.urls import path

from . import views

urlpatterns = [
    path("chatbot/", views.ChatView.as_view()),
    path("search/", views.SearchView.as_view()),
]
