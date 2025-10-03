from django.contrib import admin
from .models import Hostel, Room, HostelAllocation


@admin.register(Hostel)
class HostelAdmin(admin.ModelAdmin):
    """
    Admin interface for Hostel management
    """
    list_display = ('name', 'capacity', 'current_occupancy', 'available_beds', 'warden_name', 'is_active')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'warden_name')
    readonly_fields = ('current_occupancy', 'created_at')


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    """
    Admin interface for Room management
    """
    list_display = ('room_number', 'hostel', 'room_type', 'capacity', 'current_occupancy', 'available_beds', 'monthly_rent', 'is_active')
    list_filter = ('hostel', 'room_type', 'is_active')
    search_fields = ('room_number', 'hostel__name')
    readonly_fields = ('current_occupancy', 'created_at')
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('hostel')


@admin.register(HostelAllocation)
class HostelAllocationAdmin(admin.ModelAdmin):
    """
    Admin interface for Hostel Allocation management
    """
    list_display = ('student', 'room', 'allocated_date', 'monthly_rent', 'is_active')
    list_filter = ('is_active', 'allocated_date', 'room__hostel')
    search_fields = ('student__student_id', 'student__user__first_name', 'student__user__last_name')
    readonly_fields = ('created_at',)
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('student__user', 'room__hostel')