from django.contrib import admin
from .models import Teacher


@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    """
    Admin interface for Teacher management
    """
    list_display = (
        'employee_id', 'user', 'designation', 'department', 
        'qualification', 'experience_years', 'is_active', 'joining_date'
    )
    list_filter = ('department', 'qualification', 'designation', 'is_active', 'joining_date')
    search_fields = ('employee_id', 'user__username', 'user__first_name', 'user__last_name', 'designation')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'employee_id', 'joining_date')
        }),
        ('Professional Information', {
            'fields': ('qualification', 'department', 'designation', 'experience_years', 'salary')
        }),
        ('Emergency Contact', {
            'fields': ('emergency_contact', 'emergency_contact_name')
        }),
        ('System Information', {
            'fields': ('is_active', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')