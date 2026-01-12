from rest_framework import generics, status, permissions
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from django.db.models import Q
from django.db import IntegrityError
from .models import Teacher
from .serializers import TeacherSerializer, TeacherCreateSerializer


class TeacherListCreateView(generics.ListCreateAPIView):
    """
    View for listing and creating teachers
    """
    queryset = Teacher.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TeacherCreateSerializer
        return TeacherSerializer
    
    def get_queryset(self):
        queryset = Teacher.objects.select_related('user').all()
        
        # Filter by department if provided
        department = self.request.query_params.get('department', None)
        if department:
            queryset = queryset.filter(department=department)
        
        return queryset
    
    def perform_create(self, serializer):
        # Only admin can create teachers
        if self.request.user.role != 'admin':
            raise PermissionDenied('Only administrators can create teachers.')
        try:
            serializer.save()
        except IntegrityError as e:
            msg = str(e)
            if 'username' in msg or 'auth_user.username' in msg:
                raise ValidationError({'username': 'A user with that username already exists.'})
            if 'email' in msg or 'auth_user.email' in msg:
                raise ValidationError({'email': 'A user with that email already exists.'})
            # fallback
            raise ValidationError({'non_field_errors': 'Unable to create teacher due to a database error.'})

    def create(self, request, *args, **kwargs):
        """
        Override create so POST returns a full teacher representation (including user details and generated employee_id)
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # perform_create will save via TeacherCreateSerializer
        self.perform_create(serializer)
        # Now serialize the created instance with the full TeacherSerializer for richer response
        teacher = TeacherSerializer(serializer.instance, context={'request': request})
        headers = self.get_success_headers(serializer.data)
        return Response(teacher.data, status=status.HTTP_201_CREATED, headers=headers)


class TeacherDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    View for retrieving, updating, and deleting a teacher
    """
    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Teachers can only view/edit their own profile, admin can view/edit all
        if self.request.user.role == 'admin':
            return Teacher.objects.select_related('user').all()
        elif self.request.user.role == 'teacher':
            try:
                return Teacher.objects.select_related('user').filter(user=self.request.user)
            except Teacher.DoesNotExist:
                return Teacher.objects.none()
        return Teacher.objects.none()


class TeacherSearchView(generics.ListAPIView):
    """
    View for searching teachers
    """
    serializer_class = TeacherSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        query = self.request.query_params.get('query', '')
        department_filter = self.request.query_params.get('department', None)
        
        queryset = Teacher.objects.select_related('user').all()
        
        if query:
            queryset = queryset.filter(
                Q(employee_id__icontains=query) |
                Q(user__first_name__icontains=query) |
                Q(user__last_name__icontains=query) |
                Q(user__username__icontains=query) |
                Q(department__icontains=query) |
                Q(designation__icontains=query)
            )
        
        if department_filter:
            queryset = queryset.filter(department=department_filter)
        
        return queryset


class TeacherQRCodeView(generics.RetrieveAPIView):
    """
    View for retrieving teacher QR code data
    """
    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer
    permission_classes = [permissions.IsAuthenticated]

    def retrieve(self, request, *args, **kwargs):
        teacher = self.get_object()
        # Permission: admins and the teacher themself can view
        if (request.user.role not in ['admin'] and teacher.user != request.user):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        # Ensure QR image exists
        if not teacher.qr_code:
            teacher.generate_qr_code()
            teacher.save()

        qr_data = teacher.get_qr_code_data()
        # Include absolute URL when possible
        try:
            qr_url = teacher.qr_code.url
            if request:
                qr_url = request.build_absolute_uri(qr_url)
            qr_data['qr_code_url'] = qr_url
        except Exception:
            pass

        # Add profile URL
        try:
            from django.conf import settings
            qr_data['profile_url'] = f"{getattr(settings, 'FRONTEND_URL', '').rstrip('/')}" + f"/public/teacher/{teacher.employee_id}"
        except Exception:
            pass

        # include safe user summary
        qr_data['user'] = {
            'first_name': teacher.user.first_name,
            'last_name': teacher.user.last_name,
            'profile_picture': teacher.user.profile_picture.url if teacher.user.profile_picture else None,
        }

        return Response(qr_data)


class PublicTeacherProfileView(generics.RetrieveAPIView):
    """
    Public profile view for teachers (non-sensitive)
    """
    queryset = Teacher.objects.all()
    permission_classes = [permissions.AllowAny]

    def get(self, request, employee_id, *args, **kwargs):
        try:
            teacher = Teacher.objects.get(employee_id=employee_id)
        except Teacher.DoesNotExist:
            return Response({'detail': 'Teacher not found'}, status=status.HTTP_404_NOT_FOUND)

        data = teacher.get_qr_code_data()
        safe_user = {
            'first_name': teacher.user.first_name,
            'last_name': teacher.user.last_name,
            'profile_picture': teacher.user.profile_picture.url if teacher.user.profile_picture else None,
        }
        data['user'] = safe_user
        return Response(data)