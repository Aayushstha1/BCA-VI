from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Teacher(models.Model):
    """
    Teacher model for managing teacher information
    """
    QUALIFICATION_CHOICES = [
        ('B.A', 'Bachelor of Arts'),
        ('B.Sc', 'Bachelor of Science'),
        ('B.Ed', 'Bachelor of Education'),
        ('M.A', 'Master of Arts'),
        ('M.Sc', 'Master of Science'),
        ('M.Ed', 'Master of Education'),
        ('Ph.D', 'Doctor of Philosophy'),
        ('Other', 'Other'),
    ]
    
    DEPARTMENT_CHOICES = [
        ('Mathematics', 'Mathematics'),
        ('Science', 'Science'),
        ('English', 'English'),
        ('Social Studies', 'Social Studies'),
        ('Physical Education', 'Physical Education'),
        ('Computer Science', 'Computer Science'),
        ('Arts', 'Arts'),
        ('Music', 'Music'),
        ('Other', 'Other'),
    ]
    
    # Basic Information
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='teacher_profile')
    employee_id = models.CharField(max_length=20, unique=True)
    joining_date = models.DateField()
    
    # Professional Information
    qualification = models.CharField(max_length=20, choices=QUALIFICATION_CHOICES)
    department = models.CharField(max_length=50, choices=DEPARTMENT_CHOICES)
    designation = models.CharField(max_length=50, default='Teacher')
    experience_years = models.PositiveIntegerField(default=0)
    salary = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    
    # Contact Information
    emergency_contact = models.CharField(max_length=15, blank=True, null=True)
    emergency_contact_name = models.CharField(max_length=100, blank=True, null=True)
    
    # System fields
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.employee_id} - {self.user.get_full_name()}"
    
    class Meta:
        ordering = ['employee_id']
        verbose_name = 'Teacher'
        verbose_name_plural = 'Teachers'