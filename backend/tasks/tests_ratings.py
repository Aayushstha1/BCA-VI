from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from students.models import Student
from tasks.models import Task, TaskSubmission

User = get_user_model()

class SubmissionRatingTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.teacher = User.objects.create_user(username='teacher3', password='teachpass', role='teacher')
        self.admin = User.objects.create_user(username='admin3', password='adminpass', role='admin')
        self.student_user = User.objects.create_user(username='student3', password='studentpass', role='student')
        self.student = Student.objects.create(user=self.student_user, student_id='STU333', admission_number='ADM333', admission_date='2020-01-01', date_of_birth='2005-01-01', gender='M', father_name='F', mother_name='M', guardian_contact='123', current_class='10', current_section='A')
        self.task = Task.objects.create(title='T1', description='desc', assigned_by=self.teacher, due_date='2030-01-01')
        self.submission = TaskSubmission.objects.create(task=self.task, student=self.student, submission_file='path/to/file')

    def test_teacher_can_rate_submission(self):
        self.client.force_authenticate(user=self.teacher)
        resp = self.client.post(f'/api/tasks/submission/{self.submission.id}/rate/', {'score': 4, 'comment': 'Well done'}, format='json')
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data['score'], 4)

    def test_admin_can_rate_submission(self):
        self.client.force_authenticate(user=self.admin)
        resp = self.client.post(f'/api/tasks/submission/{self.submission.id}/rate/', {'score': 5}, format='json')
        self.assertEqual(resp.status_code, 201)

    def test_student_cannot_rate_submission(self):
        self.client.force_authenticate(user=self.student_user)
        resp = self.client.post(f'/api/tasks/submission/{self.submission.id}/rate/', {'score': 3}, format='json')
        self.assertEqual(resp.status_code, 400)
