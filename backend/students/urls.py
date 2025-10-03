from django.urls import path
from . import views

app_name = 'students'

urlpatterns = [
    path('', views.StudentListCreateView.as_view(), name='student-list-create'),
    path('<int:pk>/', views.StudentDetailView.as_view(), name='student-detail'),
    path('<int:pk>/qr-code/', views.StudentQRCodeView.as_view(), name='student-qr-code'),
    path('search/', views.StudentSearchView.as_view(), name='student-search'),
]
