from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from students.models import Student
from .models import Task, TaskSubmission
from teachers.models import Teacher
from students.models import ClassSection
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone

User = get_user_model()

class TaskSubmissionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Create student
        self.student_user = User.objects.create_user(username='stud1', password='studpass', role='student')
        self.student = Student.objects.create(user=self.student_user, student_id='S100', admission_number='ADM100', admission_date='2023-01-01', date_of_birth='2006-01-01', gender='M', father_name='F', mother_name='M', guardian_contact='1', current_class='12', current_section='A', roll_number='1')
        # Create teacher and a task assigned to class 12A
        self.teacher_user = User.objects.create_user(username='teacher', password='teachpass', role='teacher')
        self.teacher = Teacher.objects.create(user=self.teacher_user, joining_date='2020-01-01', qualification='B.Ed', department='CS')
        self.task = Task.objects.create(title='Test Task', description='desc', assigned_by=self.teacher_user, assigned_to_class='12', assigned_to_section='A', due_date=timezone.now() + timezone.timedelta(days=1), total_marks=10)

    def test_student_can_submit_task(self):
        self.client.force_authenticate(user=self.student_user)

        file_content = b"Test file contents"
        uploaded = SimpleUploadedFile("submission.txt", file_content, content_type="text/plain")

        url = f"/api/tasks/{self.task.id}/submit/"
        resp = self.client.post(url, {'submission_file': uploaded}, format='multipart')
        self.assertEqual(resp.status_code, 201)

        # verify submission exists
        sub = TaskSubmission.objects.filter(task=self.task, student=self.student).first()
        self.assertIsNotNone(sub)
        self.assertEqual(sub.status, 'submitted')
        self.assertIsNotNone(sub.submitted_at)

    def test_cannot_submit_unassigned_task(self):
        # Create a task for different class
        other_task = Task.objects.create(title='Other', description='d', assigned_by=self.teacher_user, assigned_to_class='11', assigned_to_section='A', due_date=timezone.now() + timezone.timedelta(days=1))
        self.client.force_authenticate(user=self.student_user)
        file_content = b"Test"
        uploaded = SimpleUploadedFile("sub2.txt", file_content, content_type="text/plain")
        resp = self.client.post(f"/api/tasks/{other_task.id}/submit/", {'submission_file': uploaded}, format='multipart')
        self.assertEqual(resp.status_code, 403)
