from rest_framework import generics, status
from rest_framework import permissions as drf_permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone
from django.db.models import Q, Avg, Count
from .models import Task, TaskSubmission, SubmissionRating
from .serializers import (
    TaskSerializer, TaskDetailSerializer, TaskSubmissionSerializer,
    TaskSubmissionCreateSerializer, TaskSubmissionGradeSerializer,
    StudentTaskScoreSerializer
)
from .rating_serializers import SubmissionRatingSerializer
from students.models import Student

class TaskListCreateView(generics.ListCreateAPIView):
    """
    List tasks for current user (student sees assigned, teacher/admin see all)
    Create new task (teacher/admin only)
    """
    serializer_class = TaskSerializer
    permission_classes = [drf_permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'student':
            # Students see tasks assigned to them, their class, or their class+section
            try:
                student = Student.objects.get(user=user)
                return Task.objects.filter(
                    Q(assigned_to_students=student) |
                    (Q(assigned_to_class=student.current_class) & (Q(assigned_to_section__isnull=True) | Q(assigned_to_section='') | Q(assigned_to_section=student.current_section)))
                ).distinct()
            except Student.DoesNotExist:
                return Task.objects.none()
        
        elif user.role == 'teacher':
            # Teachers see tasks they created
            return Task.objects.filter(assigned_by=user).order_by('-due_date')
        elif user.role == 'admin':
            # Admins see all tasks across teachers
            return Task.objects.all().order_by('-due_date')
        
        return Task.objects.none()
    
    def perform_create(self, serializer):
        # Only teacher and admin can create tasks
        if self.request.user.role not in ['teacher', 'admin']:
            raise PermissionDenied('Only teachers and admins can create tasks')

        # If teacher, ensure they are assigning only to their permitted class/section
        if self.request.user.role == 'teacher':
            teacher = getattr(self.request.user, 'teacher_profile', None)
            if teacher is None:
                raise PermissionDenied('Teacher profile not found')

            assigned_to_class = serializer.validated_data.get('assigned_to_class')
            assigned_to_section = serializer.validated_data.get('assigned_to_section')

            # If assigning to a class/section, check permissions
            if assigned_to_class:
                if assigned_to_section:
                    # Allowed if teacher has either that specific section OR whole-class permission (empty section)
                    allowed = teacher.assigned_sections.filter(class_name=assigned_to_class, section__in=[assigned_to_section, None, '']).exists()
                else:
                    # Only allow whole-class assignment if teacher explicitly has an entry with empty section
                    allowed = teacher.assigned_sections.filter(class_name=assigned_to_class, section__in=[None, '']).exists()

                if not allowed:
                    raise PermissionDenied('You are not allowed to assign to this class/section')

        serializer.save(assigned_by=self.request.user)


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a specific task
    """
    serializer_class = TaskDetailSerializer
    permission_classes = [drf_permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'student':
            try:
                student = Student.objects.get(user=user)
                return Task.objects.filter(
                    Q(assigned_to_students=student) |
                    (Q(assigned_to_class=student.current_class) & (Q(assigned_to_section__isnull=True) | Q(assigned_to_section='') | Q(assigned_to_section=student.current_section)))
                ).distinct()
            except Student.DoesNotExist:
                return Task.objects.none()
        
        elif user.role in ['teacher', 'admin']:
            return Task.objects.filter(assigned_by=user)
        
        return Task.objects.none()
    
    def perform_update(self, serializer):
        if serializer.instance.assigned_by != self.request.user:
            raise PermissionDenied('You can only edit tasks you created')
        serializer.save()
    
    def perform_destroy(self, instance):
        if instance.assigned_by != self.request.user:
            raise PermissionDenied('You can only delete tasks you created')
        instance.delete()


class TaskSubmissionListView(generics.ListAPIView):
    """
    List submissions for a task (teacher/admin) or student's submissions
    """
    serializer_class = TaskSubmissionSerializer
    permission_classes = [drf_permissions.IsAuthenticated]
    
    def get_queryset(self):
        task_id = self.kwargs.get('task_id')
        user = self.request.user
        
        task = Task.objects.get(id=task_id)
        
        if user.role == 'student':
            # Students see only their own submission
            try:
                student = Student.objects.get(user=user)
                return TaskSubmission.objects.filter(task_id=task_id, student=student)
            except Student.DoesNotExist:
                return TaskSubmission.objects.none()
        
        elif user.role in ['teacher', 'admin']:
            # Teachers/admins see all submissions for their tasks
            if task.assigned_by != user and user.role != 'admin':
                raise PermissionDenied('You can only see submissions for your tasks')
            return TaskSubmission.objects.filter(task_id=task_id).order_by('-submitted_at')
        
        return TaskSubmission.objects.none()


class StudentTaskSubmitView(generics.CreateAPIView):
    """
    Student submits a task
    """
    serializer_class = TaskSubmissionCreateSerializer
    permission_classes = [drf_permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)
    
    def create(self, request, *args, **kwargs):
        task_id = self.kwargs.get('task_id')
        
        try:
            task = Task.objects.get(id=task_id)
        except Task.DoesNotExist:
            return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)
        
        try:
            student = Student.objects.get(user=request.user)
        except Student.DoesNotExist:
            return Response({'error': 'Student profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if student is assigned to this task
        is_assigned = task.assigned_to_students.filter(id=student.id).exists() or \
                      (task.assigned_to_class == student.current_class and (not task.assigned_to_section or task.assigned_to_section == student.current_section))
        
        if not is_assigned:
            return Response({'error': 'You are not assigned to this task'}, status=status.HTTP_403_FORBIDDEN)
        
        # Check if already submitted
        existing = TaskSubmission.objects.filter(task=task, student=student).first()
        if existing and existing.status in ['submitted', 'graded']:
            return Response({'error': 'You have already submitted this task'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        serializer = self.get_serializer(data=request.data, context={
            'task_id': task_id,
            'student': student
        })
        serializer.is_valid(raise_exception=True)
        submission = serializer.save()
        
        return Response(TaskSubmissionSerializer(submission).data, status=status.HTTP_201_CREATED)


class TaskSubmissionGradeView(generics.UpdateAPIView):
    """
    Grade a student's task submission
    """
    serializer_class = TaskSubmissionGradeSerializer
    permission_classes = [drf_permissions.IsAuthenticated]
    
    def get_queryset(self):
        return TaskSubmission.objects.all()
    
    def get_object(self):
        submission_id = self.kwargs.get('submission_id')
        submission = TaskSubmission.objects.get(id=submission_id)
        
        # Only task creator or admin can grade
        if self.request.user.role == 'admin' or submission.task.assigned_by == self.request.user:
            return submission
        
        raise PermissionDenied('You cannot grade this submission')
    
    def perform_update(self, serializer):
        submission = serializer.save(status='graded')

        # Create a user notification and send an email to the student
        try:
            from notices.models import UserNotification
            from django.core.mail import send_mail
            student_user = submission.student.user
            title = f"Your submission for '{submission.task.title}' has been graded"
            content = f"Your submission for the task '{submission.task.title}' was graded with score {submission.score}.\n\nFeedback: {submission.feedback or 'No feedback provided.'}"

            # Create in-app notification
            UserNotification.objects.create(
                user=student_user,
                title=title,
                content=content,
                link=f"/student/tasks"  # frontend link to student tasks; can be improved
            )

            # Send email (fail silently in case of email backend not configured)
            if student_user.email:
                send_mail(
                    subject=title,
                    message=content,
                    from_email=None,
                    recipient_list=[student_user.email],
                    fail_silently=True,
                )
        except Exception:
            # Don't let notification failures block grading
            pass


@api_view(['GET'])
@permission_classes([drf_permissions.IsAuthenticated])
def student_task_scores(request, student_id):
    """
    Get task score summary for a student
    """
    try:
        student = Student.objects.get(id=student_id)
    except Student.DoesNotExist:
        return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Check permission - student can view own, admin/teacher can view any
    if request.user.role == 'student' and student.user != request.user:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    submissions = TaskSubmission.objects.filter(student=student, status='graded')
    
    total_tasks = Task.objects.filter(
        Q(assigned_to_students=student) |
        (Q(assigned_to_class=student.current_class) & (Q(assigned_to_section__isnull=True) | Q(assigned_to_section='') | Q(assigned_to_section=student.current_section)))
    ).distinct().count()
    
    completed = submissions.count()
    total_score = sum(sub.score for sub in submissions if sub.score is not None)
    avg_score = submissions.aggregate(Avg('score'))['score__avg'] or 0
    
    return Response({
        'total_tasks': total_tasks,
        'completed_tasks': completed,
        'total_score': total_score,
        'average_score': round(avg_score, 2)
    })


# Submission rating endpoints
class SubmissionRatingCreateView(generics.CreateAPIView):
    permission_classes = [drf_permissions.IsAuthenticated]
    serializer_class = SubmissionRatingSerializer

    def post(self, request, submission_id):
        try:
            submission = TaskSubmission.objects.get(pk=submission_id)
        except TaskSubmission.DoesNotExist:
            return Response({'detail': 'Submission not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = SubmissionRatingSerializer(data={**request.data, 'submission': submission.id}, context={'request': request})
        serializer.is_valid(raise_exception=True)
        obj = serializer.save()
        return Response(SubmissionRatingSerializer(obj).data, status=status.HTTP_201_CREATED)


class SubmissionRatingDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [drf_permissions.IsAuthenticated]
    serializer_class = SubmissionRatingSerializer

    def get_object(self):
        try:
            return SubmissionRating.objects.get(pk=self.kwargs.get('rating_pk'))
        except SubmissionRating.DoesNotExist:
            return None

    def get(self, request, rating_pk):
        obj = self.get_object()
        if not obj:
            return Response({'detail': 'Rating not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(SubmissionRatingSerializer(obj).data)

    def put(self, request, rating_pk):
        obj = self.get_object()
        if not obj:
            return Response({'detail': 'Rating not found'}, status=status.HTTP_404_NOT_FOUND)
        if request.user != obj.rater and request.user.role != 'admin':
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        serializer = SubmissionRatingSerializer(obj, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(SubmissionRatingSerializer(obj).data)

    def delete(self, request, rating_pk):
        obj = self.get_object()
        if not obj:
            return Response({'detail': 'Rating not found'}, status=status.HTTP_404_NOT_FOUND)
        if request.user != obj.rater and request.user.role != 'admin':
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
