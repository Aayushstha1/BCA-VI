from django.conf import settings
from django.db import models


class CalendarEvent(models.Model):
    title = models.CharField(max_length=200)
    event_date = models.DateField()
    is_holiday = models.BooleanField(default=False)
    description = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='calendar_events',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['event_date', 'created_at']

    def __str__(self):
        return f"{self.title} ({self.event_date})"
