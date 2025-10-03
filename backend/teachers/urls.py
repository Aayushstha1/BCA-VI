from django.urls import path
from . import views

app_name = 'teachers'

urlpatterns = [
    path('', views.TeacherListCreateView.as_view(), name='teacher-list-create'),
    path('<int:pk>/', views.TeacherDetailView.as_view(), name='teacher-detail'),
    path('search/', views.TeacherSearchView.as_view(), name='teacher-search'),
]
