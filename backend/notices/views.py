from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import NoticeCategory, Notice, NoticeRead
from .serializers import NoticeCategorySerializer, NoticeSerializer, NoticeReadSerializer


class NoticeCategoryListCreateView(generics.ListCreateAPIView):
    queryset = NoticeCategory.objects.all()
    serializer_class = NoticeCategorySerializer
    permission_classes = [permissions.IsAuthenticated]


class NoticeCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = NoticeCategory.objects.all()
    serializer_class = NoticeCategorySerializer
    permission_classes = [permissions.IsAuthenticated]


class NoticeListCreateView(generics.ListCreateAPIView):
    serializer_class = NoticeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Show only active, non-expired notices, ordered by pinned and date
        from django.utils import timezone
        return Notice.objects.filter(is_active=True).exclude(
            expires_at__lt=timezone.now()
        ).order_by('-is_pinned', '-published_at')


class NoticeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Notice.objects.all()
    serializer_class = NoticeSerializer
    permission_classes = [permissions.IsAuthenticated]


class MarkNoticeReadView(generics.CreateAPIView):
    queryset = NoticeRead.objects.all()
    serializer_class = NoticeReadSerializer
    permission_classes = [permissions.IsAuthenticated]