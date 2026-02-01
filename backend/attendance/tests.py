from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from django.urls import reverse
from .models import AttendanceSession

User = get_user_model()


class AttendanceSessionTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='tester', password='pass')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.url = '/api/attendance/sessions/'

    def test_create_attendance_session_and_reject_duplicate(self):
        payload = {
            'date': '2026-02-01',
            'period': 1,
            'class_name': '10',
            'section': 'A',
        }

        # First creation should succeed
        resp = self.client.post(self.url, payload, format='json')
        self.assertEqual(resp.status_code, 201)
        self.assertTrue(AttendanceSession.objects.filter(date='2026-02-01', period=1, class_name='10', section='A').exists())

        # Second creation with same unique set should fail with readable error
        resp2 = self.client.post(self.url, payload, format='json')
        self.assertEqual(resp2.status_code, 400)
        self.assertIn('non_field_errors', resp2.data)
        errors = [str(m).lower() for m in resp2.data['non_field_errors']]
        # accept either our custom message or Django/DRF unique-set message
        self.assertTrue(
            any('attendance session' in e for e in errors) or
            any('must make a unique set' in e for e in errors) or
            any('already exists' in e for e in errors)
        )

