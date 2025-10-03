from rest_framework import serializers
from .models import Hostel, Room, HostelAllocation


class HostelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hostel
        fields = '__all__'


class RoomSerializer(serializers.ModelSerializer):
    hostel_name = serializers.CharField(source='hostel.name', read_only=True)
    
    class Meta:
        model = Room
        fields = '__all__'


class HostelAllocationSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    room_info = serializers.CharField(source='room', read_only=True)
    
    class Meta:
        model = HostelAllocation
        fields = '__all__'
