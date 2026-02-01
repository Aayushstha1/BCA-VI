from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from students.cv import CV
from students.models import Student

User = get_user_model()

class CVRatingTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(username='admin4', password='adminpass', role='admin')
        self.teacher = User.objects.create_user(username='teacher2', password='teachpass', role='teacher')
        self.student_user = User.objects.create_user(username='student4', password='studentpass', role='student')
        self.cv = CV.objects.create(owner=self.student_user, title='Test CV')

    def test_teacher_can_rate_cv(self):
        self.client.force_authenticate(user=self.teacher)
        resp = self.client.post(f'/api/students/cvs/{self.cv.id}/rate/', {'score': 4, 'comment': 'Good CV'})
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data['score'], 4)

    def test_admin_can_rate_cv(self):
        self.client.force_authenticate(user=self.admin)
        resp = self.client.post(f'/api/students/cvs/{self.cv.id}/rate/', {'score': 5})
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data['score'], 5)

    def test_student_cannot_rate_cv(self):
        self.client.force_authenticate(user=self.student_user)
        resp = self.client.post(f'/api/students/cvs/{self.cv.id}/rate/', {'score': 3})
        self.assertEqual(resp.status_code, 400)
