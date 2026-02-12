from django.contrib import admin

from .models import CalendarEvent


@admin.register(CalendarEvent)
class CalendarEventAdmin(admin.ModelAdmin):
    list_display = ('title', 'event_date', 'is_holiday', 'created_by', 'created_at')
    list_filter = ('event_date', 'is_holiday', 'created_by')
    search_fields = ('title', 'description', 'created_by__username')
