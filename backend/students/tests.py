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


class CVAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(username='admin2', password='adminpass', role='admin')
        self.teacher = User.objects.create_user(username='teacher1', password='teachpass', role='teacher')
        self.student_user = User.objects.create_user(username='student2', password='studentpass', role='student')
        self.other_student_user = User.objects.create_user(username='student3', password='studentpass', role='student')

    def test_student_can_create_and_list_own_cv(self):
        self.client.force_authenticate(user=self.student_user)
        payload = {
            'title': 'My CV',
            'summary': 'A brief summary',
            'education': 'High School',
            'experience': 'Internship',
            'skills': 'Python, Django',
            'is_primary': True
        }
        resp = self.client.post('/api/students/cvs/', payload)
        self.assertEqual(resp.status_code, 201)
        # Student should see it in list
        resp2 = self.client.get('/api/students/cvs/')
        self.assertEqual(resp2.status_code, 200)
        self.assertGreaterEqual(len(resp2.data), 1)

    def test_admin_and_teacher_can_view_all_cvs(self):
        # create a CV as a student
        self.client.force_authenticate(user=self.student_user)
        payload = {'title': 'CV2'}
        resp = self.client.post('/api/students/cvs/', payload)
        self.assertEqual(resp.status_code, 201)

        # admin can list
        self.client.force_authenticate(user=self.admin)
        resp_admin = self.client.get('/api/students/cvs/')
        self.assertEqual(resp_admin.status_code, 200)
        self.assertGreaterEqual(len(resp_admin.data), 1)

        # teacher can list
        self.client.force_authenticate(user=self.teacher)
        resp_teacher = self.client.get('/api/students/cvs/')
        self.assertEqual(resp_teacher.status_code, 200)
        self.assertGreaterEqual(len(resp_teacher.data), 1)

    def test_student_cannot_edit_others_cv(self):
        # create cv by other student
        self.client.force_authenticate(user=self.other_student_user)
        resp = self.client.post('/api/students/cvs/', {'title': 'Other CV'})
        self.assertEqual(resp.status_code, 201)
        # find the CV id via listing for that user
        self.client.force_authenticate(user=self.other_student_user)
        list_resp = self.client.get('/api/students/cvs/')
        self.assertEqual(list_resp.status_code, 200)
        # paginated response
        results = list_resp.data.get('results', list_resp.data)
        self.assertGreaterEqual(len(results), 1)
        cv_id = results[0]['id']

        # current student tries to edit
        self.client.force_authenticate(user=self.student_user)
        resp_edit = self.client.patch(f'/api/students/cvs/{cv_id}/', {'title': 'Hacked'})
        self.assertIn(resp_edit.status_code, (403, 404))  # either forbidden or not found

    def test_admin_can_edit_others_cv(self):
        # create cv by student A
        self.client.force_authenticate(user=self.other_student_user)
        resp = self.client.post('/api/students/cvs/', {'title': 'Other CV'})
        self.assertEqual(resp.status_code, 201)
        results = self.client.get('/api/students/cvs/').data.get('results') or self.client.get('/api/students/cvs/').data
        cv_id = results[0]['id']

        # admin edits it
        self.client.force_authenticate(user=self.admin)
        resp_edit = self.client.patch(f'/api/students/cvs/{cv_id}/', {'title': 'Updated by Admin'})
        self.assertEqual(resp_edit.status_code, 200)
        self.assertEqual(resp_edit.data['title'], 'Updated by Admin')

    def test_teacher_cannot_edit_others_cv(self):
        # create cv by student A
        self.client.force_authenticate(user=self.other_student_user)
        resp = self.client.post('/api/students/cvs/', {'title': 'Other CV 2'})
        self.assertEqual(resp.status_code, 201)
        results = self.client.get('/api/students/cvs/').data.get('results') or self.client.get('/api/students/cvs/').data
        cv_id = results[0]['id']

        # teacher tries to edit
        self.client.force_authenticate(user=self.teacher)
        resp_edit = self.client.patch(f'/api/students/cvs/{cv_id}/', {'title': 'Attempted Edit'})
        self.assertIn(resp_edit.status_code, (403, 404))  # forbidden or not found

