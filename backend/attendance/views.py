from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils.dateparse import parse_date
from django.shortcuts import get_object_or_404
from .models import Subject, Attendance, AttendanceReport, AttendanceSession
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
            teacher = self.request.user.teacher
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
        student = get_object_or_404(session.attendances.model._meta.get_field('student').remote_field.model, id=student_id)

        # Determine teacher
        teacher = session.teacher
        if teacher is None:
            try:
                teacher = request.user.teacher
            except Exception:
                teacher = None

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