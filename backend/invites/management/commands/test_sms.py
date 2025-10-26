"""
Management command to test SMS functionality
"""
from django.core.management.base import BaseCommand
from django.conf import settings
from invites.sms_service import sms_service


class Command(BaseCommand):
    help = 'Test SMS functionality by sending a test message'

    def add_arguments(self, parser):
        parser.add_argument(
            '--phone',
            type=str,
            help='Phone number to send test SMS to (e.g., +254700000000)',
            required=True
        )
        parser.add_argument(
            '--message',
            type=str,
            default='Test SMS from PamojaVote system. If you receive this, SMS is working! 🇰🇪',
            help='Message to send (default: test message)'
        )
        parser.add_argument(
            '--check-config',
            action='store_true',
            help='Check SMS configuration without sending'
        )

    def handle(self, *args, **options):
        phone = options['phone']
        message = options['message']
        check_config = options['check_config']

        # Check configuration first
        self.stdout.write(self.style.WARNING('Checking Infobip SMS configuration...'))

        if not sms_service.is_configured():
            self.stdout.write(
                self.style.ERROR('❌ Infobip SMS service not configured. Please check your INFOBIP_API_KEY.')
            )
            self.stdout.write(
                self.style.WARNING('Get your API key from: https://portal.infobip.com/homepage')
            )
            return

        self.stdout.write(
            self.style.SUCCESS(f'✅ Infobip SMS service configured successfully!')
        )
        self.stdout.write(f'Base URL: {settings.INFOBIP_BASE_URL}')
        self.stdout.write(f'Sender: {settings.INFOBIP_SENDER}')

        if check_config:
            self.stdout.write(self.style.SUCCESS('Configuration check complete!'))
            return

        self.stdout.write(
            self.style.WARNING(f'Sending test SMS to {phone}...')
        )

        result = sms_service.send_sms(phone, message)

        if result['success']:
            self.stdout.write(
                self.style.SUCCESS(f'✅ SMS sent successfully! Message ID: {result["message_id"]}')
            )
            self.stdout.write(f'Status: {result["status"]}')
            if 'formatted_phone' in result:
                self.stdout.write(f'Formatted phone: {result["formatted_phone"]}')
        else:
            self.stdout.write(
                self.style.ERROR(f'❌ Failed to send SMS: {result["error"]}')
            )
            self.stdout.write(
                self.style.WARNING('Check your Infobip dashboard for detailed error information.')
            )
