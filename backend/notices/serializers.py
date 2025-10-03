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


class NoticeReadSerializer(serializers.ModelSerializer):
    notice_title = serializers.CharField(source='notice.title', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = NoticeRead
        fields = '__all__'
