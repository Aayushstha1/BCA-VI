from django.core.management.base import BaseCommand
from results.models import Exam
from attendance.models import Subject
from datetime import date

class Command(BaseCommand):
    help = 'Create default exams for different classes and subjects'

    def handle(self, *args, **options):
        # Get all subjects
        subjects = Subject.objects.all()
        
        if not subjects.exists():
            self.stdout.write(self.style.ERROR('No subjects found. Create subjects first.'))
            return

        exams_data = []
        
        # Create exams for each subject
        for subject in subjects:
            exams_data.extend([
                {
                    'name': f'{subject.name} - Unit Test 1',
                    'exam_type': 'unit_test',
                    'total_marks': 50,
                    'passing_marks': 20,
                    'exam_date': date(2024, 1, 15),
                },
                {
                    'name': f'{subject.name} - Mid Term Exam',
                    'exam_type': 'mid_term',
                    'total_marks': 80,
                    'passing_marks': 32,
                    'exam_date': date(2024, 2, 15),
                },
                {
                    'name': f'{subject.name} - Final Exam',
                    'exam_type': 'final',
                    'total_marks': 100,
                    'passing_marks': 40,
                    'exam_date': date(2024, 3, 20),
                },
            ])

        created_count = 0
        for exam_data in exams_data:
            subject_name = exam_data['name'].split(' - ')[0]
            subject = Subject.objects.filter(name=subject_name).first()
            
            if not subject:
                continue
            
            exam, created = Exam.objects.get_or_create(
                name=exam_data['name'],
                subject=subject,
                exam_type=exam_data['exam_type'],
                defaults={
                    'total_marks': exam_data['total_marks'],
                    'passing_marks': exam_data['passing_marks'],
                    'exam_date': exam_data['exam_date'],
                    'is_active': True,
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'✓ Created: {exam.name}'))
            else:
                self.stdout.write(f'  Already exists: {exam.name}')

        self.stdout.write(self.style.SUCCESS(f'\n✓ Total exams created: {created_count}'))
