from django.urls import path
from . import views

app_name = 'teachers'

urlpatterns = [
    path('', views.TeacherListCreateView.as_view(), name='teacher-list-create'),
    path('public/<str:employee_id>/', views.PublicTeacherProfileView.as_view(), name='teacher-public-profile'),
    path('<int:pk>/', views.TeacherDetailView.as_view(), name='teacher-detail'),
    path('<int:pk>/qr-code/', views.TeacherQRCodeView.as_view(), name='teacher-qr-code'),
    path('search/', views.TeacherSearchView.as_view(), name='teacher-search'),
]
