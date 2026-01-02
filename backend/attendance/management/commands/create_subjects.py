from django.core.management.base import BaseCommand
from attendance.models import Subject

class Command(BaseCommand):
    help = 'Create default subjects'

    def handle(self, *args, **options):
        subjects_data = [
            {'name': 'Mathematics', 'code': 'MATH101'},
            {'name': 'English', 'code': 'ENG101'},
            {'name': 'Science', 'code': 'SCI101'},
            {'name': 'Social Studies', 'code': 'SOC101'},
            {'name': 'Computer Science', 'code': 'CS101'},
            {'name': 'Physical Education', 'code': 'PE101'},
            {'name': 'Art', 'code': 'ART101'},
            {'name': 'Music', 'code': 'MUS101'},
        ]

        created_count = 0
        for subject_data in subjects_data:
            subject, created = Subject.objects.get_or_create(
                code=subject_data['code'],
                defaults={'name': subject_data['name'], 'is_active': True}
            )
            
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'✓ Created: {subject.name}'))
            else:
                self.stdout.write(f'  Already exists: {subject.name}')

        self.stdout.write(self.style.SUCCESS(f'\n✓ Total subjects created: {created_count}'))
