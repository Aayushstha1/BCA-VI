from django.contrib import admin
from .models import Student


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    """
    Admin interface for Student management
    """
    list_display = (
        'student_id', 'user', 'admission_number', 'current_class', 
        'current_section', 'roll_number', 'is_active', 'created_at'
    )
    list_filter = ('current_class', 'current_section', 'gender', 'is_active', 'created_at')
    search_fields = ('student_id', 'admission_number', 'user__username', 'user__first_name', 'user__last_name')
    readonly_fields = ('student_id', 'admission_number', 'qr_code', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'student_id', 'admission_number', 'admission_date')
        }),
        ('Personal Information', {
            'fields': ('date_of_birth', 'gender', 'blood_group', 'father_name', 'mother_name', 'guardian_contact')
        }),
        ('Academic Information', {
            'fields': ('current_class', 'current_section', 'roll_number')
        }),
        ('System Information', {
            'fields': ('qr_code', 'is_active', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')