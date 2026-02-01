from rest_framework import serializers
from .models import Task, TaskSubmission
from students.models import Student
from accounts.models import User
from django.utils import timezone

class TaskSerializer(serializers.ModelSerializer):
    assigned_by_name = serializers.CharField(source='assigned_by.get_full_name', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    submission_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'assigned_by', 'assigned_by_name', 'assigned_to_class', 'assigned_to_section',
                  'due_date', 'status', 'created_at', 'total_marks', 'is_overdue', 'submission_count']
        read_only_fields = ['created_at', 'assigned_by']
    
    def get_submission_count(self, obj):
        return obj.submissions.count()


class TaskDetailSerializer(serializers.ModelSerializer):
    assigned_by_name = serializers.CharField(source='assigned_by.get_full_name', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    assigned_to_students = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(),
        many=True,
        required=False
    )
    
    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'assigned_by', 'assigned_by_name', 'assigned_to_class', 'assigned_to_section',
                  'assigned_to_students', 'due_date', 'status', 'created_at', 'updated_at', 
                  'total_marks', 'is_overdue']
        read_only_fields = ['created_at', 'updated_at', 'assigned_by']


class TaskSubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    task_title = serializers.CharField(source='task.title', read_only=True)
    due_date = serializers.DateTimeField(source='task.due_date', read_only=True)
    average_rating = serializers.SerializerMethodField()
    ratings_count = serializers.SerializerMethodField()
    user_rating = serializers.SerializerMethodField()
    
    class Meta:
        model = TaskSubmission
        fields = ['id', 'task', 'task_title', 'student', 'student_name', 'student_id', 'submission_file',
                  'submitted_at', 'score', 'feedback', 'status', 'is_late', 'due_date', 'created_at', 'average_rating', 'ratings_count', 'user_rating']
        read_only_fields = ['created_at', 'is_late', 'status']

    def get_average_rating(self, obj):
        try:
            agg = obj.ratings.aggregate(avg=models.Avg('score'), count=models.Count('id'))
            return round(agg['avg'], 2) if agg['avg'] is not None else None
        except Exception:
            return None

    def get_ratings_count(self, obj):
        try:
            agg = obj.ratings.aggregate(count=models.Count('id'))
            return agg['count']
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

class TaskSubmissionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskSubmission
        fields = ['submission_file']
    
    def create(self, validated_data):
        task_id = self.context['task_id']
        student = self.context['student']
        
        submission = TaskSubmission.objects.create(
            task_id=task_id,
            student=student,
            submission_file=validated_data['submission_file'],
            submitted_at=timezone.now(),
            status='submitted'
        )
        return submission


class TaskSubmissionGradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskSubmission
        fields = ['score', 'feedback', 'status']


class StudentTaskScoreSerializer(serializers.Serializer):
    """Serializer for student task scores to be displayed in profile"""
    total_tasks = serializers.IntegerField()
    completed_tasks = serializers.IntegerField()
    average_score = serializers.FloatField()
    total_score = serializers.IntegerField()

from django.utils import timezone
