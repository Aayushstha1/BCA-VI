from django.core.management.base import BaseCommand

from notices.models import UserNotification
from results.models import Result
from results.notifications import build_result_notification


class Command(BaseCommand):
    help = "Create result published notifications for approved results that are missing them."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show how many notifications would be created without writing to the database.",
        )

    def handle(self, *args, **options):
        dry_run = options.get("dry_run", False)
        created = 0
        checked = 0

        results = Result.objects.filter(status="approved").select_related("student__user", "exam")
        for result in results:
            checked += 1
            student = result.student
            if not student or not student.user_id:
                continue

            payload = build_result_notification(
                exam_name=result.exam.name if result.exam else "Exam",
                class_name=student.current_class,
                section=student.current_section,
            )

            exists = UserNotification.objects.filter(
                user=student.user,
                title=payload["title"],
                content=payload["content"],
            ).exists()
            if exists:
                continue

            if not dry_run:
                UserNotification.objects.create(user=student.user, **payload)
            created += 1

        summary = f"Checked {checked} approved results. "
        if dry_run:
            summary += f"Would create {created} notifications."
        else:
            summary += f"Created {created} notifications."
        self.stdout.write(self.style.SUCCESS(summary))
