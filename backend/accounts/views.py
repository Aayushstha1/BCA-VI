from rest_framework import generics, status, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from .models import User, PasswordResetRequest
from .serializers import (
    UserSerializer,
    UserCreateSerializer,
    LoginSerializer,
    PasswordChangeSerializer,
    PasswordResetRequestCreateSerializer,
    PasswordResetRequestSerializer,
    PasswordResetApproveSerializer
)
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction


class UserListCreateView(generics.ListCreateAPIView):
    """
    View for listing and creating users (Admin only)
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserCreateSerializer
        return UserSerializer
    
    def get_queryset(self):
        # Only admin can access this
        if not self.request.user.role == 'admin':
            return User.objects.none()
        return super().get_queryset()
    
    def perform_create(self, serializer):
        # Only admin can create users
        if self.request.user.role != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        serializer.save()


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    View for retrieving, updating, and deleting a user
    Admin can update username and password for any user
    Users can only update their own profile (non-sensitive fields)
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Users can only view/edit their own profile, admin can view/edit all
        if self.request.user.role == 'admin':
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)
    
    def perform_update(self, serializer):
        # Only allow admins to change username and password
        if self.request.user.role != 'admin':
            if 'username' in self.request.data or 'password' in self.request.data:
                raise PermissionDenied('You cannot change username or password')
        
        serializer.save()


@csrf_exempt
@api_view(['POST'])
@authentication_classes([])
@permission_classes([permissions.AllowAny])
def login_view(request):
    """
    Login view for all user types
    """
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        login(request, user)
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'message': 'Login successful',
            'user': UserSerializer(user).data,
            'token': token.key
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """
    Logout view
    """
    try:
        request.user.auth_token.delete()
    except:
        pass
    logout(request)
    return Response({'message': 'Logout successful'})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def profile_view(request):
    """
    Get current user profile
    """
    data = UserSerializer(request.user).data
    # If user is a teacher, include assigned class/section info for frontend
    try:
        if request.user.role == 'teacher' and hasattr(request.user, 'teacher_profile'):
            teacher = request.user.teacher_profile
            assigned = []
            for cs in teacher.assigned_sections.all():
                assigned.append({'class_name': cs.class_name, 'section': cs.section})
            data['assigned_sections'] = assigned
    except Exception:
        pass
    return Response(data)


@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated])
def update_profile_view(request):
    """
    Update current user profile
    """
    serializer = UserSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password_view(request):
    """
    Change user password
    """
    serializer = PasswordChangeSerializer(data=request.data)
    if serializer.is_valid():
        user = request.user
        old_password = serializer.validated_data['old_password']
        new_password = serializer.validated_data['new_password']
        
        if not user.check_password(old_password):
            return Response({'error': 'Old password is incorrect'}, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(new_password)
        user.save()
        
        # Delete existing token to force re-login
        try:
            user.auth_token.delete()
        except:
            pass
        
        return Response({'message': 'Password changed successfully'})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_stats_view(request):
    """
    Get dashboard statistics based on user role
    Uses concrete Student/Teacher models when available to avoid counting stale or unlinked User objects.
    """
    user = request.user

    # Import related models lazily to avoid circular import issues
    try:
        from students.models import Student
    except Exception:
        Student = None

    try:
        from teachers.models import Teacher
    except Exception:
        Teacher = None

    if user.role == 'admin':
        # Prefer counting actual Student/Teacher model instances when available
        total_students = Student.objects.count() if Student is not None else User.objects.filter(role='student').count()
        total_teachers = Teacher.objects.count() if Teacher is not None else User.objects.filter(role='teacher').count()
        active_students = Student.objects.filter(is_active=True).count() if Student is not None else User.objects.filter(role='student', is_active=True).count()
        active_teachers = Teacher.objects.filter(is_active=True).count() if Teacher is not None else User.objects.filter(role='teacher', is_active=True).count()

        stats = {
            'total_students': total_students,
            'total_teachers': total_teachers,
            'total_users': User.objects.count(),
            'active_students': active_students,
            'active_teachers': active_teachers,
        }
    elif user.role == 'teacher':
        stats = {
            'profile_complete': bool(user.first_name and user.last_name and user.phone),
        }
    elif user.role == 'student':
        stats = {
            'profile_complete': bool(user.first_name and user.last_name and user.phone),
        }

    return Response(stats)


def _normalize(value):
    return (value or '').strip().lower()


def _find_matching_student(username, father_name, current_class, current_section):
    try:
        from students.models import Student
    except Exception:
        return None, False

    try:
        student = Student.objects.select_related('user').get(user__username__iexact=username, user__role='student')
    except Student.DoesNotExist:
        return None, False

    father_match = _normalize(student.father_name) == _normalize(father_name)
    class_match = _normalize(student.current_class) == _normalize(current_class)
    section_match = _normalize(student.current_section) == _normalize(current_section)

    return student, (father_match and class_match and section_match)


@csrf_exempt
@api_view(['POST'])
@authentication_classes([])
@permission_classes([permissions.AllowAny])
def password_reset_request_create(request):
    """
    Create a password reset request (public).
    """
    serializer = PasswordResetRequestCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    student, auto_match = _find_matching_student(
        data.get('username'),
        data.get('father_name'),
        data.get('current_class'),
        data.get('current_section')
    )

    requested_email = (data.get('email') or '').strip().lower()

    PasswordResetRequest.objects.create(
        username=data.get('username'),
        requested_email=requested_email,
        father_name=data.get('father_name'),
        current_class=data.get('current_class'),
        current_section=data.get('current_section'),
        student=student,
        auto_match=auto_match
    )

    # Always return a generic success response to avoid account enumeration
    return Response({'message': 'Request submitted. Admin will verify and email you.'}, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def password_reset_requests_list(request):
    """
    Admin-only: list password reset requests.
    """
    if request.user.role != 'admin':
        return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    status_filter = request.query_params.get('status')
    qs = PasswordResetRequest.objects.select_related('student__user').order_by('-created_at')
    if status_filter:
        qs = qs.filter(status=status_filter)

    serializer = PasswordResetRequestSerializer(qs, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def password_reset_request_approve(request, pk):
    """
    Admin-only: approve a password reset request, set a new password, and email it.
    """
    if request.user.role != 'admin':
        return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    try:
        req = PasswordResetRequest.objects.select_related('student__user').get(pk=pk)
    except PasswordResetRequest.DoesNotExist:
        return Response({'detail': 'Request not found'}, status=status.HTTP_404_NOT_FOUND)

    if req.status != 'pending':
        return Response({'detail': 'Request already processed'}, status=status.HTTP_400_BAD_REQUEST)

    serializer = PasswordResetApproveSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    student = req.student
    if not student:
        # Attempt a final lookup by username
        student, _ = _find_matching_student(req.username, req.father_name, req.current_class, req.current_section)
        if student:
            req.student = student
        else:
            return Response({'detail': 'Matching student not found'}, status=status.HTTP_400_BAD_REQUEST)

    user = student.user

    requested_email = (req.requested_email or '').strip()
    target_email = requested_email
    if not target_email:
        return Response({'detail': 'Requested email not available'}, status=status.HTTP_400_BAD_REQUEST)

    # Enforce real email backend for production-like behavior
    if 'console' in (getattr(settings, 'EMAIL_BACKEND', '') or ''):
        return Response({'detail': 'Email backend not configured for real delivery.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    new_password = (serializer.validated_data.get('new_password') or '').strip()
    if not new_password:
        try:
            import secrets, string
            alphabet = string.ascii_letters + string.digits + "!@#$%&*"
            new_password = ''.join(secrets.choice(alphabet) for _ in range(12))
        except Exception:
            return Response({'detail': 'Failed to generate password'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    subject = "Your password has been reset"
    message = (
        f"Hello {user.get_full_name().strip() or user.username},\n\n"
        f"Your password has been reset by the admin.\n"
        f"Username: {user.username}\n"
        f"New Password: {new_password}\n\n"
        "Please login and change your password after signing in."
    )

    try:
        old_hash = user.password
        with transaction.atomic():
            user.set_password(new_password)
            user.save(update_fields=['password'])

            sent = send_mail(
                subject=subject,
                message=message,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
                recipient_list=[target_email],
                fail_silently=False,
            )

            if sent <= 0:
                raise RuntimeError('Email not sent')

            req.status = 'approved'
            req.handled_by = request.user
            req.handled_at = timezone.now()
            req.admin_note = serializer.validated_data.get('admin_note', '')
            req.save()
    except Exception:
        try:
            user.password = old_hash
            user.save(update_fields=['password'])
        except Exception:
            pass
        return Response({'detail': 'Failed to send email. Check SMTP settings.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response({'message': f'Password reset approved and email sent to {target_email}.'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def password_reset_request_reject(request, pk):
    """
    Admin-only: reject a password reset request.
    """
    if request.user.role != 'admin':
        return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    try:
        req = PasswordResetRequest.objects.get(pk=pk)
    except PasswordResetRequest.DoesNotExist:
        return Response({'detail': 'Request not found'}, status=status.HTTP_404_NOT_FOUND)

    if req.status != 'pending':
        return Response({'detail': 'Request already processed'}, status=status.HTTP_400_BAD_REQUEST)

    req.status = 'rejected'
    req.handled_by = request.user
    req.handled_at = timezone.now()
    req.admin_note = request.data.get('admin_note', '')
    req.save()

    return Response({'message': 'Password reset request rejected.'}, status=status.HTTP_200_OK)
