from django.db import models
from django.conf import settings


class GalleryItem(models.Model):
    APPROVAL_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    event_name = models.CharField(max_length=200)
    event_date = models.DateField()
    description = models.TextField(blank=True, null=True)
    photo = models.ImageField(upload_to='gallery/%Y/%m/')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='gallery_items'
    )
    approval_status = models.CharField(
        max_length=20,
        choices=APPROVAL_CHOICES,
        default='pending'
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_gallery_items'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-event_date', '-created_at']

    def __str__(self):
        return f"{self.event_name} ({self.event_date})"
