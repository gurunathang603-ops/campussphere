import logging
import time

from django.core.management.base import BaseCommand

from announcements.delivery import process_due_notifications

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Continuously deliver scheduled reminders; run as a supervised background worker."

    def handle(self, *args, **options):
        self.stdout.write("CampusSphere notification scheduler is running.")
        try:
            while True:
                try:
                    process_due_notifications()
                except Exception:
                    logger.exception("Notification scheduler iteration failed; it will retry in one minute.")
                time.sleep(60)
        except KeyboardInterrupt:
            self.stdout.write("CampusSphere notification scheduler stopped.")
