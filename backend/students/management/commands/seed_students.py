from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from students.models import Student
from django.db import IntegrityError

User = get_user_model()

SAMPLE_STUDENTS = [
    ("hariram_12A", "hariram_12a@example.com", "Hari", "Ram", "+9779812340111"),
    ("sita_12A", "sita_12a@example.com", "Sita", "KC", "+9779812340122"),
    ("gita_12A", "gita_12a@example.com", "Gita", "Rai", "+9779812340133"),
    ("arun_12A", "arun_12a@example.com", "Arun", "Thapa", "+9779812340144"),
    ("ramesh_12A", "ramesh_12a@example.com", "Ramesh", "Sharma", "+9779812340155"),
    ("suman_12A", "suman_12a@example.com", "Suman", "Adhikari", "+9779812340166"),
    ("binita_12A", "binita_12a@example.com", "Binita", "Rai", "+9779812340177"),
    ("pradeep_12A", "pradeep_12a@example.com", "Pradeep", "Shrestha", "+9779812340188"),
    ("manisha_12A", "manisha_12a@example.com", "Manisha", "Gurung", "+9779812340199"),
    ("kiran_12A", "kiran_12a@example.com", "Kiran", "BK", "+9779812340200"),
]


class Command(BaseCommand):
    help = 'Seed sample students for Class 12 Section A'

    def add_arguments(self, parser):
        parser.add_argument('--start-roll', type=int, default=11, help='Starting roll number')
        parser.add_argument('--count', type=int, default=10, help='How many students to create')
        parser.add_argument('--password', type=str, default='TempPass123!', help='Temporary password for created users')

    def handle(self, *args, **options):
        start_roll = options['start_roll']
        count = options['count']
        password = options['password']

        created = []
        skipped = []
        idx = 0
        for i in range(count):
            if i >= len(SAMPLE_STUDENTS):
                break
            username, email, first_name, last_name, phone = SAMPLE_STUDENTS[i]
            roll = str(start_roll + i)
            # Ensure unique username/email
            base_username = username
            base_email = email
            unique_username = base_username
            suffix = 1
            while User.objects.filter(username=unique_username).exists():
                unique_username = f"{base_username}{suffix}"
                suffix += 1

            unique_email = base_email
            suffix = 1
            while User.objects.filter(email=unique_email).exists():
                local, at, domain = base_email.partition('@')
                unique_email = f"{local}{suffix}@{domain}"
                suffix += 1

            try:
                user = User.objects.create_user(username=unique_username, email=unique_email, password=password, first_name=first_name, last_name=last_name, role='student', phone=phone)
                student = Student.objects.create(
                    user=user,
                    student_id=f"STU12{start_roll + i:03d}",
                    admission_number=f"ADM12{start_roll + i:03d}",
                    admission_date='2023-06-01',
                    date_of_birth='2006-01-01',
                    gender='M' if (i % 2 == 0) else 'F',
                    blood_group='A+' if (i % 3 == 0) else 'O+',
                    father_name=f"Father_{first_name}",
                    mother_name=f"Mother_{first_name}",
                    guardian_contact=phone,
                    current_class='12',
                    current_section='A',
                    roll_number=roll
                )
                created.append((unique_username, unique_email, roll))
            except IntegrityError:
                skipped.append((base_username, base_email))

        self.stdout.write(self.style.SUCCESS(f"Created {len(created)} students."))
        for u, e, r in created:
            self.stdout.write(f" - {u} ({e}) roll: {r}")
        if skipped:
            self.stdout.write(self.style.WARNING(f"Skipped {len(skipped)} entries due to conflicts."))
        self.stdout.write(self.style.NOTICE('Done.'))
