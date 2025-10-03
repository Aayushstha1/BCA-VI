from django.urls import path
from . import views

app_name = 'notices'

urlpatterns = [
    path('categories/', views.NoticeCategoryListCreateView.as_view(), name='notice-category-list-create'),
    path('categories/<int:pk>/', views.NoticeCategoryDetailView.as_view(), name='notice-category-detail'),
    path('', views.NoticeListCreateView.as_view(), name='notice-list-create'),
    path('<int:pk>/', views.NoticeDetailView.as_view(), name='notice-detail'),
    path('<int:pk>/mark-read/', views.MarkNoticeReadView.as_view(), name='mark-notice-read'),
]
