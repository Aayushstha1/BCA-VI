from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, PasswordResetRequest


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model
    """
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = User
        # Explicitly exclude the password field to ensure it is never returned
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone', 'address', 'profile_picture', 'is_active', 'date_joined', 'password']
        read_only_fields = ['id', 'date_joined']

    def to_representation(self, instance):
        """Ensure password is never present in serialized output even if model changes."""
        data = super().to_representation(instance)
        data.pop('password', None)
        return data
    
    def update(self, instance, validated_data):
        # Handle password update
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance


class UserCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new users
    """
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'role', 'phone', 'address', 'profile_picture', 'password', 'password_confirm']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    """
    Serializer for user login
    """
    username = serializers.CharField()
    password = serializers.CharField()
    
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Must include username and password')


class PasswordChangeSerializer(serializers.Serializer):
    """
    Serializer for password change
    """
    old_password = serializers.CharField()
    new_password = serializers.CharField(min_length=8)
    new_password_confirm = serializers.CharField()
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("New passwords don't match")
        return attrs


class PasswordResetRequestCreateSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField()
    father_name = serializers.CharField()
    current_class = serializers.CharField()
    current_section = serializers.CharField()


class PasswordResetRequestSerializer(serializers.ModelSerializer):
    student_id = serializers.SerializerMethodField()
    student_name = serializers.SerializerMethodField()
    student_email = serializers.SerializerMethodField()
    student_class = serializers.SerializerMethodField()
    student_section = serializers.SerializerMethodField()

    class Meta:
        model = PasswordResetRequest
        fields = [
            'id',
            'username',
            'requested_email',
            'father_name',
            'current_class',
            'current_section',
            'status',
            'auto_match',
            'admin_note',
            'created_at',
            'handled_at',
            'student_id',
            'student_name',
            'student_email',
            'student_class',
            'student_section',
        ]

    def get_student_id(self, obj):
        try:
            return obj.student.student_id if obj.student else None
        except Exception:
            return None

    def get_student_name(self, obj):
        try:
            if obj.student and obj.student.user:
                return obj.student.user.get_full_name().strip() or obj.student.user.username
            return None
        except Exception:
            return None

    def get_student_email(self, obj):
        try:
            return obj.student.user.email if obj.student and obj.student.user else None
        except Exception:
            return None

    def get_student_class(self, obj):
        try:
            return obj.student.current_class if obj.student else None
        except Exception:
            return None

    def get_student_section(self, obj):
        try:
            return obj.student.current_section if obj.student else None
        except Exception:
            return None


class PasswordResetApproveSerializer(serializers.Serializer):
    new_password = serializers.CharField(required=False, allow_blank=True)
    admin_note = serializers.CharField(required=False, allow_blank=True)
