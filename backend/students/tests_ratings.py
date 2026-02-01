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
        resp = self.client.post(f'/api/students/cvs/{self.cv.id}/rate/', {'score': 4, 'comment': 'Good CV'}, format='json')
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data['score'], 4)

    def test_admin_can_rate_cv(self):
        self.client.force_authenticate(user=self.admin)
        resp = self.client.post(f'/api/students/cvs/{self.cv.id}/rate/', {'score': 5}, format='json')
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data['score'], 5)

    def test_student_cannot_rate_cv(self):
        self.client.force_authenticate(user=self.student_user)
        resp = self.client.post(f'/api/students/cvs/{self.cv.id}/rate/', {'score': 3})
        self.assertEqual(resp.status_code, 400)

    def test_same_rater_updates_existing_rating(self):
        self.client.force_authenticate(user=self.teacher)
        resp1 = self.client.post(f'/api/students/cvs/{self.cv.id}/rate/', {'score': 3, 'comment': 'Okay'}, format='json')
        self.assertEqual(resp1.status_code, 201)
        resp2 = self.client.post(f'/api/students/cvs/{self.cv.id}/rate/', {'score': 5, 'comment': 'Great'}, format='json')
        self.assertEqual(resp2.status_code, 201)
        # There should be only one rating by this rater for the CV
        from students.cv import CVRating
        self.assertEqual(CVRating.objects.filter(cv=self.cv, rater=self.teacher).count(), 1)
        self.assertEqual(CVRating.objects.get(cv=self.cv, rater=self.teacher).score, 5)

    def test_rating_score_validation(self):
        self.client.force_authenticate(user=self.teacher)
        resp = self.client.post(f'/api/students/cvs/{self.cv.id}/rate/', {'score': 6}, format='json')
        self.assertEqual(resp.status_code, 400)

    def test_rater_can_update_and_admin_can_delete(self):
        self.client.force_authenticate(user=self.teacher)
        resp = self.client.post(f'/api/students/cvs/{self.cv.id}/rate/', {'score': 4, 'comment': 'Good'}, format='json')
        self.assertEqual(resp.status_code, 201)
        rating_id = resp.data['id']

        # rater can update
        resp_up = self.client.put(f'/api/students/cvs/ratings/{rating_id}/', {'score': 5}, format='json')
        self.assertEqual(resp_up.status_code, 200)
        self.assertEqual(resp_up.data['score'], 5)

        # another teacher cannot update
        other_teacher = User.objects.create_user(username='teacher3', password='teach3', role='teacher')
        self.client.force_authenticate(user=other_teacher)
        resp_forbidden = self.client.put(f'/api/students/cvs/ratings/{rating_id}/', {'score': 2}, format='json')
        self.assertEqual(resp_forbidden.status_code, 403)

        # admin can delete
        self.client.force_authenticate(user=self.admin)
        resp_del = self.client.delete(f'/api/students/cvs/ratings/{rating_id}/')
        self.assertEqual(resp_del.status_code, 204)

    def test_list_ratings_for_cv(self):
        # create two ratings
        self.client.force_authenticate(user=self.teacher)
        r1 = self.client.post(f'/api/students/cvs/{self.cv.id}/rate/', {'score': 4}, format='json')
        self.client.force_authenticate(user=self.admin)
        r2 = self.client.post(f'/api/students/cvs/{self.cv.id}/rate/', {'score': 5}, format='json')

        # teacher can list
        self.client.force_authenticate(user=self.teacher)
        resp = self.client.get(f'/api/students/cvs/{self.cv.id}/ratings/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 2)

        # owner (student) can list
        self.client.force_authenticate(user=self.student_user)
        resp_owner = self.client.get(f'/api/students/cvs/{self.cv.id}/ratings/')
        self.assertEqual(resp_owner.status_code, 200)
        self.assertEqual(len(resp_owner.data), 2)

