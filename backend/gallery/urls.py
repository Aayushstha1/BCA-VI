from django.urls import path
from .views import GalleryItemListCreateView, GalleryItemApprovalView

urlpatterns = [
    path('', GalleryItemListCreateView.as_view(), name='gallery-list-create'),
    path('<int:pk>/approve/', GalleryItemApprovalView.as_view(), name='gallery-approve'),
]
