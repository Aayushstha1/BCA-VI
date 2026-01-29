from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from students.models import ClassSection, Student
from teachers.models import Teacher
from .models import Task

User = get_user_model()

class TeacherAssignmentPermissionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Create teacher user
        self.teacher_user = User.objects.create_user(username='teacher1', password='teachpass', role='teacher')
        self.teacher = Teacher.objects.create(user=self.teacher_user, joining_date='2020-01-01', qualification='B.Ed', department='Computer Science')

        # Create class sections
        self.cs_12a = ClassSection.objects.create(class_name='12', section='A')
        self.cs_12b = ClassSection.objects.create(class_name='12', section='B')
        self.cs_12_whole = ClassSection.objects.create(class_name='12', section='')

        # Assign teacher to only 12A
        self.teacher.assigned_sections.add(self.cs_12a)

        # Create students in 12A and 12B
        self.student_a_user = User.objects.create_user(username='studA', password='studpass', role='student')
        self.student_a = Student.objects.create(user=self.student_a_user, student_id='S1', admission_number='ADM1', admission_date='2023-01-01', date_of_birth='2006-01-01', gender='M', father_name='F', mother_name='M', guardian_contact='1', current_class='12', current_section='A', roll_number='1')
        self.student_b_user = User.objects.create_user(username='studB', password='studpass', role='student')
        self.student_b = Student.objects.create(user=self.student_b_user, student_id='S2', admission_number='ADM2', admission_date='2023-01-01', date_of_birth='2006-01-01', gender='F', father_name='F', mother_name='M', guardian_contact='2', current_class='12', current_section='B', roll_number='2')

    def test_teacher_can_assign_to_assigned_section(self):
        self.client.force_authenticate(user=self.teacher_user)
        resp = self.client.post('/api/tasks/', {
            'title': 'Test Task A',
            'description': 'For 12A',
            'due_date': '2030-01-01T12:00:00Z',
            'assigned_to_class': '12',
            'assigned_to_section': 'A'
        }, format='json')
        self.assertEqual(resp.status_code, 201)

    def test_teacher_cannot_assign_to_other_section(self):
        self.client.force_authenticate(user=self.teacher_user)
        resp = self.client.post('/api/tasks/', {
            'title': 'Test Task B',
            'description': 'For 12B',
            'due_date': '2030-01-01T12:00:00Z',
            'assigned_to_class': '12',
            'assigned_to_section': 'B'
        }, format='json')
        self.assertEqual(resp.status_code, 403)

    def test_teacher_cannot_assign_whole_class_without_permission(self):
        self.client.force_authenticate(user=self.teacher_user)
        resp = self.client.post('/api/tasks/', {
            'title': 'Test Task Whole',
            'description': 'For 12',
            'due_date': '2030-01-01T12:00:00Z',
            'assigned_to_class': '12',
            'assigned_to_section': ''
        }, format='json')
        self.assertEqual(resp.status_code, 403)

    def test_teacher_with_whole_class_permission_can_assign_whole_or_any_section(self):
        # Grant whole-class permission
        self.teacher.assigned_sections.add(self.cs_12_whole)
        self.client.force_authenticate(user=self.teacher_user)
        resp1 = self.client.post('/api/tasks/', {
            'title': 'Whole class',
            'description': 'Whole 12',
            'due_date': '2030-01-01T12:00:00Z',
            'assigned_to_class': '12',
            'assigned_to_section': ''
        }, format='json')
        self.assertEqual(resp1.status_code, 201)

        resp2 = self.client.post('/api/tasks/', {
            'title': '12B now allowed',
            'description': '12B',
            'due_date': '2030-01-01T12:00:00Z',
            'assigned_to_class': '12',
            'assigned_to_section': 'B'
        }, format='json')
        self.assertEqual(resp2.status_code, 201)
