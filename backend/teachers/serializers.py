from rest_framework import serializers
from .models import Teacher
from accounts.models import User
from django.db import transaction, IntegrityError


class TeacherSerializer(serializers.ModelSerializer):
    """
    Serializer for Teacher model
    """
    user = serializers.StringRelatedField(read_only=True)
    user_details = serializers.SerializerMethodField()
    qr_code_data = serializers.SerializerMethodField()
    qr_code_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Teacher
        fields = [
            'id', 'employee_id', 'joining_date', 'user', 'user_details',
            'qualification', 'department', 'designation', 'experience_years', 'salary',
            'emergency_contact', 'emergency_contact_name', 'qr_code', 'qr_code_url', 'qr_code_data',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['employee_id', 'created_at', 'updated_at']
    
    def get_user_details(self, obj):
        try:
            return {
                'id': obj.user.id,
                'username': obj.user.username,
                'email': obj.user.email,
                'first_name': obj.user.first_name,
                'last_name': obj.user.last_name,
                'phone': obj.user.phone,
                'profile_picture': obj.user.profile_picture.url if obj.user.profile_picture else None,
            }
        except Exception:
            return {
                'id': None,
                'username': None,
                'email': None,
                'first_name': None,
                'last_name': None,
                'phone': None,
                'profile_picture': None,
            }

    def get_qr_code_data(self, obj):
        try:
            return obj.get_qr_code_data()
        except Exception:
            return {}

    def get_qr_code_url(self, obj):
        if not obj.qr_code:
            return None
        try:
            url = obj.qr_code.url
        except Exception:
            return None
        request = self.context.get('request') if hasattr(self, 'context') else None
        if request:
            return request.build_absolute_uri(url)
        return url


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
    
    def validate(self, attrs):
        # Ensure username and email are unique (case-insensitive)
        errors = {}
        username = attrs.get('username')
        email = attrs.get('email')
        if username and User.objects.filter(username__iexact=username).exists():
            errors['username'] = 'A user with that username already exists.'
        if email and User.objects.filter(email__iexact=email).exists():
            errors['email'] = 'A user with that email already exists.'
        if errors:
            raise serializers.ValidationError(errors)
        return attrs

    def create(self, validated_data):
        # Create user account first inside a transaction to avoid partial writes
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

        try:
            with transaction.atomic():
                user = User.objects.create_user(**user_data)
                # Create teacher profile
                validated_data['user'] = user
                teacher = Teacher.objects.create(**validated_data)
            return teacher
        except IntegrityError as e:
            # Convert DB errors into friendly validation errors
            msg = str(e)
            if 'auth_user.username' in msg or 'username' in msg:
                raise serializers.ValidationError({'username': 'A user with that username already exists.'})
            if 'auth_user.email' in msg or 'email' in msg:
                raise serializers.ValidationError({'email': 'A user with that email already exists.'})
            raise serializers.ValidationError({'non_field_errors': 'Unable to create teacher due to a database error.'})
