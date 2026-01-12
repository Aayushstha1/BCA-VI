from django.test import TestCase
from rest_framework.test import APIClient
from django.urls import reverse
from accounts.models import User


class TeacherAPICreationTest(TestCase):
    def setUp(self):
        # Create an admin user
        self.admin = User.objects.create_user(username='admin', email='admin@example.com', password='adminpass', role='admin')
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

    def test_create_teacher(self):
        url = reverse('teachers:teacher-list-create')
        payload = {
            'username': 'tjohn',
            'email': 'tjohn@example.com',
            'password': 'strongpassword',
            'first_name': 'Tom',
            'last_name': 'Johnson',
            'phone': '1234567890',
            'joining_date': '2025-08-01',
            'qualification': 'M.Sc',
            'department': 'Science',
            'designation': 'Lecturer',
            'experience_years': 3,
            'salary': '45000.00',
            'emergency_contact': '0987654321',
            'emergency_contact_name': 'Jane Doe'
        }
        resp = self.client.post(url, payload, format='json')
        # Expect 201 Created
        self.assertEqual(resp.status_code, 201, msg=resp.data)
        # Ensure teacher created and linked to user
        self.assertIn('employee_id', resp.data)
        self.assertEqual(resp.data['user_details']['email'], payload['email'])
