from django.urls import path
from . import views

app_name = 'students'

urlpatterns = [
    path('', views.StudentListCreateView.as_view(), name='student-list-create'),
    path('profile/', views.StudentProfileView.as_view(), name='student-profile'),
    path('public/<str:student_id>/', views.PublicStudentProfileView.as_view(), name='student-public-profile'),
    path('<int:pk>/', views.StudentDetailView.as_view(), name='student-detail'),
    path('<int:pk>/profile/', views.StudentProfileView.as_view(), name='student-admin-profile'),
    path('<int:pk>/profile-picture/', views.StudentProfilePictureUploadView.as_view(), name='student-profile-picture'),
    path('<int:pk>/qr-code/', views.StudentQRCodeView.as_view(), name='student-qr-code'),
    path('<int:pk>/reset-password/', views.reset_student_password, name='student-reset-password'),
    path('search/', views.StudentSearchView.as_view(), name='student-search'),
]
