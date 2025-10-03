from django.db import models
from django.contrib.auth import get_user_model
from students.models import Student
from teachers.models import Teacher
from attendance.models import Subject

User = get_user_model()


class NoteCategory(models.Model):
    """
    Note Category model for categorizing notes
    """
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)
    color = models.CharField(max_length=7, default='#28a745')  # Hex color code
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['name']
        verbose_name = 'Note Category'
        verbose_name_plural = 'Note Categories'


class Note(models.Model):
    """
    Note model for sharing study materials and notes
    """
    VISIBILITY_CHOICES = [
        ('public', 'Public'),
        ('class_only', 'Class Only'),
        ('private', 'Private'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    content = models.TextField()
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='notes')
    category = models.ForeignKey(NoteCategory, on_delete=models.CASCADE, related_name='notes')
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploaded_notes')
    visibility = models.CharField(max_length=20, choices=VISIBILITY_CHOICES, default='public')
    target_class = models.CharField(max_length=20, blank=True, null=True)  # For class-specific notes
    attachment = models.FileField(upload_to='notes/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    download_count = models.PositiveIntegerField(default=0)
    view_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.title
    
    def increment_view_count(self):
        self.view_count += 1
        self.save(update_fields=['view_count'])
    
    def increment_download_count(self):
        self.download_count += 1
        self.save(update_fields=['download_count'])
    
    class Meta:
        ordering = ['-is_featured', '-created_at']
        verbose_name = 'Note'
        verbose_name_plural = 'Notes'


class NoteRating(models.Model):
    """
    Model for rating notes
    """
    RATING_CHOICES = [
        (1, '1 Star'),
        (2, '2 Stars'),
        (3, '3 Stars'),
        (4, '4 Stars'),
        (5, '5 Stars'),
    ]
    
    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name='ratings')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='note_ratings')
    rating = models.PositiveIntegerField(choices=RATING_CHOICES)
    review = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} rated {self.note.title} - {self.rating} stars"
    
    class Meta:
        unique_together = ['note', 'user']
        ordering = ['-created_at']


class NoteBookmark(models.Model):
    """
    Model for bookmarking notes
    """
    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name='bookmarks')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookmarked_notes')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} bookmarked {self.note.title}"
    
    class Meta:
        unique_together = ['note', 'user']
        ordering = ['-created_at']


class NoteComment(models.Model):
    """
    Model for comments on notes
    """
    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='note_comments')
    comment = models.TextField()
    is_approved = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} commented on {self.note.title}"
    
    class Meta:
        ordering = ['-created_at']