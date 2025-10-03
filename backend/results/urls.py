from django.urls import path
from . import views

app_name = 'results'

urlpatterns = [
    path('academic-years/', views.AcademicYearListCreateView.as_view(), name='academic-year-list-create'),
    path('academic-years/<int:pk>/', views.AcademicYearDetailView.as_view(), name='academic-year-detail'),
    path('semesters/', views.SemesterListCreateView.as_view(), name='semester-list-create'),
    path('semesters/<int:pk>/', views.SemesterDetailView.as_view(), name='semester-detail'),
    path('exams/', views.ExamListCreateView.as_view(), name='exam-list-create'),
    path('exams/<int:pk>/', views.ExamDetailView.as_view(), name='exam-detail'),
    path('', views.ResultListCreateView.as_view(), name='result-list-create'),
    path('<int:pk>/', views.ResultDetailView.as_view(), name='result-detail'),
]
