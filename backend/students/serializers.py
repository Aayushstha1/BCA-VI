from rest_framework import serializers
from .models import Student
from accounts.models import User


class StudentSerializer(serializers.ModelSerializer):
    """
    Serializer for Student model
    """
    user = serializers.StringRelatedField(read_only=True)
    user_details = serializers.SerializerMethodField()
    qr_code_data = serializers.SerializerMethodField()
    
    class Meta:
        model = Student
        fields = '__all__'
        read_only_fields = ['student_id', 'admission_number', 'qr_code', 'created_at', 'updated_at']
    
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
    
    def get_qr_code_data(self, obj):
        return obj.get_qr_code_data()


class StudentCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating students with user account
    """
    username = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    phone = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = Student
        fields = [
            'username', 'email', 'password', 'first_name', 'last_name', 'phone',
            'admission_date', 'date_of_birth', 'gender', 'blood_group',
            'father_name', 'mother_name', 'guardian_contact',
            'current_class', 'current_section', 'roll_number'
        ]
    
    def create(self, validated_data):
        # Create user account first
        user_data = {
            'username': validated_data.pop('username'),
            'email': validated_data.pop('email'),
            'password': validated_data.pop('password'),
            'first_name': validated_data.pop('first_name'),
            'last_name': validated_data.pop('last_name'),
            'role': 'student',
        }
        
        if 'phone' in validated_data:
            user_data['phone'] = validated_data.pop('phone')
        
        user = User.objects.create_user(**user_data)
        
        # Create student profile
        validated_data['user'] = user
        student = Student.objects.create(**validated_data)
        
        return student


class StudentSearchSerializer(serializers.Serializer):
    """
    Serializer for student search
    """
    query = serializers.CharField(max_length=100)
    class_filter = serializers.CharField(max_length=20, required=False)
