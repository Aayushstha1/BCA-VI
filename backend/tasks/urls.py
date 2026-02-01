from django.urls import path
from . import views

urlpatterns = [
    # Task management
    path('', views.TaskListCreateView.as_view(), name='task-list-create'),
    path('<int:pk>/', views.TaskDetailView.as_view(), name='task-detail'),
    
    # Task submissions
    path('<int:task_id>/submissions/', views.TaskSubmissionListView.as_view(), name='task-submissions'),
    path('<int:task_id>/submit/', views.StudentTaskSubmitView.as_view(), name='task-submit'),
    path('submission/<int:submission_id>/grade/', views.TaskSubmissionGradeView.as_view(), name='task-grade'),
    path('submission/<int:submission_id>/rate/', views.SubmissionRatingCreateView.as_view(), name='submission-rate'),
    path('submission/ratings/<int:rating_pk>/', views.SubmissionRatingDetailView.as_view(), name='submission-rating-detail'),
    
    # Student scores
    path('student/<int:student_id>/scores/', views.student_task_scores, name='student-task-scores'),
]
