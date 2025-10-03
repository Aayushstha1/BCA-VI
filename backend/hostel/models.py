from django.db import models
from students.models import Student


class Hostel(models.Model):
    """
    Hostel model for managing hostel information
    """
    name = models.CharField(max_length=100, unique=True)
    address = models.TextField()
    capacity = models.PositiveIntegerField()
    current_occupancy = models.PositiveIntegerField(default=0)
    warden_name = models.CharField(max_length=100)
    warden_contact = models.CharField(max_length=15)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name
    
    @property
    def available_beds(self):
        return self.capacity - self.current_occupancy
    
    class Meta:
        ordering = ['name']


class Room(models.Model):
    """
    Room model for managing hostel rooms
    """
    ROOM_TYPES = [
        ('single', 'Single'),
        ('double', 'Double'),
        ('triple', 'Triple'),
        ('quad', 'Quad'),
    ]
    
    hostel = models.ForeignKey(Hostel, on_delete=models.CASCADE, related_name='rooms')
    room_number = models.CharField(max_length=10)
    room_type = models.CharField(max_length=10, choices=ROOM_TYPES)
    capacity = models.PositiveIntegerField()
    current_occupancy = models.PositiveIntegerField(default=0)
    monthly_rent = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.hostel.name} - Room {self.room_number}"
    
    @property
    def available_beds(self):
        return self.capacity - self.current_occupancy
    
    class Meta:
        unique_together = ['hostel', 'room_number']
        ordering = ['hostel', 'room_number']


class HostelAllocation(models.Model):
    """
    Hostel allocation model for managing student hostel assignments
    """
    student = models.OneToOneField(Student, on_delete=models.CASCADE, related_name='hostel_allocation')
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='allocations')
    allocated_date = models.DateField()
    monthly_rent = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.student.student_id} - {self.room}"
    
    class Meta:
        ordering = ['-allocated_date']