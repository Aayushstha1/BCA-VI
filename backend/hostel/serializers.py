from rest_framework import serializers
from .models import Hostel, Room, HostelAllocation


class HostelSerializer(serializers.ModelSerializer):
    available_beds = serializers.IntegerField(read_only=True)

    class Meta:
        model = Hostel
        fields = '__all__'


class RoomAllocationSummarySerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    student_id = serializers.CharField(source='student.student_id', read_only=True)

    class Meta:
        model = HostelAllocation
        fields = ['id', 'student', 'student_id', 'student_name', 'allocated_date', 'is_active']


class RoomSerializer(serializers.ModelSerializer):
    hostel_name = serializers.CharField(source='hostel.name', read_only=True)
    available_beds = serializers.IntegerField(read_only=True)
    active_allocations = serializers.SerializerMethodField()
    
    class Meta:
        model = Room
        fields = '__all__'

    def get_active_allocations(self, obj):
        allocations = obj.allocations.filter(is_active=True).select_related('student__user')
        return RoomAllocationSummarySerializer(allocations, many=True).data


class HostelAllocationSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    room_info = serializers.CharField(source='room', read_only=True)
    
    class Meta:
        model = HostelAllocation
        fields = '__all__'
        extra_kwargs = {
            'student': {'required': False},
            'allocated_date': {'required': False},
            'monthly_rent': {'required': False},
            'is_active': {'required': False},
        }
