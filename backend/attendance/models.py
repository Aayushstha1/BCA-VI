from django.db import models
from django.contrib.auth import get_user_model
from students.models import Student
from teachers.models import Teacher

User = get_user_model()


class Subject(models.Model):
    """
    Subject model for managing subjects
    """
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.code} - {self.name}"
    
    class Meta:
        ordering = ['name']


class Attendance(models.Model):
    """
    Attendance model for tracking student attendance
    """
    ATTENDANCE_STATUS = [
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('late', 'Late'),
        ('excused', 'Excused'),
    ]
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendances')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='attendances')
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='marked_attendances')
    date = models.DateField()
    status = models.CharField(max_length=10, choices=ATTENDANCE_STATUS, default='absent')
    remarks = models.TextField(blank=True, null=True)
    marked_at = models.DateTimeField(auto_now_add=True)
    marked_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='marked_attendances')
    
    def __str__(self):
        return f"{self.student.student_id} - {self.subject.name} - {self.date} - {self.status}"
    
    class Meta:
        unique_together = ['student', 'subject', 'date']
        ordering = ['-date', 'student__student_id']
        verbose_name = 'Attendance'
        verbose_name_plural = 'Attendance Records'


class AttendanceReport(models.Model):
    """
    Model for generating attendance reports
    """
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendance_reports')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='attendance_reports')
    month = models.PositiveIntegerField()  # 1-12
    year = models.PositiveIntegerField()
    total_days = models.PositiveIntegerField(default=0)
    present_days = models.PositiveIntegerField(default=0)
    absent_days = models.PositiveIntegerField(default=0)
    late_days = models.PositiveIntegerField(default=0)
    excused_days = models.PositiveIntegerField(default=0)
    attendance_percentage = models.FloatField(default=0.0)
    generated_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.student.student_id} - {self.subject.name} - {self.month}/{self.year} - {self.attendance_percentage}%"
    
    def calculate_percentage(self):
        if self.total_days > 0:
            present_count = self.present_days + self.late_days
            self.attendance_percentage = (present_count / self.total_days) * 100
        else:
            self.attendance_percentage = 0.0
    
    def save(self, *args, **kwargs):
        self.calculate_percentage()
        super().save(*args, **kwargs)
    
    class Meta:
        unique_together = ['student', 'subject', 'month', 'year']
        ordering = ['-year', '-month', 'student__student_id']
        verbose_name = 'Attendance Report'
        verbose_name_plural = 'Attendance Reports'