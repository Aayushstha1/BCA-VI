from django.core.management.base import BaseCommand
from django.db import transaction, models
from django.utils import timezone

from hostel.models import Hostel, Room, HostelAllocation
from students.models import Student


class Command(BaseCommand):
    help = "Seed hostel rooms and allocations using existing student data."

    def add_arguments(self, parser):
        parser.add_argument('--hostel-name', default='Campus Hostel', help='Hostel name to create/use.')
        parser.add_argument('--floors', type=int, default=3, help='Number of floors to create.')
        parser.add_argument('--rooms-per-floor', type=int, default=8, help='Rooms to create per floor.')
        parser.add_argument('--capacity', type=int, default=2, help='Capacity for each room.')
        parser.add_argument('--base-rent', type=int, default=6000, help='Monthly rent for 1st floor rooms.')
        parser.add_argument('--rent-step', type=int, default=500, help='Monthly rent increment per floor.')
        parser.add_argument('--force-capacity', action='store_true', help='Force room capacity to the provided value.')
        parser.add_argument('--no-allocate', action='store_true', help='Skip creating allocations for students.')

    def handle(self, *args, **options):
        hostel_name = options['hostel_name']
        floors = max(1, options['floors'])
        rooms_per_floor = max(1, options['rooms_per_floor'])
        capacity = max(1, options['capacity'])
        base_rent = max(0, options['base_rent'])
        rent_step = max(0, options['rent_step'])
        force_capacity = options['force_capacity']
        allocate_students = not options['no_allocate']

        with transaction.atomic():
            hostel, created = Hostel.objects.get_or_create(
                name=hostel_name,
                defaults={
                    'address': 'Main Campus',
                    'capacity': floors * rooms_per_floor * capacity,
                    'current_occupancy': 0,
                    'warden_name': 'Hostel Warden',
                    'warden_contact': '0000000000',
                    'is_active': True,
                },
            )

            if created:
                self.stdout.write(self.style.SUCCESS(f'Created hostel: {hostel.name}'))
            else:
                self.stdout.write(self.style.WARNING(f'Using existing hostel: {hostel.name}'))

            existing_rooms = {
                room.room_number: room
                for room in Room.objects.filter(hostel=hostel)
            }

            created_rooms = 0
            for floor in range(1, floors + 1):
                rent = base_rent + (floor - 1) * rent_step
                for idx in range(1, rooms_per_floor + 1):
                    room_number = f"{floor}{idx:02d}"
                    if room_number in existing_rooms:
                        room = existing_rooms[room_number]
                        if force_capacity and room.capacity != capacity:
                            new_capacity = max(capacity, room.current_occupancy)
                            if new_capacity != room.capacity:
                                room.capacity = new_capacity
                                room.save(update_fields=['capacity'])
                        continue
                    Room.objects.create(
                        hostel=hostel,
                        room_number=room_number,
                        room_type='double',
                        capacity=capacity,
                        current_occupancy=0,
                        monthly_rent=rent,
                        is_active=True,
                    )
                    created_rooms += 1

            if created_rooms:
                self.stdout.write(self.style.SUCCESS(f'Created {created_rooms} rooms.'))
            else:
                self.stdout.write(self.style.WARNING('No new rooms created (already present).'))

            if allocate_students:
                students = Student.objects.filter(is_active=True, hostel_allocation__isnull=True).select_related('user')
                rooms = list(
                    Room.objects.filter(hostel=hostel, is_active=True).order_by('room_number')
                )
                if not rooms:
                    self.stdout.write(self.style.WARNING('No rooms available for allocations.'))
                else:
                    allocations_created = 0
                    room_index = 0
                    for student in students:
                        while room_index < len(rooms) and rooms[room_index].current_occupancy >= rooms[room_index].capacity:
                            room_index += 1
                        if room_index >= len(rooms):
                            break
                        room = rooms[room_index]
                        HostelAllocation.objects.create(
                            student=student,
                            room=room,
                            allocated_date=timezone.now().date(),
                            monthly_rent=room.monthly_rent,
                            is_active=True,
                        )
                        room.current_occupancy += 1
                        room.save(update_fields=['current_occupancy'])
                        allocations_created += 1

                    if allocations_created:
                        self.stdout.write(self.style.SUCCESS(f'Created {allocations_created} allocations.'))
                    else:
                        self.stdout.write(self.style.WARNING('No allocations created (no eligible students).'))

            # Sync room occupancy with active allocations
            for room in Room.objects.filter(hostel=hostel):
                active_count = room.allocations.filter(is_active=True).count()
                if room.current_occupancy != active_count:
                    room.current_occupancy = active_count
                    room.save(update_fields=['current_occupancy'])

            total_capacity = (
                Room.objects.filter(hostel=hostel).aggregate(total=models.Sum('capacity'))['total'] or 0
            )
            total_occupancy = (
                Room.objects.filter(hostel=hostel).aggregate(total=models.Sum('current_occupancy'))['total'] or 0
            )
            hostel.capacity = total_capacity
            hostel.current_occupancy = total_occupancy
            hostel.save(update_fields=['capacity', 'current_occupancy'])

        self.stdout.write(self.style.SUCCESS('Hostel seed completed.'))
