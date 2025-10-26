"""
Management command to setup Infobip SMS configuration
"""
from django.core.management.base import BaseCommand
from django.conf import settings


class Command(BaseCommand):
    help = 'Setup Infobip SMS configuration and validate credentials'

    def add_arguments(self, parser):
        parser.add_argument(
            '--api-key',
            type=str,
            help='Infobip API key'
        )
        parser.add_argument(
            '--sender',
            type=str,
            default='Pamoja2Vote',
            help='Sender name (default: Pamoja2Vote)'
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.WARNING('🚀 Infobip SMS Setup for Pamoja2Vote')
        )
        self.stdout.write('=' * 50)

        # Check current configuration
        api_key = options.get('api_key') or settings.INFOBIP_API_KEY
        sender = options.get('sender') or settings.INFOBIP_SENDER

        if not api_key:
            self.stdout.write(
                self.style.ERROR('❌ No Infobip API key found!')
            )
            self.stdout.write('')
            self.stdout.write('📋 Setup Instructions:')
            self.stdout.write('1. Go to: https://portal.infobip.com/homepage')
            self.stdout.write('2. Create an account or log in')
            self.stdout.write('3. Go to Settings → API Keys')
            self.stdout.write('4. Generate a new API key with SMS permissions')
            self.stdout.write('5. Add to your .env file:')
            self.stdout.write('   INFOBIP_API_KEY=your-api-key-here')
            self.stdout.write('   INFOBIP_SENDER=Pamoja2Vote')
            return

        self.stdout.write(
            self.style.SUCCESS(f'✅ API Key: {api_key[:10]}...')
        )
        self.stdout.write(f'Sender: {sender}')
        self.stdout.write(f'Base URL: {settings.INFOBIP_BASE_URL}')

        self.stdout.write('')
        self.stdout.write('📱 Environment Variables for .env file:')
        self.stdout.write('-' * 40)
        self.stdout.write(f'INFOBIP_API_KEY={api_key}')
        self.stdout.write(f'INFOBIP_SENDER={sender}')
        self.stdout.write(f'INFOBIP_BASE_URL={settings.INFOBIP_BASE_URL}')

        self.stdout.write('')
        self.stdout.write('🔧 Testing Configuration:')
        self.stdout.write('-' * 30)

        # Import and test SMS service
        try:
            from invites.sms_service import sms_service

            if sms_service.is_configured():
                self.stdout.write(
                    self.style.SUCCESS('✅ SMS service is properly configured!')
                )

                # Show account balance if possible
                balance_info = sms_service.get_account_balance()
                if balance_info['success']:
                    self.stdout.write(
                        f"💰 Account Balance: {balance_info['balance']} {balance_info['currency']}"
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING('⚠️  Could not check account balance')
                    )

            else:
                self.stdout.write(
                    self.style.ERROR('❌ SMS service configuration failed!')
                )
                self.stdout.write('Check your API key and try again.')

        except ImportError as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Could not import SMS service: {e}')
            )

        self.stdout.write('')
        self.stdout.write('🎯 Next Steps:')
        self.stdout.write('-' * 20)
        self.stdout.write('1. Update your .env file with the variables above')
        self.stdout.write('2. Restart Django server: python manage.py runserver')
        self.stdout.write('3. Test SMS: python manage.py test_sms --phone +254700000000')
        self.stdout.write('')
        self.stdout.write(
            self.style.SUCCESS('🎉 Setup complete! You can now send SMS announcements.')
        )
