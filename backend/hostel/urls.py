from django.urls import path
from . import views

app_name = 'hostel'

urlpatterns = [
    path('', views.HostelListCreateView.as_view(), name='hostel-list-create'),
    path('<int:pk>/', views.HostelDetailView.as_view(), name='hostel-detail'),
    path('rooms/', views.RoomListCreateView.as_view(), name='room-list-create'),
    path('rooms/<int:pk>/', views.RoomDetailView.as_view(), name='room-detail'),
    path('allocations/', views.HostelAllocationListCreateView.as_view(), name='allocation-list-create'),
    path('allocations/<int:pk>/', views.HostelAllocationDetailView.as_view(), name='allocation-detail'),
]
