"""
SMS Service using Infobip for sending announcements and invitations
"""
import os
import requests
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class SMSService:
    """Service class for sending SMS messages via Infobip"""

    def __init__(self):
        """Initialize Infobip API configuration"""
        self.api_key = settings.INFOBIP_API_KEY
        self.base_url = settings.INFOBIP_BASE_URL or 'https://api.infobip.com'
        self.sender = settings.INFOBIP_SENDER or 'Pamoja2Vote'

        if self.api_key:
            self.headers = {
                'Authorization': f'App {self.api_key}',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
            logger.info("Infobip API initialized successfully")
        else:
            logger.warning("Infobip API key not configured")
            self.headers = None

    def is_configured(self):
        """Check if SMS service is properly configured"""
        return self.api_key is not None and self.headers is not None

    def format_phone_number(self, phone_number):
        """
        Format phone number for Kenyan SMS sending

        Args:
            phone_number (str): Phone number in various formats

        Returns:
            str: Formatted phone number with +254 prefix
        """
        if not phone_number:
            return phone_number

        # Remove any non-digit characters except +
        phone_str = ''.join(c for c in str(phone_number) if c.isdigit() or c == '+')

        # Handle different Kenyan number formats
        if phone_str.startswith('+254'):
            return phone_str
        elif phone_str.startswith('254'):
            return f'+{phone_str}'
        elif phone_str.startswith('0'):
            # Remove leading 0 and add +254
            return f'+254{phone_str[1:]}'
        elif phone_str.startswith('7') or phone_str.startswith('1'):
            # Mobile numbers starting with 7 or 1
            return f'+254{phone_str}'
        else:
            # For other formats, assume it's already a full international number
            if not phone_str.startswith('+'):
                return f'+{phone_str}'
            return phone_str

    def send_sms(self, to_phone, message, from_phone=None):
        """
        Send SMS message via Infobip

        Args:
            to_phone (str): Recipient phone number (e.g., '+254700000000')
            message (str): Message content
            from_phone (str, optional): Sender phone number. Uses configured sender if not provided.

        Returns:
            dict: Response containing success status and message details
        """
        if not self.is_configured():
            logger.error("Infobip SMS service not configured")
            return {
                'success': False,
                'error': 'Infobip SMS service not configured',
                'message_id': None
            }

        try:
            # Format the phone number
            formatted_phone = self.format_phone_number(to_phone)

            # Validate phone number format
            if not formatted_phone or len(formatted_phone) < 10:
                return {
                    'success': False,
                    'error': f'Invalid phone number format: {to_phone}',
                    'message_id': None
                }

            # Truncate message if too long (SMS limit is 160 characters for single message)
            if len(message) > 160:
                message = message[:157] + "..."

            # Prepare Infobip API payload
            payload = {
                'messages': [
                    {
                        'destinations': [
                            {
                                'to': formatted_phone
                            }
                        ],
                        'from': from_phone or self.sender,
                        'text': message
                    }
                ]
            }

            # Send SMS via Infobip API
            response = requests.post(
                f'{self.base_url}/sms/2/text/advanced',
                headers=self.headers,
                json=payload,
                timeout=30
            )

            response.raise_for_status()
            response_data = response.json()

            # Check if the message was accepted
            if 'messages' in response_data and len(response_data['messages']) > 0:
                message_info = response_data['messages'][0]
                message_id = message_info.get('messageId')
                status = message_info.get('status', {})

                logger.info(f"SMS sent successfully to {formatted_phone}, ID: {message_id}")

                return {
                    'success': True,
                    'message_id': message_id,
                    'status': status.get('name', 'PENDING'),
                    'formatted_phone': formatted_phone,
                    'error': None
                }
            else:
                logger.error(f"Infobip API returned unexpected response: {response_data}")
                return {
                    'success': False,
                    'error': 'Unexpected API response from Infobip',
                    'message_id': None
                }

        except requests.exceptions.RequestException as e:
            logger.error(f"Network error sending SMS to {to_phone}: {e}")
            return {
                'success': False,
                'error': f'Network error: {str(e)}',
                'message_id': None
            }
        except Exception as e:
            logger.error(f"Unexpected error sending SMS to {to_phone}: {e}")
            return {
                'success': False,
                'error': str(e),
                'message_id': None
            }

    def send_bulk_sms(self, phone_numbers, message, from_phone=None):
        """
        Send SMS messages to multiple recipients via Infobip

        Args:
            phone_numbers (list): List of phone numbers
            message (str): Message content
            from_phone (str, optional): Sender phone number

        Returns:
            list: List of response dictionaries for each SMS attempt
        """
        results = []

        for phone in phone_numbers:
            result = self.send_sms(phone, message, from_phone)
            results.append({
                'phone': phone,
                **result
            })

        # Log summary
        success_count = sum(1 for r in results if r['success'])
        total_count = len(results)

        logger.info(f"Bulk SMS completed: {success_count}/{total_count} successful")

        return results

    def check_message_status(self, message_id):
        """
        Check the delivery status of a sent message via Infobip

        Args:
            message_id (str): Infobip message ID

        Returns:
            dict: Message status information
        """
        if not self.is_configured():
            return {'success': False, 'error': 'Infobip SMS service not configured'}

        try:
            response = requests.get(
                f'{self.base_url}/sms/1/reports',
                headers=self.headers,
                params={'messageId': message_id},
                timeout=30
            )

            response.raise_for_status()
            response_data = response.json()

            return {
                'success': True,
                'status': response_data.get('results', [{}])[0].get('status', {}).get('name', 'UNKNOWN'),
                'delivered_at': response_data.get('results', [{}])[0].get('doneAt'),
                'error': response_data.get('results', [{}])[0].get('error', {}).get('description')
            }

        except requests.exceptions.RequestException as e:
            logger.error(f"Error checking message status for {message_id}: {e}")
            return {
                'success': False,
                'error': f'Network error: {str(e)}'
            }
        except Exception as e:
            logger.error(f"Unexpected error checking message status for {message_id}: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    def get_account_balance(self):
        """
        Get Infobip account balance/credits

        Returns:
            dict: Account balance information
        """
        if not self.is_configured():
            return {'success': False, 'error': 'Infobip SMS service not configured'}

        try:
            response = requests.get(
                f'{self.base_url}/account/1/balance',
                headers=self.headers,
                timeout=30
            )

            response.raise_for_status()
            response_data = response.json()

            return {
                'success': True,
                'balance': response_data.get('balance', 0),
                'currency': response_data.get('currency', 'EUR')
            }

        except requests.exceptions.RequestException as e:
            logger.error(f"Error getting account balance: {e}")
            return {
                'success': False,
                'error': f'Network error: {str(e)}'
            }


# Global SMS service instance
sms_service = SMSService()
