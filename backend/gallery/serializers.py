from rest_framework import serializers
from .models import GalleryItem


class GalleryItemSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    created_by_role = serializers.SerializerMethodField()
    photo_url = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()

    class Meta:
        model = GalleryItem
        fields = [
            'id',
            'event_name',
            'event_date',
            'description',
            'photo',
            'photo_url',
            'created_by',
            'created_by_name',
            'created_by_role',
            'approval_status',
            'approved_by',
            'approved_by_name',
            'approved_at',
            'rejection_reason',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'created_by',
            'approval_status',
            'approved_by',
            'approved_at',
            'created_at',
            'updated_at',
        ]

    def get_created_by_name(self, obj):
        try:
            return obj.created_by.get_full_name() or obj.created_by.username
        except Exception:
            return None

    def get_created_by_role(self, obj):
        try:
            return obj.created_by.role
        except Exception:
            return None

    def get_photo_url(self, obj):
        try:
            if not obj.photo:
                return None
            url = obj.photo.url
            request = self.context.get('request') if hasattr(self, 'context') else None
            if request:
                return request.build_absolute_uri(url)
            return url
        except Exception:
            return None

    def get_approved_by_name(self, obj):
        try:
            if obj.approved_by:
                return obj.approved_by.get_full_name() or obj.approved_by.username
        except Exception:
            return None
        return None


class GalleryItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = GalleryItem
        fields = ['event_name', 'event_date', 'description', 'photo']
