from django.db import models
from django.contrib.auth import get_user_model
import uuid

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
    qr_code = models.ImageField(upload_to='qr_codes/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.employee_id} - {self.user.get_full_name()}"
    
    def save(self, *args, **kwargs):
        if not self.employee_id:
            # Generate unique employee ID if not provided
            self.employee_id = f"TCH{str(uuid.uuid4())[:8].upper()}"
        # Generate QR code if not exists
        if not self.qr_code:
            try:
                self.generate_qr_code()
            except Exception:
                # Fail silently; QR generation is optional
                pass
        super().save(*args, **kwargs)

    def generate_qr_code(self):
        """
        Generate QR code image for teacher containing basic information
        """
        try:
            import qrcode
            from io import BytesIO
            from django.core.files.base import ContentFile

            qr_data = {
                'employee_id': self.employee_id,
                'name': self.user.get_full_name(),
                'department': self.department,
                'designation': self.designation,
                'qualification': self.qualification,
            }

                # Prefer encoding a frontend profile URL in the QR so scanning opens a readable page
            try:
                from django.conf import settings
                profile_url = f"{getattr(settings, 'FRONTEND_URL', '').rstrip('/')}" + f"/public/teacher/{self.employee_id}"
                qr_payload = profile_url
            except Exception:
                qr_payload = "|".join([f"{k}:{v}" for k, v in qr_data.items()])

            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(qr_payload)
            qr.make(fit=True)
            img = qr.make_image(fill_color="black", back_color="white")

            buffer = BytesIO()
            img.save(buffer, format='PNG')
            buffer.seek(0)

            filename = f"qr_{self.employee_id}.png"
            self.qr_code.save(filename, ContentFile(buffer.getvalue()), save=False)
        except Exception:
            # Log or ignore silently
            pass

    def get_qr_code_data(self):
        """
        Return QR code data as dictionary for teacher
        """
        data = {
            'employee_id': self.employee_id,
            'name': self.user.get_full_name(),
            'department': self.department,
            'designation': self.designation,
            'qualification': self.qualification,
            'experience_years': self.experience_years,
            'phone': self.user.phone,
            'profile_picture': self.user.profile_picture.url if self.user.profile_picture else None,
            'qr_code_url': self.qr_code.url if self.qr_code else None,
        }

        # Add current issued books to teacher (if any)
        try:
            from library.models import BookIssue
            issues = BookIssue.objects.filter(teacher=self, status='issued').select_related('book')
            data['borrowed_books'] = [
                {
                    'book_id': i.book.id,
                    'title': i.book.title,
                    'issued_date': i.issued_date.isoformat() if i.issued_date else None,
                    'status': i.status,
                }
                for i in issues
            ]
        except Exception:
            data['borrowed_books'] = []

        # Add basic attendance summary (sessions created and marked attendances)
        try:
            data['attendance_sessions_count'] = self.attendance_sessions.count()
            data['marked_attendances_count'] = self.marked_attendances.count()
        except Exception:
            data['attendance_sessions_count'] = 0
            data['marked_attendances_count'] = 0

        return data
    
    class Meta:
        ordering = ['employee_id']
        verbose_name = 'Teacher'
        verbose_name_plural = 'Teachers'