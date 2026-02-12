from rest_framework import serializers

from .models import CalendarEvent


class CalendarEventSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    created_by_role = serializers.SerializerMethodField()

    class Meta:
        model = CalendarEvent
        fields = [
            'id',
            'title',
            'event_date',
            'is_holiday',
            'description',
            'created_by',
            'created_by_name',
            'created_by_role',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'created_by',
            'created_by_name',
            'created_by_role',
            'created_at',
        ]

    def get_created_by_name(self, obj):
        if not obj.created_by:
            return ''
        full_name = f"{obj.created_by.first_name or ''} {obj.created_by.last_name or ''}".strip()
        return full_name or obj.created_by.username

    def get_created_by_role(self, obj):
        return getattr(obj.created_by, 'role', '')
