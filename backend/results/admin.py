from django.contrib import admin
from .models import Exam, Result, AcademicYear, Semester


@admin.register(AcademicYear)
class AcademicYearAdmin(admin.ModelAdmin):
    """
    Admin interface for Academic Year management
    """
    list_display = ('name', 'start_date', 'end_date', 'is_current', 'created_at')
    list_filter = ('is_current', 'created_at')
    search_fields = ('name',)
    readonly_fields = ('created_at',)


@admin.register(Semester)
class SemesterAdmin(admin.ModelAdmin):
    """
    Admin interface for Semester management
    """
    list_display = ('name', 'academic_year', 'start_date', 'end_date', 'is_current', 'created_at')
    list_filter = ('academic_year', 'is_current', 'created_at')
    search_fields = ('name', 'academic_year__name')
    readonly_fields = ('created_at',)


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    """
    Admin interface for Exam management
    """
    list_display = ('name', 'exam_type', 'subject', 'total_marks', 'passing_marks', 'exam_date', 'is_active')
    list_filter = ('exam_type', 'exam_date', 'is_active', 'subject')
    search_fields = ('name', 'subject__name')
    readonly_fields = ('created_at',)
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('subject')


@admin.register(Result)
class ResultAdmin(admin.ModelAdmin):
    """
    Admin interface for Result management
    """
    list_display = ('student', 'exam', 'marks_obtained', 'grade', 'created_at')
    list_filter = ('grade', 'exam__exam_type', 'exam__subject', 'created_at')
    search_fields = ('student__student_id', 'student__user__first_name', 'student__user__last_name')
    readonly_fields = ('grade', 'created_at', 'updated_at')
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'student__user', 'exam__subject'
        )