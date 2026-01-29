from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import NoticeCategory, Notice, NoticeRead, UserNotification
from .serializers import NoticeCategorySerializer, NoticeSerializer, NoticeReadSerializer, UserNotificationSerializer


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


class NotificationListView(generics.ListAPIView):
    """List notifications for the authenticated user, newest first."""
    serializer_class = UserNotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserNotification.objects.filter(user=self.request.user).order_by('-created_at')


class NotificationMarkReadView(generics.GenericAPIView):
    """Mark a single notification as read, or mark all as read for the user.

    POST payloads supported:
    - { "id": <notification_id> }  -> marks the given notification as read
    - { "mark_all": true }         -> marks all unread notifications for the user as read
    """
    serializer_class = UserNotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        data = request.data or {}
        if data.get('mark_all'):
            updated = UserNotification.objects.filter(user=request.user, is_read=False).update(is_read=True)
            return Response({"marked": updated}, status=status.HTTP_200_OK)

        notif_id = data.get('id')
        if not notif_id:
            return Response({"detail": "Notification id required or set mark_all."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            notif = UserNotification.objects.get(id=notif_id, user=request.user)
        except UserNotification.DoesNotExist:
            return Response({"detail": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)

        notif.is_read = True
        notif.save()
        return Response(self.get_serializer(notif).data, status=status.HTTP_200_OK)


class NotificationUnreadCountView(generics.GenericAPIView):
    """Return unread notification count for the authenticated user."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        unread = UserNotification.objects.filter(user=request.user, is_read=False).count()
        return Response({"unread": unread}, status=status.HTTP_200_OK)