import logging
from rest_framework import generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.contrib.auth.models import User
from rest_framework.exceptions import PermissionDenied
from students.models import Student
from .models import AcademicYear, Semester, Exam, Result, ClassSubjectAssignment
from .serializers import AcademicYearSerializer, SemesterSerializer, ExamSerializer, ResultSerializer, ClassSubjectAssignmentSerializer
from .notifications import build_result_notification

logger = logging.getLogger(__name__)


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
        if getattr(user, 'role', None) == 'student':
            return Result.objects.filter(student__user=user, status='approved')
        # Teachers see their own published and pending results
        if getattr(user, 'role', None) == 'teacher':
            return Result.objects.filter(published_by=user).exclude(status='draft')
        # Admins see all non-draft results
        if getattr(user, 'role', None) == 'admin':
            return Result.objects.exclude(status='draft')
        return Result.objects.none()
    
    def perform_create(self, serializer):
        user = self.request.user
        status_value = 'draft'
        published_at = None
        approved_by = None
        approved_at = None

        if getattr(user, 'role', None) == 'teacher':
            status_value = 'pending_approval'
            published_at = timezone.now()
        elif getattr(user, 'role', None) == 'admin':
            status_value = 'approved'
            published_at = timezone.now()
            approved_by = user
            approved_at = timezone.now()

        serializer.save(
            published_by=user,
            status=status_value,
            published_at=published_at,
            approved_by=approved_by,
            approved_at=approved_at
        )


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
        class_id = request.data.get('class')
        section = request.data.get('section')
        if not exam_id:
            return Response({'detail': 'exam_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get all draft results for this exam published by this teacher
        results = Result.objects.filter(exam_id=exam_id, published_by=request.user, status='draft')
        if class_id:
            results = results.filter(student__current_class=class_id)
        if section is not None:
            results = results.filter(student__current_section=section)
        
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
        section = request.data.get('section')
        action_type = request.data.get('action')  # 'approve' or 'reject'
        approval_remarks = request.data.get('remarks', '')
        
        if not exam_id or not action_type:
            return Response({'detail': 'exam and action are required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get all pending results for this exam and class
        results = Result.objects.filter(exam_id=exam_id, status='pending_approval')
        
        if class_id:
            results = results.filter(student__current_class=class_id)
        if section is not None:
            results = results.filter(student__current_section=section)
        
        if not results.exists():
            return Response({'detail': 'No pending results to approve.'}, status=status.HTTP_404_NOT_FOUND)
        
        if action_type == 'approve':
            student_ids = list(results.values_list('student_id', flat=True).distinct())
            results.update(
                status='approved',
                approved_by=request.user,
                approved_at=timezone.now(),
                approval_remarks=approval_remarks
            )
            # Create notifications for students
            try:
                from notices.models import UserNotification
                try:
                    exam_name = Exam.objects.get(pk=exam_id).name
                except Exception:
                    exam_name = f"Exam {exam_id}"

                payload = build_result_notification(
                    exam_name=exam_name,
                    class_name=class_id,
                    section=section,
                )

                students = Student.objects.filter(id__in=student_ids).select_related('user')
                for student in students:
                    if not student.user_id:
                        continue
                    UserNotification.objects.create(user=student.user, **payload)
            except Exception:
                logger.exception("Failed to create result notifications")
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


class ClassSubjectAssignmentListCreateView(generics.ListCreateAPIView):
    serializer_class = ClassSubjectAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = ClassSubjectAssignment.objects.select_related('subject', 'teacher', 'teacher__user').all()
        class_name = self.request.query_params.get('class_name')
        section = self.request.query_params.get('section')
        is_active = self.request.query_params.get('is_active')

        if class_name:
            qs = qs.filter(class_name=class_name)
        if section is not None:
            qs = qs.filter(section=section)
        if is_active is not None:
            qs = qs.filter(is_active=str(is_active).lower() in ['1', 'true', 'yes'])

        user = self.request.user
        if getattr(user, 'role', None) == 'teacher' and hasattr(user, 'teacher_profile'):
            qs = qs.filter(teacher=user.teacher_profile, is_active=True)
        elif getattr(user, 'role', None) == 'student':
            try:
                student = Student.objects.get(user=user)
                qs = qs.filter(class_name=student.current_class, section=student.current_section, is_active=True)
            except Student.DoesNotExist:
                return ClassSubjectAssignment.objects.none()

        return qs

    def perform_create(self, serializer):
        if getattr(self.request.user, 'role', None) != 'admin':
            raise PermissionDenied('Only administrators can create class subject assignments.')
        serializer.save()


class ClassSubjectAssignmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ClassSubjectAssignment.objects.select_related('subject', 'teacher', 'teacher__user').all()
    serializer_class = ClassSubjectAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_update(self, serializer):
        if getattr(self.request.user, 'role', None) != 'admin':
            raise PermissionDenied('Only administrators can update class subject assignments.')
        serializer.save()

    def perform_destroy(self, instance):
        if getattr(self.request.user, 'role', None) != 'admin':
            raise PermissionDenied('Only administrators can delete class subject assignments.')
        instance.delete()
