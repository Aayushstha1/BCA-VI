from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from students.models import Student
from .models import Task, TaskSubmission
from teachers.models import Teacher
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone

User = get_user_model()

class AdminTaskVisibilityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Create teacher
        self.teacher_user = User.objects.create_user(username='teacher', password='teachpass', role='teacher')
        self.teacher = Teacher.objects.create(user=self.teacher_user, joining_date='2020-01-01', qualification='B.Ed', department='CS')

        # Create admin
        self.admin_user = User.objects.create_user(username='admin', password='adminpass', role='admin')

        # Create student
        self.student_user = User.objects.create_user(username='stud1', password='studpass', role='student')
        self.student = Student.objects.create(user=self.student_user, student_id='S200', admission_number='ADM200', admission_date='2023-01-01', date_of_birth='2006-01-01', gender='M', father_name='F', mother_name='M', guardian_contact='1', current_class='12', current_section='A', roll_number='1')

        # Teacher creates a task for 12A
        self.task = Task.objects.create(title='Teacher Task', description='desc', assigned_by=self.teacher_user, assigned_to_class='12', assigned_to_section='A', due_date=timezone.now() + timezone.timedelta(days=1))

    def test_admin_can_view_tasks_created_by_teachers(self):
        self.client.force_authenticate(user=self.admin_user)
        resp = self.client.get('/api/tasks/')
        self.assertEqual(resp.status_code, 200)
        data = resp.data
        tasks = data if isinstance(data, list) else (data.get('results') or [])
        self.assertTrue(any(t['title'] == 'Teacher Task' for t in tasks))

    def test_admin_can_view_submissions_for_teacher_task(self):
        # Student submits
        self.client.force_authenticate(user=self.student_user)
        uploaded = SimpleUploadedFile("submission.txt", b"hi", content_type="text/plain")
        resp = self.client.post(f'/api/tasks/{self.task.id}/submit/', {'submission_file': uploaded}, format='multipart')
        self.assertEqual(resp.status_code, 201)

        # Admin sees submissions
        self.client.force_authenticate(user=self.admin_user)
        resp2 = self.client.get(f'/api/tasks/{self.task.id}/submissions/')
        self.assertEqual(resp2.status_code, 200)
        self.assertTrue(len(resp2.data) >= 1)
