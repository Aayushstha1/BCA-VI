from django.core.management.base import BaseCommand
from django.db import transaction

from hostel.models import Hostel


class Command(BaseCommand):
    help = 'Delete hostel, rooms, and allocations for a specific hostel name.'

    def add_arguments(self, parser):
        parser.add_argument('--hostel-name', default='Campus Hostel', help='Hostel name to purge.')
        parser.add_argument('--confirm', action='store_true', help='Actually perform deletion.')

    def handle(self, *args, **options):
        hostel_name = options['hostel_name']
        confirm = options['confirm']

        hostel = Hostel.objects.filter(name=hostel_name).first()
        if not hostel:
            self.stdout.write(self.style.WARNING(f'Hostel not found: {hostel_name}'))
            return

        rooms_count = hostel.rooms.count()

        if not confirm:
            self.stdout.write(
                self.style.WARNING(
                    f'Found hostel \"{hostel_name}\" with {rooms_count} rooms. '
                    'Re-run with --confirm to delete.'
                )
            )
            return

        with transaction.atomic():
            hostel.delete()

        self.stdout.write(self.style.SUCCESS(f'Deleted hostel \"{hostel_name}\" and related data.'))
