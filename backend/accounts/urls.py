from django.urls import path
from . import views

app_name = 'accounts'

urlpatterns = [
    # Authentication
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    
    # User management
    path('users/', views.UserListCreateView.as_view(), name='user-list-create'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),
    
    # Profile management
    path('profile/', views.profile_view, name='profile'),
    path('profile/update/', views.update_profile_view, name='update-profile'),
    path('change-password/', views.change_password_view, name='change-password'),
    
    # Dashboard
    path('dashboard-stats/', views.dashboard_stats_view, name='dashboard-stats'),

    # Password reset requests
    path('password-reset-requests/', views.password_reset_request_create, name='password-reset-request-create'),
    path('password-reset-requests/list/', views.password_reset_requests_list, name='password-reset-request-list'),
    path('password-reset-requests/<int:pk>/approve/', views.password_reset_request_approve, name='password-reset-request-approve'),
    path('password-reset-requests/<int:pk>/reject/', views.password_reset_request_reject, name='password-reset-request-reject'),
]
