from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class NoticeCategory(models.Model):
    """
    Notice Category model for categorizing notices
    """
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)
    color = models.CharField(max_length=7, default='#007bff')  # Hex color code
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['name']
        verbose_name = 'Notice Category'
        verbose_name_plural = 'Notice Categories'


class Notice(models.Model):
    """
    Notice model for managing institutional notices and announcements
    """
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    TARGET_AUDIENCE_CHOICES = [
        ('all', 'All'),
        ('students', 'Students'),
        ('teachers', 'Teachers'),
        ('staff', 'Staff'),
        ('parents', 'Parents'),
    ]
    
    title = models.CharField(max_length=200)
    content = models.TextField()
    category = models.ForeignKey(NoticeCategory, on_delete=models.CASCADE, related_name='notices')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    target_audience = models.CharField(max_length=20, choices=TARGET_AUDIENCE_CHOICES, default='all')
    published_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='published_notices')
    published_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_pinned = models.BooleanField(default=False)  # For important notices that stay at top
    attachment = models.FileField(upload_to='notices/', blank=True, null=True)
    
    def __str__(self):
        return self.title
    
    @property
    def is_expired(self):
        if self.expires_at:
            from django.utils import timezone
            return timezone.now() > self.expires_at
        return False
    
    class Meta:
        ordering = ['-is_pinned', '-published_at']
        verbose_name = 'Notice'
        verbose_name_plural = 'Notices'


class NoticeRead(models.Model):
    """
    Model to track which users have read which notices
    """
    notice = models.ForeignKey(Notice, on_delete=models.CASCADE, related_name='reads')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='read_notices')
    read_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} read {self.notice.title}"
    
    class Meta:
        unique_together = ['notice', 'user']
        ordering = ['-read_at']