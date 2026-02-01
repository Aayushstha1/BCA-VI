from django.db import models
from django.conf import settings
from students.models import Student
from teachers.models import Teacher
from django.utils import timezone

class Task(models.Model):
    """Model for tasks assigned to students"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('closed', 'Closed'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    assigned_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='assigned_tasks')
    assigned_to_class = models.CharField(max_length=50, null=True, blank=True, help_text="Assign to entire class (e.g., 'BCA-I')")
    assigned_to_section = models.CharField(max_length=10, null=True, blank=True, help_text="Optional section when assigning to a class (e.g., 'A')")
    assigned_to_students = models.ManyToManyField(Student, related_name='assigned_tasks', blank=True, help_text="Specific students to assign task")
    due_date = models.DateTimeField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    total_marks = models.IntegerField(default=10)
    
    class Meta:
        ordering = ['-due_date']
    
    def __str__(self):
        return self.title
    
    @property
    def is_overdue(self):
        """Check if task deadline has passed"""
        return timezone.now() > self.due_date


class TaskSubmission(models.Model):
    """Model for student task submissions"""
    STATUS_CHOICES = [
        ('not_submitted', 'Not Submitted'),
        ('submitted', 'Submitted'),
        ('graded', 'Graded'),
    ]
    
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='task_submissions')
    submission_file = models.FileField(upload_to='task_submissions/%Y/%m/%d/')
    submitted_at = models.DateTimeField(null=True, blank=True)
    score = models.IntegerField(null=True, blank=True)
    feedback = models.TextField(null=True, blank=True, help_text="Teacher feedback on submission")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='not_submitted')
    is_late = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('task', 'student')
        ordering = ['-submitted_at']
    
    def __str__(self):
        return f"{self.student} - {self.task}"
    
    def save(self, *args, **kwargs):
        """Override save to check if submission is late"""
        if self.submitted_at:
            self.is_late = self.submitted_at > self.task.due_date
            # If late and no score given, mark as 0
            if self.is_late and self.score is None:
                self.score = 0
        super().save(*args, **kwargs)


class SubmissionRating(models.Model):
    """Rating on a task submission by a teacher or admin."""
    submission = models.ForeignKey(TaskSubmission, on_delete=models.CASCADE, related_name='ratings')
    rater = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='submission_ratings')
    score = models.IntegerField()  # 1-5
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('submission', 'rater')
        ordering = ['-created_at']

    def __str__(self):
        return f"SubmissionRating(submission={self.submission.id}, rater={self.rater.username}, score={self.score})"

