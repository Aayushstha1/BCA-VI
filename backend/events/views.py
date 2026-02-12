from datetime import date

from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied, ValidationError

from .models import CalendarEvent
from .serializers import CalendarEventSerializer


class CalendarEventListCreateView(generics.ListCreateAPIView):
    serializer_class = CalendarEventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = CalendarEvent.objects.select_related('created_by').all()
        start = self.request.query_params.get('start')
        end = self.request.query_params.get('end')

        if start:
            try:
                start_date = date.fromisoformat(start)
            except ValueError:
                raise ValidationError({'start': 'Invalid start date format. Use YYYY-MM-DD.'})
            qs = qs.filter(event_date__gte=start_date)

        if end:
            try:
                end_date = date.fromisoformat(end)
            except ValueError:
                raise ValidationError({'end': 'Invalid end date format. Use YYYY-MM-DD.'})
            qs = qs.filter(event_date__lte=end_date)

        return qs

    def perform_create(self, serializer):
        if self.request.user.role not in ['admin', 'teacher']:
            raise PermissionDenied('Only teachers and admins can create events.')
        serializer.save(created_by=self.request.user)
