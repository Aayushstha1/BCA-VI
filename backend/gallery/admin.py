from django.contrib import admin
from .models import GalleryItem


@admin.register(GalleryItem)
class GalleryItemAdmin(admin.ModelAdmin):
    list_display = ('event_name', 'event_date', 'created_by', 'approval_status', 'approved_by', 'approved_at')
    list_filter = ('approval_status', 'event_date', 'created_at')
    search_fields = ('event_name', 'description', 'created_by__username')
