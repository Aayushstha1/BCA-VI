from django.urls import path
from . import views

app_name = 'library'

urlpatterns = [
    path('books/', views.BookListCreateView.as_view(), name='book-list-create'),
    path('books/<int:pk>/', views.BookDetailView.as_view(), name='book-detail'),
    path('issues/', views.BookIssueListCreateView.as_view(), name='book-issue-list-create'),
    path('issues/<int:pk>/', views.BookIssueDetailView.as_view(), name='book-issue-detail'),
    path('fines/', views.FineListCreateView.as_view(), name='fine-list-create'),
    path('fines/<int:pk>/', views.FineDetailView.as_view(), name='fine-detail'),
]
