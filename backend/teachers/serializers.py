from rest_framework import serializers
from .models import Teacher
from accounts.models import User


class TeacherSerializer(serializers.ModelSerializer):
    """
    Serializer for Teacher model
    """
    user = serializers.StringRelatedField(read_only=True)
    user_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Teacher
        fields = '__all__'
        read_only_fields = ['employee_id', 'created_at', 'updated_at']
    
    def get_user_details(self, obj):
        return {
            'id': obj.user.id,
            'username': obj.user.username,
            'email': obj.user.email,
            'first_name': obj.user.first_name,
            'last_name': obj.user.last_name,
            'phone': obj.user.phone,
            'profile_picture': obj.user.profile_picture.url if obj.user.profile_picture else None,
        }


class TeacherCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating teachers with user account
    """
    username = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    phone = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = Teacher
        fields = [
            'username', 'email', 'password', 'first_name', 'last_name', 'phone',
            'joining_date', 'qualification', 'department', 'designation',
            'experience_years', 'salary', 'emergency_contact', 'emergency_contact_name'
        ]
    
    def create(self, validated_data):
        # Create user account first
        user_data = {
            'username': validated_data.pop('username'),
            'email': validated_data.pop('email'),
            'password': validated_data.pop('password'),
            'first_name': validated_data.pop('first_name'),
            'last_name': validated_data.pop('last_name'),
            'role': 'teacher',
        }
        
        if 'phone' in validated_data:
            user_data['phone'] = validated_data.pop('phone')
        
        user = User.objects.create_user(**user_data)
        
        # Create teacher profile
        validated_data['user'] = user
        teacher = Teacher.objects.create(**validated_data)
        
        return teacher
