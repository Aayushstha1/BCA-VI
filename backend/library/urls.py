from django.urls import path
from . import views

app_name = 'library'

urlpatterns = [
    path('books/', views.BookListCreateView.as_view()),
    path('books/<int:pk>/', views.BookDetailView.as_view()),

    path('issues/', views.BookIssueListCreateView.as_view()),
    path('issues/<int:pk>/', views.BookIssueDetailView.as_view()),

    path('fines/', views.FineListCreateView.as_view()),
    path('fines/<int:pk>/', views.FineDetailView.as_view()),

    # ✅ NEW
    path('books/<int:book_id>/view/', views.record_book_view),
    path('book-views/', views.admin_book_views),
    path('most-viewed-books/', views.most_viewed_books),
]
