from rest_framework import generics, status, permissions
from django.db.models import Q
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
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        serializer.save()


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