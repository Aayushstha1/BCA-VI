from rest_framework import serializers
from .models import Subject, Attendance, AttendanceReport, AttendanceSession


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = '__all__'


class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    teacher_name = serializers.CharField(source='teacher.user.get_full_name', read_only=True)
    subject = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all(), required=False, allow_null=True)
    subject_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Attendance
        fields = '__all__'

    def get_subject_name(self, obj):
        if obj.subject:
            return obj.subject.name
        return obj.subject_name


class AttendanceSessionSerializer(serializers.ModelSerializer):
    subject = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all(), required=False, allow_null=True)
    subject_name = serializers.SerializerMethodField()
    total_students = serializers.SerializerMethodField()
    present_count = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceSession
        fields = '__all__'

    def get_subject_name(self, obj):
        if obj.subject:
            return obj.subject.name
        return obj.subject_name

    def get_total_students(self, obj):
        # If enrollment model exists, replace with actual class roster size.
        return obj.attendances.values('student_id').distinct().count()

    def get_present_count(self, obj):
        return obj.attendances.filter(status__in=['present', 'late']).count()

    def validate(self, attrs):
        # Ensure uniqueness across date, period, class_name, section
        date = attrs.get('date', getattr(self.instance, 'date', None))
        period = attrs.get('period', getattr(self.instance, 'period', None))
        class_name = attrs.get('class_name', getattr(self.instance, 'class_name', None))
        section = attrs.get('section', getattr(self.instance, 'section', None))

        if None in (date, period, class_name, section):
            # required validation will handle missing fields
            return attrs

        qs = AttendanceSession.objects.filter(date=date, period=period, class_name=class_name, section=section)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError({'non_field_errors': ['An attendance session for the given date, period, class and section already exists.']})

        return attrs

class AttendanceReportSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    subject = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all(), required=False, allow_null=True)
    subject_name = serializers.SerializerMethodField()
    
    class Meta:
        model = AttendanceReport
        fields = '__all__'

    def get_subject_name(self, obj):
        if obj.subject:
            return obj.subject.name
        return obj.subject_name
