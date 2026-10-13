from django.core.management.base import BaseCommand

from announcements.delivery import process_due_notifications


class Command(BaseCommand):
    help = "Deliver due event reminders and retry transient notification failures."

    def handle(self, *args, **options):
        process_due_notifications()
        self.stdout.write(self.style.SUCCESS("Processed due notifications."))
