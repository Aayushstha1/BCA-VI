from django.contrib import admin
from .models import NoteCategory, Note, NoteRating, NoteBookmark, NoteComment


@admin.register(NoteCategory)
class NoteCategoryAdmin(admin.ModelAdmin):
    """
    Admin interface for Note Category management
    """
    list_display = ('name', 'color', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name',)


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    """
    Admin interface for Note management
    """
    list_display = ('title', 'subject', 'category', 'uploaded_by', 'visibility', 'download_count', 'view_count', 'is_active', 'is_featured', 'created_at')
    list_filter = ('category', 'visibility', 'is_active', 'is_featured', 'subject', 'created_at')
    search_fields = ('title', 'description', 'uploaded_by__username')
    readonly_fields = ('download_count', 'view_count', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'content', 'attachment')
        }),
        ('Categorization', {
            'fields': ('subject', 'category', 'visibility', 'target_class')
        }),
        ('Settings', {
            'fields': ('is_active', 'is_featured')
        }),
        ('Statistics', {
            'fields': ('download_count', 'view_count', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('subject', 'category', 'uploaded_by')


@admin.register(NoteRating)
class NoteRatingAdmin(admin.ModelAdmin):
    """
    Admin interface for Note Rating management
    """
    list_display = ('note', 'user', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('note__title', 'user__username')
    readonly_fields = ('created_at',)
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('note', 'user')


@admin.register(NoteBookmark)
class NoteBookmarkAdmin(admin.ModelAdmin):
    """
    Admin interface for Note Bookmark management
    """
    list_display = ('note', 'user', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('note__title', 'user__username')
    readonly_fields = ('created_at',)
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('note', 'user')


@admin.register(NoteComment)
class NoteCommentAdmin(admin.ModelAdmin):
    """
    Admin interface for Note Comment management
    """
    list_display = ('note', 'user', 'comment', 'is_approved', 'created_at')
    list_filter = ('is_approved', 'created_at')
    search_fields = ('note__title', 'user__username', 'comment')
    readonly_fields = ('created_at', 'updated_at')
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('note', 'user')