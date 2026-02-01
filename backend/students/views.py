from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Q
from .models import Student
from .serializers import (
    StudentSerializer, StudentCreateSerializer, StudentSearchSerializer,
    StudentProfileSerializer, StudentProfileUpdateSerializer
)
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


class StudentProfileView(generics.RetrieveUpdateAPIView):
    """
    View for student to view and edit their profile
    """
    serializer_class = StudentProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    
    def get_object(self):
        # Students can only access their own profile
        if self.request.user.role == 'student':
            try:
                return Student.objects.get(user=self.request.user)
            except Student.DoesNotExist:
                return None
        # Admin can access any student profile
        elif self.request.user.role == 'admin':
            student_id = self.kwargs.get('pk')
            try:
                return Student.objects.get(pk=student_id)
            except Student.DoesNotExist:
                return None
        return None
    
    def get(self, request, *args, **kwargs):
        obj = self.get_object()
        if not obj:
            return Response({'detail': 'Student profile not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(obj)
        return Response(serializer.data)
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return StudentProfileUpdateSerializer
        return StudentProfileSerializer
    
    def put(self, request, *args, **kwargs):
        obj = self.get_object()
        if not obj:
            return Response({'detail': 'Student profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = StudentProfileUpdateSerializer(obj, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            # Return the updated profile with full details
            profile_serializer = StudentProfileSerializer(obj, context={'request': request})
            return Response(profile_serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self, request, *args, **kwargs):
        obj = self.get_object()
        if not obj:
            return Response({'detail': 'Student profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = StudentProfileUpdateSerializer(obj, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            # Return the updated profile with full details
            profile_serializer = StudentProfileSerializer(obj, context={'request': request})
            return Response(profile_serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StudentProfilePictureUploadView(generics.UpdateAPIView):
    """
    View for uploading student profile picture (by admin or student)
    """
    queryset = Student.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)
    
    def put(self, request, *args, **kwargs):
        """Allow profile picture upload"""
        student_id = kwargs.get('pk')
        
        try:
            student = Student.objects.get(pk=student_id)
        except Student.DoesNotExist:
            return Response({'detail': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check permissions: student can upload their own, admin can upload anyone's
        if request.user.role == 'student' and student.user != request.user:
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # Check if profile_picture is in the request
        if 'profile_picture' not in request.FILES:
            return Response(
                {'detail': 'No profile_picture file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        profile_picture = request.FILES['profile_picture']
        student.profile_picture = profile_picture
        student.save()
        
        serializer = StudentProfileSerializer(student, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


# ------------------ CV Views ------------------
from rest_framework import generics, permissions
from .serializers import CVSerializer, CVCreateUpdateSerializer
from .models import CV

class IsOwnerOrReadForStaffTeacher(permissions.BasePermission):
    """Owner has full control, admin has full control, teacher has read-only access."""
    def has_object_permission(self, request, view, obj):
        # Admins have full access
        if request.user.role == 'admin':
            return True
        if request.method in permissions.SAFE_METHODS:
            # allow read if owner or teacher
            return obj.owner == request.user or request.user.role == 'teacher'
        # write operations allowed only for owner
        return obj.owner == request.user

class CVListCreateView(generics.ListCreateAPIView):
    serializer_class = CVSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'teacher']:
            return CV.objects.select_related('owner').all()
        return CV.objects.filter(owner=user)

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return CVCreateUpdateSerializer
        return CVSerializer

    def create(self, request, *args, **kwargs):
        # use the create/update serializer for validation and file handling
        serializer = CVCreateUpdateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        obj = serializer.save(owner=request.user)
        response_serializer = CVSerializer(obj, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class CVRatingCreateView(generics.CreateAPIView):
    """Create or update a rating for a CV by admin/teacher"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = None

    def post(self, request, pk):
        from .serializers import CVRatingSerializer
        try:
            cv = CV.objects.get(pk=pk)
        except CV.DoesNotExist:
            return Response({'detail': 'CV not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = CVRatingSerializer(data={**request.data, 'cv': cv.id}, context={'request': request})
        serializer.is_valid(raise_exception=True)
        obj = serializer.save()
        return Response(CVRatingSerializer(obj).data, status=status.HTTP_201_CREATED)


class CVRatingDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = None

    def get_object(self):
        from students.cv import CVRating
        try:
            return CVRating.objects.get(pk=self.kwargs.get('rating_pk'))
        except CVRating.DoesNotExist:
            return None

    def get(self, request, rating_pk):
        obj = self.get_object()
        if not obj:
            return Response({'detail': 'Rating not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(self._serialize(obj))

    def put(self, request, rating_pk):
        obj = self.get_object()
        if not obj:
            return Response({'detail': 'Rating not found'}, status=status.HTTP_404_NOT_FOUND)
        # Only rater or admin can update
        if request.user != obj.rater and request.user.role != 'admin':
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        from .serializers import CVRatingSerializer
        serializer = CVRatingSerializer(obj, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(self._serialize(obj))

    def delete(self, request, rating_pk):
        obj = self.get_object()
        if not obj:
            return Response({'detail': 'Rating not found'}, status=status.HTTP_404_NOT_FOUND)
        if request.user != obj.rater and request.user.role != 'admin':
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def _serialize(self, obj):
        from .serializers import CVRatingSerializer
        return CVRatingSerializer(obj).data

class CVDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = CV.objects.select_related('owner').all()
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadForStaffTeacher]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return CVCreateUpdateSerializer
        return CVSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'teacher']:
            return CV.objects.select_related('owner').all()
        return CV.objects.filter(owner=user)

    def perform_update(self, serializer):
        # owner cannot be changed via update; ownership enforced
        serializer.save()


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def reset_student_password(request, pk):
    """Admin-only: generate a secure one-time password for a student and return it once."""
    try:
        student = Student.objects.select_related('user').get(pk=pk)
    except Student.DoesNotExist:
        return Response({'detail': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)

    # Only admin is allowed to reset and view the temporary password
    if request.user.role != 'admin':
        return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    try:
        import secrets, string
        alphabet = string.ascii_letters + string.digits + "!@#$%&*"
        temporary_password = ''.join(secrets.choice(alphabet) for _ in range(12))

        user = student.user
        user.set_password(temporary_password)
        user.save()

        # Optionally, you might want to log that admin performed a reset without storing the password
        return Response({'temporary_password': temporary_password}, status=status.HTTP_200_OK)
    except Exception:
        logging.exception('Failed to reset student password')
        return Response({'detail': 'Internal server error while resetting password'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)