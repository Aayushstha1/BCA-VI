from django.db import models
from django.conf import settings
from students.models import Student
from attendance.models import Subject
from teachers.models import Teacher
from .notifications import build_result_notification


class Exam(models.Model):
    """
    Exam model for managing different types of exams
    """
    EXAM_TYPES = [
        ('unit_test', 'Unit Test'),
        ('mid_term', 'Mid Term'),
        ('final', 'Final Exam'),
        ('practical', 'Practical'),
        ('assignment', 'Assignment'),
        ('project', 'Project'),
    ]
    
    name = models.CharField(max_length=100)
    exam_type = models.CharField(max_length=20, choices=EXAM_TYPES)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='exams')
    total_marks = models.PositiveIntegerField()
    passing_marks = models.PositiveIntegerField()
    exam_date = models.DateField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} - {self.subject.name}"
    
    class Meta:
        ordering = ['-exam_date']


class Result(models.Model):
    """
    Result model for managing student exam results with approval workflow
    """
    GRADE_CHOICES = [
        ('A+', 'A+'),
        ('A', 'A'),
        ('B+', 'B+'),
        ('B', 'B'),
        ('C+', 'C+'),
        ('C', 'C'),
        ('D', 'D'),
        ('F', 'F'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('pending_approval', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='results')
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='results')
    marks_obtained = models.PositiveIntegerField()
    grade = models.CharField(max_length=2, choices=GRADE_CHOICES, blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    published_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='published_results')
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_results')
    approval_remarks = models.TextField(blank=True, null=True)
    published_at = models.DateTimeField(null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.student.student_id} - {self.exam.name} - {self.marks_obtained}"
    
    def calculate_grade(self):
        percentage = (self.marks_obtained / self.exam.total_marks) * 100
        
        if percentage >= 90:
            return 'A+'
        elif percentage >= 80:
            return 'A'
        elif percentage >= 70:
            return 'B+'
        elif percentage >= 60:
            return 'B'
        elif percentage >= 50:
            return 'C+'
        elif percentage >= 40:
            return 'C'
        elif percentage >= self.exam.passing_marks:
            return 'D'
        else:
            return 'F'
    
    def save(self, *args, **kwargs):
        previous_status = None
        if self.pk:
            previous_status = Result.objects.filter(pk=self.pk).values_list('status', flat=True).first()
        self.grade = self.calculate_grade()
        super().save(*args, **kwargs)
        if self.status == 'approved' and previous_status != 'approved':
            self._create_result_notification()

    def _create_result_notification(self):
        try:
            from notices.models import UserNotification
            if not self.student_id:
                return
            if not getattr(self.student, 'user', None):
                return
            payload = build_result_notification(
                exam_name=self.exam.name if self.exam else "Exam",
                class_name=self.student.current_class if self.student else None,
                section=self.student.current_section if self.student else None,
            )
            exists = UserNotification.objects.filter(
                user=self.student.user,
                title=payload["title"],
                content=payload["content"],
            ).exists()
            if not exists:
                UserNotification.objects.create(user=self.student.user, **payload)
        except Exception:
            pass
    
    class Meta:
        unique_together = ['student', 'exam']
        ordering = ['-created_at']


class ClassSubjectAssignment(models.Model):
    """
    Fixed subject-teacher mapping per class/section.
    """
    class_name = models.CharField(max_length=20)
    section = models.CharField(max_length=10, blank=True, default='')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='class_subject_assignments')
    teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True, related_name='class_subject_assignments')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        section_part = f" {self.section}" if self.section else ""
        teacher_part = self.teacher.user.get_full_name() if self.teacher else "Unassigned"
        return f"Class {self.class_name}{section_part} - {self.subject.name} ({teacher_part})"

    class Meta:
        unique_together = ['class_name', 'section', 'subject']
        ordering = ['class_name', 'section', 'subject__name']


class AcademicYear(models.Model):
    """
    Academic Year model for managing academic sessions
    """
    name = models.CharField(max_length=20, unique=True)
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if self.is_current:
            # Set all other academic years to not current
            AcademicYear.objects.filter(is_current=True).update(is_current=False)
        super().save(*args, **kwargs)
    
    class Meta:
        ordering = ['-start_date']


class Semester(models.Model):
    """
    Semester model for managing semesters within academic years
    """
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='semesters')
    name = models.CharField(max_length=50)
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.academic_year.name} - {self.name}"
    
    def save(self, *args, **kwargs):
        if self.is_current:
            # Set all other semesters to not current
            Semester.objects.filter(is_current=True).update(is_current=False)
        super().save(*args, **kwargs)
    
    class Meta:
        unique_together = ['academic_year', 'name']
        ordering = ['academic_year', 'name']
