from rest_framework import generics, permissions, status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone

from .models import GalleryItem
from .serializers import GalleryItemSerializer, GalleryItemCreateSerializer


class GalleryItemListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        user = self.request.user
        qs = GalleryItem.objects.select_related('created_by', 'approved_by')
        if user.role == 'admin':
            return qs.all()
        return qs.filter(Q(approval_status='approved') | Q(created_by=user))

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return GalleryItemCreateSerializer
        return GalleryItemSerializer

    def create(self, request, *args, **kwargs):
        serializer = GalleryItemCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = request.user

        if user.role == 'admin':
            obj = serializer.save(
                created_by=user,
                approval_status='approved',
                approved_by=user,
                approved_at=timezone.now()
            )
        else:
            obj = serializer.save(created_by=user, approval_status='pending')

        response_serializer = GalleryItemSerializer(obj, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class GalleryItemApprovalView(generics.UpdateAPIView):
    queryset = GalleryItem.objects.select_related('created_by', 'approved_by').all()
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = GalleryItemSerializer

    def update(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({'detail': 'Only admin can approve or reject gallery items.'},
                            status=status.HTTP_403_FORBIDDEN)

        approval_status = request.data.get('approval_status')
        rejection_reason = request.data.get('rejection_reason', '')
        if approval_status not in ['approved', 'rejected']:
            return Response({'detail': 'Invalid approval status.'},
                            status=status.HTTP_400_BAD_REQUEST)

        item = self.get_object()
        item.approval_status = approval_status
        if approval_status == 'approved':
            item.approved_by = request.user
            item.approved_at = timezone.now()
            item.rejection_reason = ''
        else:
            item.approved_by = None
            item.approved_at = None
            item.rejection_reason = rejection_reason

        item.save()
        serializer = self.get_serializer(item, context={'request': request})
        return Response(serializer.data)
