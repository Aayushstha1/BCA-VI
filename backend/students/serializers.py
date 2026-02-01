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
    qr_code = serializers.SerializerMethodField()
    qr_code_url = serializers.SerializerMethodField()
    profile_picture_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Student
        # Explicit list to avoid accidentally exposing fields like internal password
        fields = [
            'id', 'student_id', 'admission_number', 'admission_date',
            'user', 'user_details', 'date_of_birth', 'gender', 'blood_group',
            'father_name', 'mother_name', 'guardian_contact',
            'current_class', 'current_section', 'roll_number', 'qr_code', 'qr_code_url', 'qr_code_data',
            'profile_picture', 'profile_picture_url',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['student_id', 'admission_number', 'qr_code', 'created_at', 'updated_at']
    
    def get_user_details(self, obj):
        # Explicitly return only non-sensitive user fields and be defensive
        try:
            profile_picture_url = None
            try:
                if obj.user.profile_picture:
                    profile_picture_url = obj.user.profile_picture.url
            except Exception:
                profile_picture_url = None

            return {
                'id': obj.user.id,
                'username': obj.user.username,
                'email': obj.user.email,
                'first_name': obj.user.first_name,
                'last_name': obj.user.last_name,
                'phone': obj.user.phone,
                'profile_picture': profile_picture_url,
            }
        except Exception:
            # If user relation is broken, return minimal safe info
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

    def get_qr_code(self, obj):
        # Return a safe relative or absolute URL string for the image
        if not obj.qr_code:
            return None
        try:
            return obj.qr_code.url
        except Exception:
            return None

    def get_qr_code_url(self, obj):
        # Return absolute URL when request context is available
        try:
            url = None
            if obj.qr_code:
                try:
                    url = obj.qr_code.url
                except Exception:
                    url = None
            if not url:
                return None
            request = self.context.get('request') if hasattr(self, 'context') else None
            if request:
                return request.build_absolute_uri(url)
            return url
        except Exception:
            return None

    def get_profile_picture_url(self, obj):
        # Return profile picture URL if it exists
        try:
            if obj.profile_picture:
                url = obj.profile_picture.url
                request = self.context.get('request') if hasattr(self, 'context') else None
                if request:
                    return request.build_absolute_uri(url)
                return url
            return None
        except Exception:
            return None


from django.db import IntegrityError, transaction

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

    def validate(self, attrs):
        username = attrs.get('username')
        email = attrs.get('email')
        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError({'username': 'A user with that username already exists.'})
        if email and User.objects.filter(email=email).exists():
            raise serializers.ValidationError({'email': 'A user with that email already exists.'})
        return attrs
    
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

        # Use a transaction to avoid partial creations and handle integrity errors
        try:
            with transaction.atomic():
                user = User.objects.create_user(**user_data)
                # Create student profile
                validated_data['user'] = user
                student = Student.objects.create(**validated_data)
                return student
        except IntegrityError as e:
            # Convert DB integrity errors into serializer validation errors for client
            raise serializers.ValidationError({'detail': 'A user with that username or email already exists.'})


class StudentSearchSerializer(serializers.Serializer):
    """
    Serializer for student search
    """
    query = serializers.CharField(max_length=100)
    class_filter = serializers.CharField(max_length=20, required=False)


class StudentProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for student profile view and edit (excludes sensitive fields)
    """
    user_id = serializers.IntegerField(read_only=True, source='user.id')
    username = serializers.CharField(read_only=True, source='user.username')
    email = serializers.CharField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)
    profile_picture_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Student
        fields = [
            'id', 'student_id', 'admission_number', 'admission_date',
            'user_id', 'username', 'email', 'first_name', 'last_name', 'phone',
            'date_of_birth', 'gender', 'blood_group',
            'father_name', 'mother_name', 'guardian_contact',
            'current_class', 'current_section', 'roll_number',
            'profile_picture', 'profile_picture_url',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['student_id', 'admission_number', 'created_at', 'updated_at']
    
    def get_profile_picture_url(self, obj):
        try:
            if obj.profile_picture:
                url = obj.profile_picture.url
                request = self.context.get('request') if hasattr(self, 'context') else None
                if request:
                    return request.build_absolute_uri(url)
                return url
            return None
        except Exception:
            return None


class StudentProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating student profile (allows profile picture upload)
    """
    class Meta:
        model = Student
        fields = [
            'date_of_birth', 'gender', 'blood_group',
            'father_name', 'mother_name', 'guardian_contact',
            'profile_picture'
        ]


# ------------------ CV Serializers ------------------
from .models import CV

class CVSerializer(serializers.ModelSerializer):
    owner = serializers.StringRelatedField(read_only=True)
    owner_id = serializers.IntegerField(read_only=True, source='owner.id')
    file_url = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    ratings_count = serializers.SerializerMethodField()
    user_rating = serializers.SerializerMethodField()

    class Meta:
        model = CV
        fields = [
            'id', 'owner', 'owner_id', 'title', 'summary', 'education', 'experience', 'skills', 'file', 'file_url', 'is_primary', 'created_at', 'updated_at', 'average_rating', 'ratings_count', 'user_rating'
        ]
        read_only_fields = ['owner', 'owner_id', 'created_at', 'updated_at']

    def get_file_url(self, obj):
        try:
            if obj.file:
                request = self.context.get('request') if hasattr(self, 'context') else None
                url = obj.file.url
                if request:
                    return request.build_absolute_uri(url)
                return url
            return None
        except Exception:
            return None

    def get_average_rating(self, obj):
        try:
            return obj.average_rating.get('average')
        except Exception:
            return None

    def get_ratings_count(self, obj):
        try:
            return obj.average_rating.get('count')
        except Exception:
            return 0

    def get_user_rating(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return None
        try:
            rating = obj.ratings.filter(rater=user).first()
            if rating:
                return {'id': rating.id, 'score': rating.score, 'comment': rating.comment}
            return None
        except Exception:
            return None
    def get_file_url(self, obj):
        try:
            if obj.file:
                request = self.context.get('request') if hasattr(self, 'context') else None
                url = obj.file.url
                if request:
                    return request.build_absolute_uri(url)
                return url
            return None
        except Exception:
            return None

class CVCreateUpdateSerializer(serializers.ModelSerializer):
    """Used for create/update to accept file uploads and is_primary flag."""
    class Meta:
        model = CV
        fields = ['title', 'summary', 'education', 'experience', 'skills', 'file', 'is_primary']


class CVRatingSerializer(serializers.ModelSerializer):
    rater = serializers.StringRelatedField(read_only=True)
    rater_id = serializers.IntegerField(source='rater.id', read_only=True)

    class Meta:
        from students.cv import CVRating
        model = CVRating
        fields = ['id', 'cv', 'rater', 'rater_id', 'score', 'comment', 'created_at', 'updated_at']
        read_only_fields = ['rater', 'rater_id', 'created_at', 'updated_at']

    def validate_score(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError('Score must be between 1 and 5')
        return value

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['rater'] = user
        # Enforce rater role should be admin or teacher
        if user.role not in ['admin', 'teacher']:
            raise serializers.ValidationError('Only admin or teacher can rate CVs')
        # Ensure unique per user
        from students.cv import CVRating
        obj, created = CVRating.objects.update_or_create(cv=validated_data['cv'], rater=user, defaults={'score': validated_data.get('score'), 'comment': validated_data.get('comment', '')})
        return obj

