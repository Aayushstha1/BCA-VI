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
        
        # Convert dict to string for QR code
        qr_string = "|".join([f"{k}:{v}" for k, v in qr_data.items()])
        qr.add_data(qr_string)
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
        Return QR code data as dictionary
        """
        return {
            'student_id': self.student_id,
            'name': self.user.get_full_name(),
            'class': self.current_class,
            'section': self.current_section,
            'roll_number': self.roll_number,
            'admission_number': self.admission_number,
            'qr_code_url': self.qr_code.url if self.qr_code else None,
        }
    
    class Meta:
        ordering = ['student_id']
        verbose_name = 'Student'
        verbose_name_plural = 'Students'