from django.urls import path
from . import views

app_name = 'attendance'

urlpatterns = [
    path('subjects/', views.SubjectListCreateView.as_view(), name='subject-list-create'),
    path('subjects/<int:pk>/', views.SubjectDetailView.as_view(), name='subject-detail'),
    path('', views.AttendanceListCreateView.as_view(), name='attendance-list-create'),
    path('<int:pk>/', views.AttendanceDetailView.as_view(), name='attendance-detail'),
    path('reports/', views.AttendanceReportListCreateView.as_view(), name='attendance-report-list-create'),
    path('sessions/', views.AttendanceSessionListCreateView.as_view(), name='attendance-session-list-create'),
    path('mark/', views.MarkAttendanceView.as_view(), name='mark-attendance'),
]
