from django.urls import path
from . import views

app_name = 'notes'

urlpatterns = [
    path('categories/', views.NoteCategoryListCreateView.as_view(), name='note-category-list-create'),
    path('categories/<int:pk>/', views.NoteCategoryDetailView.as_view(), name='note-category-detail'),
    path('', views.NoteListCreateView.as_view(), name='note-list-create'),
    path('<int:pk>/', views.NoteDetailView.as_view(), name='note-detail'),
    path('<int:pk>/download/', views.NoteDownloadView.as_view(), name='note-download'),
    path('<int:pk>/rate/', views.NoteRatingView.as_view(), name='note-rating'),
    path('<int:pk>/bookmark/', views.NoteBookmarkView.as_view(), name='note-bookmark'),
    path('<int:pk>/comments/', views.NoteCommentListCreateView.as_view(), name='note-comment-list-create'),
]
