from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from .models import UserNotification

User = get_user_model()

class UserNotificationAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user1 = User.objects.create_user(username='user1', password='pass1', role='student', email='u1@example.com')
        self.user2 = User.objects.create_user(username='user2', password='pass2', role='student', email='u2@example.com')

    def test_list_returns_user_notifications(self):
        UserNotification.objects.create(user=self.user1, title='T1', content='C1')
        UserNotification.objects.create(user=self.user2, title='T2', content='C2')

        self.client.force_authenticate(user=self.user1)
        resp = self.client.get('/api/notices/notifications/')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        # Paginated response expected: {'count', 'next', 'previous', 'results'}
        self.assertIn('results', data)
        self.assertEqual(len(data['results']), 1)
        self.assertEqual(data['results'][0]['title'], 'T1')

    def test_mark_single_notification_read(self):
        notif = UserNotification.objects.create(user=self.user1, title='T1', content='C1', is_read=False)
        self.client.force_authenticate(user=self.user1)
        resp = self.client.post('/api/notices/notifications/mark-read/', {'id': notif.id}, format='json')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data.get('is_read'))
        notif.refresh_from_db()
        self.assertTrue(notif.is_read)

    def test_mark_all_notifications_read(self):
        UserNotification.objects.create(user=self.user1, title='T1', content='C1', is_read=False)
        UserNotification.objects.create(user=self.user1, title='T2', content='C2', is_read=False)
        UserNotification.objects.create(user=self.user1, title='T3', content='C3', is_read=True)

        self.client.force_authenticate(user=self.user1)
        resp = self.client.post('/api/notices/notifications/mark-read/', {'mark_all': True}, format='json')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data.get('marked'), 2)
        unread = UserNotification.objects.filter(user=self.user1, is_read=False).count()
        self.assertEqual(unread, 0)

    def test_unread_count_endpoint(self):
        UserNotification.objects.create(user=self.user1, title='T1', content='C1', is_read=False)
        UserNotification.objects.create(user=self.user1, title='T2', content='C2', is_read=False)
        UserNotification.objects.create(user=self.user1, title='T3', content='C3', is_read=True)

        self.client.force_authenticate(user=self.user1)
        resp = self.client.get('/api/notices/notifications/unread-count/')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data.get('unread'), 2)
