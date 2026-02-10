from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, PasswordResetRequest


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Custom User Admin for managing users with role-based access
    """
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'date_joined')
    list_filter = ('role', 'is_active', 'is_staff', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('role', 'phone', 'address', 'profile_picture')}),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Additional Info', {'fields': ('role', 'phone', 'address', 'profile_picture')}),
    )


@admin.register(PasswordResetRequest)
class PasswordResetRequestAdmin(admin.ModelAdmin):
    list_display = ('username', 'requested_email', 'status', 'auto_match', 'created_at', 'handled_at')
    list_filter = ('status', 'auto_match', 'created_at')
    search_fields = ('username', 'requested_email', 'father_name', 'current_class', 'current_section')
