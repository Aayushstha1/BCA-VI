from django.contrib import admin
from .models import Subject, Attendance, AttendanceReport


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    """
    Admin interface for Subject management
    """
    list_display = ('code', 'name', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'code')
    ordering = ['name']


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    """
    Admin interface for Attendance management
    """
    list_display = ('student', 'subject', 'date', 'status', 'teacher', 'marked_at')
    list_filter = ('status', 'date', 'subject', 'teacher')
    search_fields = ('student__student_id', 'student__user__first_name', 'student__user__last_name')
    date_hierarchy = 'date'
    readonly_fields = ('marked_at',)
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'student__user', 'subject', 'teacher__user', 'marked_by'
        )


@admin.register(AttendanceReport)
class AttendanceReportAdmin(admin.ModelAdmin):
    """
    Admin interface for Attendance Report management
    """
    list_display = ('student', 'subject', 'month', 'year', 'attendance_percentage', 'total_days', 'present_days')
    list_filter = ('year', 'month', 'subject')
    search_fields = ('student__student_id', 'student__user__first_name', 'student__user__last_name')
    readonly_fields = ('attendance_percentage', 'generated_at')
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('student__user', 'subject')