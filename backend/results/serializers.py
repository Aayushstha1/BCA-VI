from rest_framework import serializers
from .models import AcademicYear, Semester, Exam, Result, ClassSubjectAssignment


class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = '__all__'


class SemesterSerializer(serializers.ModelSerializer):
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    
    class Meta:
        model = Semester
        fields = '__all__'


class ExamSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    
    class Meta:
        model = Exam
        fields = '__all__'


class ResultSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    student_class = serializers.CharField(source='student.current_class', read_only=True)
    student_section = serializers.CharField(source='student.current_section', read_only=True)
    exam_name = serializers.CharField(source='exam.name', read_only=True)
    subject_name = serializers.CharField(source='exam.subject.name', read_only=True)
    subject_code = serializers.CharField(source='exam.subject.code', read_only=True)
    total_marks = serializers.CharField(source='exam.total_marks', read_only=True)
    published_by_name = serializers.CharField(source='published_by.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    
    class Meta:
        model = Result
        fields = '__all__'
        read_only_fields = ('published_by', 'approved_by', 'published_at', 'approved_at', 'grade')


class ClassSubjectAssignmentSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    teacher_name = serializers.CharField(source='teacher.user.get_full_name', read_only=True)

    class Meta:
        model = ClassSubjectAssignment
        fields = '__all__'
        read_only_fields = ('created_at',)

