from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils.dateparse import parse_date
from django.utils import timezone
from django.db.models import Count, Q
from django.db.models.functions import ExtractMonth
from django.shortcuts import get_object_or_404
from .models import Subject, Attendance, AttendanceReport, AttendanceSession
from students.models import Student
from teachers.models import Teacher
from .serializers import (
    SubjectSerializer,
    AttendanceSerializer,
    AttendanceReportSerializer,
    AttendanceSessionSerializer,
)


class SubjectListCreateView(generics.ListCreateAPIView):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [permissions.IsAuthenticated]


class SubjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [permissions.IsAuthenticated]


class AttendanceListCreateView(generics.ListCreateAPIView):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]


class AttendanceDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]


class AttendanceReportListCreateView(generics.ListCreateAPIView):
    queryset = AttendanceReport.objects.all()
    serializer_class = AttendanceReportSerializer
    permission_classes = [permissions.IsAuthenticated]

class AttendanceSessionListCreateView(generics.ListCreateAPIView):
    serializer_class = AttendanceSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = AttendanceSession.objects.all()
        date_str = self.request.query_params.get('date')
        if date_str:
            date = parse_date(date_str)
            if date:
                qs = qs.filter(date=date)
        return qs

    def perform_create(self, serializer):
        # Try to set teacher automatically if the user is a teacher.
        teacher = None
        try:
            teacher = self.request.user.teacher_profile
        except Exception:
            teacher = None
        serializer.save(created_by=self.request.user, teacher=teacher)


class MarkAttendanceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        session_id = request.data.get('session')
        student_id = request.data.get('student')
        status_value = request.data.get('status')
        remarks = request.data.get('remarks', '')

        if not all([session_id, student_id, status_value]):
            return Response({'message': 'session, student, and status are required'}, status=400)

        session = get_object_or_404(AttendanceSession, id=session_id)
        student = get_object_or_404(Student, id=student_id)

        # Determine teacher - ensure it's not None
        teacher = session.teacher
        if teacher is None:
            try:
                teacher = request.user.teacher_profile
            except Exception:
                # If user is admin, try to get any active teacher as fallback
                if request.user.role == 'admin':
                    teacher = Teacher.objects.filter(is_active=True).first()
                    if teacher is None:
                        return Response({
                            'message': 'No active teacher found in the system. Please create a teacher account first.'
                        }, status=status.HTTP_400_BAD_REQUEST)
                else:
                    return Response({
                        'message': 'Teacher is required for marking attendance. Please ensure the session has a teacher or you are associated with a teacher account.'
                    }, status=status.HTTP_400_BAD_REQUEST)

        attendance, _created = Attendance.objects.update_or_create(
            session=session,
            student=student,
            date=session.date,
            subject=session.subject,
            defaults={
                'teacher': teacher,
                'status': status_value,
                'remarks': remarks,
                'marked_by': request.user,
            }
        )

        return Response(AttendanceSerializer(attendance).data, status=status.HTTP_201_CREATED)


class StudentYearlyProgressView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'student':
            return Response({'detail': 'Only students can view their yearly progress.'},
                            status=status.HTTP_403_FORBIDDEN)

        try:
            student = Student.objects.get(user=request.user)
        except Student.DoesNotExist:
            return Response({'detail': 'Student profile not found.'},
                            status=status.HTTP_404_NOT_FOUND)

        year_param = request.query_params.get('year')
        try:
            year = int(year_param) if year_param else timezone.now().year
        except ValueError:
            return Response({'detail': 'Invalid year.'}, status=status.HTTP_400_BAD_REQUEST)

        qs = Attendance.objects.filter(student=student, date__year=year)
        monthly = (
            qs.annotate(month=ExtractMonth('date'))
            .values('month')
            .annotate(
                total_days=Count('id'),
                present_days=Count('id', filter=Q(status__in=['present', 'late']))
            )
        )

        month_stats = {item['month']: item for item in monthly}
        data = []
        for month in range(1, 13):
            item = month_stats.get(month, {'total_days': 0, 'present_days': 0})
            total_days = item.get('total_days', 0) or 0
            present_days = item.get('present_days', 0) or 0
            progress = round((present_days / total_days) * 100, 2) if total_days > 0 else 0
            data.append({
                'month': month,
                'total_days': total_days,
                'present_days': present_days,
                'progress': progress,
            })

        return Response({'year': year, 'data': data}, status=status.HTTP_200_OK)


class StudentMonthlyProgressView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'student':
            return Response({'detail': 'Only students can view their monthly progress.'},
                            status=status.HTTP_403_FORBIDDEN)

        try:
            student = Student.objects.get(user=request.user)
        except Student.DoesNotExist:
            return Response({'detail': 'Student profile not found.'},
                            status=status.HTTP_404_NOT_FOUND)

        year_param = request.query_params.get('year')
        month_param = request.query_params.get('month')
        try:
            year = int(year_param) if year_param else timezone.now().year
            month = int(month_param) if month_param else timezone.now().month
        except ValueError:
            return Response({'detail': 'Invalid year or month.'}, status=status.HTTP_400_BAD_REQUEST)

        if month < 1 or month > 12:
            return Response({'detail': 'Month must be between 1 and 12.'}, status=status.HTTP_400_BAD_REQUEST)

        qs = Attendance.objects.filter(student=student, date__year=year, date__month=month)
        total_days = qs.count()
        present_days = qs.filter(status='present').count()
        late_days = qs.filter(status='late').count()
        absent_days = qs.filter(status='absent').count()
        excused_days = qs.filter(status='excused').count()
        progress = round(((present_days + late_days) / total_days) * 100, 2) if total_days > 0 else 0

        return Response({
            'year': year,
            'month': month,
            'total_days': total_days,
            'present_days': present_days,
            'late_days': late_days,
            'absent_days': absent_days,
            'excused_days': excused_days,
            'progress': progress,
        }, status=status.HTTP_200_OK)
