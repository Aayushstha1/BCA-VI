from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Count

from .models import Book, BookIssue, Fine, BookView
from .serializers import (
    BookSerializer,
    BookIssueSerializer,
    FineSerializer,
    BookViewSerializer
)


class BookListCreateView(generics.ListCreateAPIView):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    permission_classes = [permissions.IsAuthenticated]


class BookDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    permission_classes = [permissions.IsAuthenticated]


class BookIssueListCreateView(generics.ListCreateAPIView):
    queryset = BookIssue.objects.all()
    serializer_class = BookIssueSerializer
    permission_classes = [permissions.IsAuthenticated]


class BookIssueDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = BookIssue.objects.all()
    serializer_class = BookIssueSerializer
    permission_classes = [permissions.IsAuthenticated]


class FineListCreateView(generics.ListCreateAPIView):
    queryset = Fine.objects.all()
    serializer_class = FineSerializer
    permission_classes = [permissions.IsAuthenticated]


class FineDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Fine.objects.all()
    serializer_class = FineSerializer
    permission_classes = [permissions.IsAuthenticated]


# ✅ STUDENT → RECORD BOOK VIEW
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def record_book_view(request, book_id):
    book = Book.objects.get(id=book_id)
    BookView.objects.get_or_create(
        book=book,
        student=request.user.student
    )
    return Response({'message': 'Book view recorded'})


# ✅ ADMIN → VIEW ALL BOOK VIEWS
@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_book_views(request):
    views = BookView.objects.select_related('book', 'student')
    serializer = BookViewSerializer(views, many=True)
    return Response(serializer.data)


# ✅ ADMIN → MOST VIEWED BOOKS
@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def most_viewed_books(request):
    data = (
        Book.objects
        .annotate(total_views=Count('views'))
        .values('title', 'total_views')
        .order_by('-total_views')
    )
    return Response(data)
