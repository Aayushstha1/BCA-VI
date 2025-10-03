from django.contrib import admin
from .models import NoticeCategory, Notice, NoticeRead


@admin.register(NoticeCategory)
class NoticeCategoryAdmin(admin.ModelAdmin):
    """
    Admin interface for Notice Category management
    """
    list_display = ('name', 'color', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name',)


@admin.register(Notice)
class NoticeAdmin(admin.ModelAdmin):
    """
    Admin interface for Notice management
    """
    list_display = ('title', 'category', 'priority', 'target_audience', 'published_by', 'published_at', 'is_active', 'is_pinned')
    list_filter = ('category', 'priority', 'target_audience', 'is_active', 'is_pinned', 'published_at')
    search_fields = ('title', 'content', 'published_by__username')
    readonly_fields = ('published_at',)
    date_hierarchy = 'published_at'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'content', 'category', 'attachment')
        }),
        ('Settings', {
            'fields': ('priority', 'target_audience', 'is_active', 'is_pinned', 'expires_at')
        }),
        ('System Information', {
            'fields': ('published_by', 'published_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('category', 'published_by')


@admin.register(NoticeRead)
class NoticeReadAdmin(admin.ModelAdmin):
    """
    Admin interface for Notice Read tracking
    """
    list_display = ('notice', 'user', 'read_at')
    list_filter = ('read_at',)
    search_fields = ('notice__title', 'user__username')
    readonly_fields = ('read_at',)
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('notice', 'user')