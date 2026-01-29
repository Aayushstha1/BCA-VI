from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from .models import Student

User = get_user_model()

class ResetPasswordAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Create admin user
        self.admin = User.objects.create_user(username='admin', password='adminpass', role='admin')
        # Create a student user and profile
        self.student_user = User.objects.create_user(username='student1', password='oldpass', role='student')
        self.student = Student.objects.create(
            user=self.student_user,
            student_id='STU12345',
            admission_number='ADM12345',
            admission_date='2020-01-01',
            date_of_birth='2005-01-01',
            gender='M',
            father_name='Father',
            mother_name='Mother',
            guardian_contact='1234567890',
            current_class='10',
            current_section='A',
            roll_number='1'
        )

    def test_admin_can_reset_password(self):
        self.client.force_authenticate(user=self.admin)
        resp = self.client.post(f'/api/students/{self.student.id}/reset-password/')
        self.assertEqual(resp.status_code, 200)
        self.assertIn('temporary_password', resp.data)
        temp = resp.data['temporary_password']
        # Password should have changed
        self.student.user.refresh_from_db()
        self.assertTrue(self.student.user.check_password(temp))

    def test_non_admin_cannot_reset(self):
        self.client.force_authenticate(user=self.student_user)
        resp = self.client.post(f'/api/students/{self.student.id}/reset-password/')
        self.assertEqual(resp.status_code, 403)
