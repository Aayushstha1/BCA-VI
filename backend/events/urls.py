from django.urls import path

from .views import CalendarEventListCreateView

app_name = 'events'

urlpatterns = [
    path('', CalendarEventListCreateView.as_view(), name='event-list-create'),
]
