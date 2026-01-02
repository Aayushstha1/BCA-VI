from django.core.management.base import BaseCommand
from notices.models import NoticeCategory


class Command(BaseCommand):
    help = 'Create default notice categories'

    def handle(self, *args, **options):
        categories = [
            {'name': 'Academic', 'description': 'Academic announcements and updates', 'color': '#007bff'},
            {'name': 'Event', 'description': 'Events and activities', 'color': '#28a745'},
            {'name': 'Holiday', 'description': 'Holiday and leave notifications', 'color': '#ffc107'},
            {'name': 'Urgent', 'description': 'Urgent notices', 'color': '#dc3545'},
            {'name': 'General', 'description': 'General announcements', 'color': '#6c757d'},
            {'name': 'Administrative', 'description': 'Administrative notices', 'color': '#17a2b8'},
        ]

        for cat_data in categories:
            category, created = NoticeCategory.objects.get_or_create(
                name=cat_data['name'],
                defaults={
                    'description': cat_data['description'],
                    'color': cat_data['color'],
                    'is_active': True
                }
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created category: {category.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'✗ Category already exists: {category.name}')
                )

        self.stdout.write(self.style.SUCCESS('All default categories are ready!'))
