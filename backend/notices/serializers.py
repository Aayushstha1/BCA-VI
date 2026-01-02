from rest_framework import serializers
from .models import NoticeCategory, Notice, NoticeRead


class NoticeCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = NoticeCategory
        fields = '__all__'


class NoticeSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    published_by_name = serializers.CharField(source='published_by.get_full_name', read_only=True)
    
    class Meta:
        model = Notice
        fields = '__all__'
        read_only_fields = ('published_by', 'published_at')
    
    def create(self, validated_data):
        # Automatically set published_by to the current user
        validated_data['published_by'] = self.context['request'].user
        return super().create(validated_data)


class NoticeReadSerializer(serializers.ModelSerializer):
    notice_title = serializers.CharField(source='notice.title', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = NoticeRead
        fields = '__all__'
