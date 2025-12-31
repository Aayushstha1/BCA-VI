from django.db import models
from django.contrib.auth import get_user_model
from students.models import Student
from teachers.models import Teacher

User = get_user_model()


class Book(models.Model):
    CATEGORY_CHOICES = [
        ('textbook', 'Textbook'),
        ('reference', 'Reference'),
        ('novel', 'Novel'),
        ('magazine', 'Magazine'),
        ('journal', 'Journal'),
        ('other', 'Other'),
    ]

    title = models.CharField(max_length=200)
    author = models.CharField(max_length=100)
    isbn = models.CharField(max_length=20, unique=True, blank=True, null=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other')
    publisher = models.CharField(max_length=100, blank=True, null=True)
    publication_year = models.PositiveIntegerField(blank=True, null=True)
    total_copies = models.PositiveIntegerField(default=1)
    available_copies = models.PositiveIntegerField(default=1)
    shelf_number = models.CharField(max_length=20, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    file = models.FileField(upload_to='library/books/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.available_copies:
            self.available_copies = self.total_copies
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} by {self.author}"

    class Meta:
        ordering = ['title']


class BookIssue(models.Model):
    STATUS_CHOICES = [
        ('issued', 'Issued'),
        ('returned', 'Returned'),
        ('overdue', 'Overdue'),
        ('lost', 'Lost'),
    ]

    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='issues')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='book_issues', null=True, blank=True)
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='book_issues', null=True, blank=True)
    issued_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='issued_books')
    issued_date = models.DateField()
    due_date = models.DateField()
    return_date = models.DateField(blank=True, null=True)
    fine_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='issued')
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-issued_date']


class Fine(models.Model):
    PAYMENT_STATUS = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('waived', 'Waived'),
    ]

    book_issue = models.OneToOneField(BookIssue, on_delete=models.CASCADE, related_name='fine')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.CharField(max_length=200)
    due_date = models.DateField()
    payment_date = models.DateField(blank=True, null=True)
    payment_status = models.CharField(max_length=10, choices=PAYMENT_STATUS, default='pending')
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)


# ✅ NEW MODEL — BOOK VIEW TRACKING
class BookView(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='views')
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    viewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('book', 'student')
        ordering = ['-viewed_at']
