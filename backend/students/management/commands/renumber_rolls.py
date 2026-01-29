from django.core.management.base import BaseCommand
from students.models import Student
from django.db import transaction

class Command(BaseCommand):
    help = 'Normalize and renumber roll numbers per class+section starting from 1'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='Do not save changes; only show what would change')
        parser.add_argument('--order-by', type=str, default='created_at', help='Field to order students by when assigning rolls')

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        order_by = options['order_by']

        groups = {}
        for s in Student.objects.all().order_by('current_class','current_section', order_by):
            key = (s.current_class, s.current_section)
            groups.setdefault(key, []).append(s)

        total_changed = 0
        for (cls, sec), students in groups.items():
            self.stdout.write(f"Renumbering class {cls} section {sec} ({len(students)} students)")
            for idx, s in enumerate(students, start=1):
                new_roll = str(idx)
                if s.roll_number != new_roll:
                    self.stdout.write(f" - {s.user.username}: {s.roll_number} -> {new_roll}")
                    if not dry_run:
                        s.roll_number = new_roll
                        s.save()
                    total_changed += 1
        self.stdout.write(self.style.SUCCESS(f"Done. Total changes: {total_changed}"))