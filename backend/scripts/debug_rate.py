from django.test import Client
from django.contrib.auth import get_user_model
from students.cv import CV
User = get_user_model()
# Setup minimal env
admin = User.objects.create_user(username='adminx', password='adminpass', role='admin')
teacher = User.objects.create_user(username='teachx', password='teachpass', role='teacher')
student = User.objects.create_user(username='studx', password='studpass', role='student')
cv = CV.objects.create(owner=student, title='t')
from rest_framework.test import APIClient
c = APIClient()
c.force_authenticate(user=teacher)
resp = c.post(f'/api/students/cvs/{cv.id}/rate/', {'score':4})
print('STATUS', resp.status_code)
print('DATA', resp.data)
