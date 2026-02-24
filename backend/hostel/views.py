from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from django.db.models import F
from django.utils import timezone
from .models import Hostel, Room, HostelAllocation
from .serializers import HostelSerializer, RoomSerializer, HostelAllocationSerializer


class HostelListCreateView(generics.ListCreateAPIView):
    serializer_class = HostelSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Hostel.objects.all()
        user = self.request.user
        if getattr(user, 'role', None) == 'student':
            return qs.filter(is_active=True)
        return qs


class HostelDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = HostelSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Hostel.objects.all()
        user = self.request.user
        if getattr(user, 'role', None) == 'student':
            return qs.filter(is_active=True)
        return qs


class RoomListCreateView(generics.ListCreateAPIView):
    serializer_class = RoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Room.objects.select_related('hostel')
        user = self.request.user
        if getattr(user, 'role', None) == 'student':
            return qs.filter(is_active=True, hostel__is_active=True)
        return qs


class RoomDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = RoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Room.objects.select_related('hostel')
        user = self.request.user
        if getattr(user, 'role', None) == 'student':
            return qs.filter(is_active=True, hostel__is_active=True)
        return qs


class HostelAllocationListCreateView(generics.ListCreateAPIView):
    serializer_class = HostelAllocationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = HostelAllocation.objects.select_related('student__user', 'room__hostel')
        user = self.request.user
        if getattr(user, 'role', None) == 'student':
            student = getattr(user, 'student_profile', None)
            if not student:
                return qs.none()
            return qs.filter(student=student)
        if getattr(user, 'role', None) == 'admin':
            return qs
        return qs.none()

    def perform_create(self, serializer):
        user = self.request.user
        role = getattr(user, 'role', None)
        if role not in ['student', 'admin']:
            raise PermissionDenied('Only students or admins can create allocations.')

        room = serializer.validated_data.get('room')
        if not room:
            raise ValidationError({'room': 'Room is required.'})

        with transaction.atomic():
            room = Room.objects.select_for_update().select_related('hostel').get(pk=room.pk)
            if not room.is_active or not room.hostel.is_active:
                raise ValidationError({'room': 'Selected room is not available.'})
            if room.current_occupancy >= room.capacity:
                raise ValidationError({'room': 'Room is fully occupied.'})

            if role == 'student':
                student = getattr(user, 'student_profile', None)
                if not student:
                    raise ValidationError({'student': 'Student profile not found.'})
                if HostelAllocation.objects.filter(student=student, is_active=True).exists():
                    raise ValidationError({'student': 'You already have an active room allocation.'})
                allocation = serializer.save(
                    student=student,
                    monthly_rent=room.monthly_rent,
                    allocated_date=timezone.now().date(),
                    is_active=True,
                )
                Room.objects.filter(pk=room.pk).update(current_occupancy=F('current_occupancy') + 1)
                Hostel.objects.filter(pk=room.hostel_id).update(current_occupancy=F('current_occupancy') + 1)
                return allocation

            # Admin flow
            student = serializer.validated_data.get('student')
            if not student:
                raise ValidationError({'student': 'Student is required for admin allocation.'})
            if HostelAllocation.objects.filter(student=student, is_active=True).exists():
                raise ValidationError({'student': 'Student already has an active room allocation.'})
            is_active = serializer.validated_data.get('is_active', True)
            allocation = serializer.save(
                monthly_rent=serializer.validated_data.get('monthly_rent', room.monthly_rent),
                allocated_date=serializer.validated_data.get('allocated_date', timezone.now().date()),
            )
            if is_active:
                Room.objects.filter(pk=room.pk).update(current_occupancy=F('current_occupancy') + 1)
                Hostel.objects.filter(pk=room.hostel_id).update(current_occupancy=F('current_occupancy') + 1)
            return allocation


class HostelAllocationDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = HostelAllocationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = HostelAllocation.objects.select_related('student__user', 'room__hostel')
        user = self.request.user
        if getattr(user, 'role', None) == 'student':
            student = getattr(user, 'student_profile', None)
            if not student:
                return qs.none()
            return qs.filter(student=student)
        if getattr(user, 'role', None) == 'admin':
            return qs
        return qs.none()

    def perform_update(self, serializer):
        instance = serializer.instance
        old_room = instance.room
        old_active = instance.is_active
        new_room = serializer.validated_data.get('room', old_room)
        new_active = serializer.validated_data.get('is_active', old_active)

        with transaction.atomic():
            if new_active and (new_room.pk != old_room.pk or not old_active):
                locked_room = Room.objects.select_for_update().select_related('hostel').get(pk=new_room.pk)
                if locked_room.current_occupancy >= locked_room.capacity:
                    raise ValidationError({'room': 'Room is fully occupied.'})

            allocation = serializer.save()

            if old_active and (not new_active or old_room.pk != new_room.pk):
                Room.objects.filter(pk=old_room.pk).update(current_occupancy=F('current_occupancy') - 1)
                Hostel.objects.filter(pk=old_room.hostel_id).update(current_occupancy=F('current_occupancy') - 1)

            if new_active and (not old_active or old_room.pk != new_room.pk):
                Room.objects.filter(pk=new_room.pk).update(current_occupancy=F('current_occupancy') + 1)
                Hostel.objects.filter(pk=new_room.hostel_id).update(current_occupancy=F('current_occupancy') + 1)

            return allocation

    def perform_destroy(self, instance):
        with transaction.atomic():
            if instance.is_active:
                Room.objects.filter(pk=instance.room_id).update(current_occupancy=F('current_occupancy') - 1)
                Hostel.objects.filter(pk=instance.room.hostel_id).update(current_occupancy=F('current_occupancy') - 1)
            instance.delete()
