from rest_framework import generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.contrib.auth.models import User
from .models import AcademicYear, Semester, Exam, Result
from .serializers import AcademicYearSerializer, SemesterSerializer, ExamSerializer, ResultSerializer


class AcademicYearListCreateView(generics.ListCreateAPIView):
    queryset = AcademicYear.objects.all()
    serializer_class = AcademicYearSerializer
    permission_classes = [permissions.IsAuthenticated]


class AcademicYearDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = AcademicYear.objects.all()
    serializer_class = AcademicYearSerializer
    permission_classes = [permissions.IsAuthenticated]


class SemesterListCreateView(generics.ListCreateAPIView):
    queryset = Semester.objects.all()
    serializer_class = SemesterSerializer
    permission_classes = [permissions.IsAuthenticated]


class SemesterDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Semester.objects.all()
    serializer_class = SemesterSerializer
    permission_classes = [permissions.IsAuthenticated]


class ExamListCreateView(generics.ListCreateAPIView):
    queryset = Exam.objects.all()
    serializer_class = ExamSerializer
    permission_classes = [permissions.IsAuthenticated]


class ExamDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Exam.objects.all()
    serializer_class = ExamSerializer
    permission_classes = [permissions.IsAuthenticated]


class ResultListCreateView(generics.ListCreateAPIView):
    queryset = Result.objects.all()
    serializer_class = ResultSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # Students see only approved results
        if hasattr(user, 'student'):
            return Result.objects.filter(student__user=user, status='approved')
        # Teachers see their own published and pending results
        elif hasattr(user, 'teacher'):
            return Result.objects.filter(published_by=user).exclude(status='draft')
        # Admins see all non-draft results
        else:
            return Result.objects.exclude(status='draft')
    
    def perform_create(self, serializer):
        # When teacher creates results, set status to draft
        result = serializer.save(published_by=self.request.user, status='draft')


class ResultDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Result.objects.all()
    serializer_class = ResultSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def update(self, request, *args, **kwargs):
        result = self.get_object()
        # Only teachers can edit draft results
        if result.published_by != request.user or result.status != 'draft':
            return Response({'detail': 'You can only edit your own draft results.'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)


class PublishResultsView(generics.GenericAPIView):
    """
    Teacher publishes results for a class/exam
    """
    serializer_class = ResultSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        exam_id = request.data.get('exam_id')
        if not exam_id:
            return Response({'detail': 'exam_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get all draft results for this exam published by this teacher
        results = Result.objects.filter(exam_id=exam_id, published_by=request.user, status='draft')
        
        if not results.exists():
            return Response({'detail': 'No draft results to publish.'}, status=status.HTTP_404_NOT_FOUND)
        
        # Update status to pending_approval
        results.update(status='pending_approval', published_at=timezone.now())
        
        return Response({
            'detail': f'{results.count()} results published and pending approval',
            'count': results.count()
        }, status=status.HTTP_200_OK)


class ApproveResultsView(generics.GenericAPIView):
    """
    Admin approves results for a class/exam
    """
    serializer_class = ResultSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        exam_id = request.data.get('exam')
        class_id = request.data.get('class')
        action_type = request.data.get('action')  # 'approve' or 'reject'
        approval_remarks = request.data.get('remarks', '')
        
        if not exam_id or not action_type:
            return Response({'detail': 'exam and action are required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get all pending results for this exam and class
        results = Result.objects.filter(exam_id=exam_id, status='pending_approval')
        
        if class_id:
            results = results.filter(student__current_class=class_id)
        
        if not results.exists():
            return Response({'detail': 'No pending results to approve.'}, status=status.HTTP_404_NOT_FOUND)
        
        if action_type == 'approve':
            results.update(
                status='approved',
                approved_by=request.user,
                approved_at=timezone.now(),
                approval_remarks=approval_remarks
            )
            return Response({
                'detail': f'{results.count()} results approved',
                'count': results.count()
            }, status=status.HTTP_200_OK)
        
        elif action_type == 'reject':
            results.update(
                status='rejected',
                approval_remarks=approval_remarks
            )
            return Response({
                'detail': f'{results.count()} results rejected',
                'count': results.count()
            }, status=status.HTTP_200_OK)
        
        return Response({'detail': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)