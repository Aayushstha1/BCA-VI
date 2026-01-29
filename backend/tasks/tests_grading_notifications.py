from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from students.models import Student
from .models import Task, TaskSubmission
from teachers.models import Teacher
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from notices.models import UserNotification
from django.core import mail

User = get_user_model()

@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class GradingNotificationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Create users
        self.teacher_user = User.objects.create_user(username='teacher', password='teachpass', role='teacher', email='t@example.com')
        self.teacher = Teacher.objects.create(user=self.teacher_user, joining_date='2020-01-01', qualification='B.Ed', department='CS')

        self.student_user = User.objects.create_user(username='stud', password='studpass', role='student', email='s@example.com')
        self.student = Student.objects.create(user=self.student_user, student_id='S300', admission_number='ADM300', admission_date='2023-01-01', date_of_birth='2006-01-01', gender='M', father_name='F', mother_name='M', guardian_contact='1', current_class='12', current_section='A', roll_number='1')

        self.task = Task.objects.create(title='Teacher Task', description='desc', assigned_by=self.teacher_user, assigned_to_class='12', assigned_to_section='A', due_date=timezone.now() + timezone.timedelta(days=1))

        # Student submits
        self.client.force_authenticate(user=self.student_user)
        uploaded = SimpleUploadedFile("submission.txt", b"hi", content_type="text/plain")
        resp = self.client.post(f'/api/tasks/{self.task.id}/submit/', {'submission_file': uploaded}, format='multipart')
        self.assertEqual(resp.status_code, 201)
        self.submission = TaskSubmission.objects.get(task=self.task, student=self.student)

    def test_grading_creates_notification_and_sends_email(self):
        # Teacher grades
        self.client.force_authenticate(user=self.teacher_user)
        resp = self.client.patch(f'/api/tasks/submission/{self.submission.id}/grade/', {'score': 8, 'feedback': 'Good job'}, format='json')
        self.assertEqual(resp.status_code, 200)

        # Check submission updated
        self.submission.refresh_from_db()
        self.assertEqual(self.submission.status, 'graded')
        self.assertEqual(self.submission.score, 8)

        # Check notification exists
        notif = UserNotification.objects.filter(user=self.student_user, title__icontains=self.task.title).first()
        self.assertIsNotNone(notif)
        self.assertIn('graded', notif.title.lower())

        # Check email sent
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('graded', mail.outbox[0].subject.lower())
