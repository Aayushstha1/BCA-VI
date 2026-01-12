from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q
from .models import Student
from .serializers import StudentSerializer, StudentCreateSerializer, StudentSearchSerializer
import logging


class StudentListCreateView(generics.ListCreateAPIView):
    """
    View for listing and creating students
    """
    queryset = Student.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return StudentCreateSerializer
        return StudentSerializer
    
    def get_queryset(self):
        queryset = Student.objects.select_related('user').all()
        
        # Filter by class if provided
        current_class = self.request.query_params.get('class', None)
        if current_class:
            queryset = queryset.filter(current_class=current_class)
        
        # Filter by section if provided
        section = self.request.query_params.get('section', None)
        if section:
            queryset = queryset.filter(current_section=section)
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        # Defensive: catch unexpected serialization errors to avoid 500s without logs
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            logging.exception('Failed to list students')
            return Response({'error': 'Internal server error while listing students'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def perform_create(self, serializer):
        # Only admin can create students
        from rest_framework.exceptions import PermissionDenied
        if self.request.user.role != 'admin':
            raise PermissionDenied('Permission denied')
        serializer.save()


class StudentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    View for retrieving, updating, and deleting a student
    """
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Students can only view their own profile, admin and teachers can view all
        if self.request.user.role == 'admin' or self.request.user.role == 'teacher':
            return Student.objects.select_related('user').all()
        elif self.request.user.role == 'student':
            try:
                return Student.objects.select_related('user').filter(user=self.request.user)
            except Student.DoesNotExist:
                return Student.objects.none()
        return Student.objects.none()


class StudentQRCodeView(generics.RetrieveAPIView):
    """
    View for retrieving student QR code data
    """
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def retrieve(self, request, *args, **kwargs):
        student = self.get_object()
        
        # Check permissions
        if (request.user.role not in ['admin', 'teacher'] and 
            student.user != request.user):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # Ensure a QR image exists; generate if missing
        if not student.qr_code:
            student.generate_qr_code()
            student.save()

        qr_data = student.get_qr_code_data()
        # Also include absolute URL to QR image when possible
        request_obj = request
        if student.qr_code:
            try:
                qr_url = student.qr_code.url
                if request_obj:
                    qr_url = request_obj.build_absolute_uri(qr_url)
                qr_data['qr_code_url'] = qr_url
            except Exception:
                pass

        # Also include a profile URL for the frontend if configured
        try:
            from django.conf import settings
            qr_data['profile_url'] = f"{getattr(settings, 'FRONTEND_URL', '').rstrip('/')}" + f"/public/student/{student.student_id}"
        except Exception:
            pass

        return Response(qr_data)


class StudentSearchView(generics.ListAPIView):
    """
    View for searching students
    """
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        query = self.request.query_params.get('query', '')
        class_filter = self.request.query_params.get('class', None)
        
        queryset = Student.objects.select_related('user').all()
        
        if query:
            queryset = queryset.filter(
                Q(student_id__icontains=query) |
                Q(user__first_name__icontains=query) |
                Q(user__last_name__icontains=query) |
                Q(user__username__icontains=query) |
                Q(current_class__icontains=query) |
                Q(roll_number__icontains=query)
            )
        
        if class_filter:
            queryset = queryset.filter(current_class=class_filter)
        
        return queryset


class PublicStudentProfileView(generics.RetrieveAPIView):
    """
    Public profile view for students (safe, non-sensitive)
    """
    queryset = Student.objects.all()
    permission_classes = [permissions.AllowAny]

    def get(self, request, student_id, *args, **kwargs):
        try:
            student = Student.objects.get(student_id=student_id)
        except Student.DoesNotExist:
            return Response({'detail': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)

        data = student.get_qr_code_data()
        # Do not include any sensitive user fields like email/password
        safe_user = {
            'first_name': student.user.first_name,
            'last_name': student.user.last_name,
            'profile_picture': student.user.profile_picture.url if student.user.profile_picture else None,
        }
        data['user'] = safe_user
        return Response(data)