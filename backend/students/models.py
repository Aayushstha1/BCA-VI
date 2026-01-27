from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import RegexValidator
import qrcode
from io import BytesIO
from django.core.files.base import ContentFile
from PIL import Image
import uuid

User = get_user_model()


class Student(models.Model):
    """
    Student model with QR code integration
    """
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    ]
    
    BLOOD_GROUP_CHOICES = [
        ('A+', 'A+'),
        ('A-', 'A-'),
        ('B+', 'B+'),
        ('B-', 'B-'),
        ('AB+', 'AB+'),
        ('AB-', 'AB-'),
        ('O+', 'O+'),
        ('O-', 'O-'),
    ]
    
    # Basic Information
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    student_id = models.CharField(
        max_length=20, 
        unique=True,
        validators=[RegexValidator(r'^[A-Z0-9]+$', 'Student ID must contain only uppercase letters and numbers.')]
    )
    admission_number = models.CharField(max_length=20, unique=True)
    admission_date = models.DateField()
    
    # Personal Information
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    blood_group = models.CharField(max_length=3, choices=BLOOD_GROUP_CHOICES, blank=True, null=True)
    father_name = models.CharField(max_length=100)
    mother_name = models.CharField(max_length=100)
    guardian_contact = models.CharField(max_length=15)
    
    # Academic Information
    current_class = models.CharField(max_length=20)
    current_section = models.CharField(max_length=10)
    roll_number = models.CharField(max_length=10)
    
    # QR Code
    qr_code = models.ImageField(upload_to='qr_codes/', blank=True, null=True)
    
    # Profile Picture
    profile_picture = models.ImageField(upload_to='student_profiles/', blank=True, null=True)
    
    # System fields
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.student_id} - {self.user.get_full_name()}"
    
    def save(self, *args, **kwargs):
        if not self.student_id:
            # Generate unique student ID if not provided
            self.student_id = f"STU{str(uuid.uuid4())[:8].upper()}"
        
        if not self.admission_number:
            # Generate admission number if not provided
            self.admission_number = f"ADM{str(uuid.uuid4())[:8].upper()}"
        
        # Generate QR code if not exists
        if not self.qr_code:
            self.generate_qr_code()
        
        super().save(*args, **kwargs)
    
    def generate_qr_code(self):
        """
        Generate QR code for the student containing their basic information
        """
        qr_data = {
            'student_id': self.student_id,
            'name': self.user.get_full_name(),
            'class': self.current_class,
            'section': self.current_section,
            'roll_number': self.roll_number,
            'admission_number': self.admission_number,
        }
        
        # Create QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        
        # Encode profile URL (prefer linking to frontend profile page)
        try:
            from django.conf import settings
            profile_url = f"{getattr(settings, 'FRONTEND_URL', '').rstrip('/')}" + f"/public/student/{self.student_id}"
            qr_payload = profile_url
        except Exception:
            # fallback to original data string
            qr_payload = "|".join([f"{k}:{v}" for k, v in qr_data.items()])

        qr.add_data(qr_payload)
        qr.make(fit=True)
        
        # Create image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Save to BytesIO
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        
        # Save to model
        filename = f"qr_{self.student_id}.png"
        self.qr_code.save(filename, ContentFile(buffer.getvalue()), save=False)
    
    def get_qr_code_data(self):
        """
        Return QR code data as dictionary, including borrowed books and recent results.
        """
        data = {
            'student_id': self.student_id,
            'name': self.user.get_full_name(),
            'class': self.current_class,
            'section': self.current_section,
            'roll_number': self.roll_number,
            'admission_number': self.admission_number,
            'qr_code_url': self.qr_code.url if self.qr_code else None,
        }

        # Add borrowed books (current issues)
        try:
            from library.models import BookIssue
            issues = BookIssue.objects.filter(student=self, status='issued').select_related('book')
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

        # Add recent published results
        try:
            from results.models import Result
            recent_results = self.results.filter(status='published').select_related('exam').order_by('-published_at')[:5]
            data['recent_results'] = []
            for r in recent_results:
                passed = r.marks_obtained >= r.exam.passing_marks if r.exam and r.exam.passing_marks is not None else (r.grade is not None and r.grade != 'F')
                data['recent_results'].append({
                    'exam': r.exam.name if r.exam else None,
                    'marks_obtained': r.marks_obtained,
                    'total_marks': r.exam.total_marks if r.exam else None,
                    'grade': r.grade,
                    'status': r.status,
                    'passed': passed,
                })
        except Exception:
            data['recent_results'] = []

        return data
    
    class Meta:
        ordering = ['student_id']
        verbose_name = 'Student'
        verbose_name_plural = 'Students'