# SMS Integration Setup

This document explains how to set up and use the SMS functionality for PamojaVote announcements and invitations using **Infobip** as the SMS service provider.

## Setup

### 1. Environment Variables

Add the following to your `.env` file:

```bash
# Infobip SMS Service (preferred)
INFOBIP_API_KEY=your-infobip-api-key
INFOBIP_BASE_URL=https://api.infobip.com
INFOBIP_SENDER=PamojaVote

# Twilio Configuration (legacy - keeping for backward compatibility)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_VERIFY_SID=your-twilio-verify-service-sid
TWILIO_PHONE_NUMBER=+254700000000  # Legacy Twilio phone number
```

### 2. Get Infobip API Key

1. Sign up at [Infobip Portal](https://portal.infobip.com/homepage)
2. Go to your account settings and generate an API key
3. Copy the API key to your `.env` file as `INFOBIP_API_KEY`
4. Optionally customize the sender name (appears as the sender of SMS)

### 3. Install Dependencies

The required packages are included in `requirements.txt`:

```bash
pip install requests==2.31.0
```

## Usage

### Testing SMS

Test the SMS functionality using the management command:

```bash
# Check configuration
python manage.py test_sms --phone +254700000000 --check-config

# Send test SMS
python manage.py test_sms --phone +254700000000 --message "Test message from PamojaVote!"
```

### API Endpoints

#### Send Bulk SMS Invitations

```http
POST /api/invites/bulk/
```

**Parameters:**
- `phone_numbers`: Array of phone numbers
- `squad_id` or `event_id`: Target squad or event
- `channel`: `sms` or `whatsapp` (default: `sms`)

**Example:**
```json
{
  "phone_numbers": ["+254700000000", "+254711111111"],
  "squad_id": "uuid-here",
  "channel": "sms"
}
```

#### Send Squad Announcements

```http
POST /api/squads/{squad_id}/send_announcement/
```

**Parameters:**
- `message`: Announcement text

**Example:**
```json
{
  "message": "Hey team! We're meeting tomorrow at 2 PM for voter registration."
}
```

## Features

### Phone Number Formatting

The system automatically formats Kenyan phone numbers:

- `0700000000` → `+254700000000`
- `254700000000` → `+254700000000`
- `+254700000000` → `+254700000000`

### Message Types

#### Squad Invitations (SMS)
```
🇰🇪 Join squad 'Squad Name' on PamojaVote - register to vote together! https://pamoja.vote/join/squad_id
```

#### Squad Announcements
```
📢 SQUAD ANNOUNCEMENT from 'Squad Name':

Message here

🏛️ Stay registered to vote! https://pamoja.vote
```

### Status Tracking

All SMS messages are tracked with status:
- `sent`: Message sent successfully
- `failed`: Message failed to send
- `delivered`: Message delivered (when webhooks are set up)

### Error Handling

The API returns detailed error information:

```json
{
  "message": "Successfully created 2 invites",
  "total_sent": 2,
  "total_failed": 0,
  "invites": [...],
  "failed_sends": []
}
```

## Configuration

### SMS Service Configuration

The SMS service is automatically configured from environment variables. You can check if it's working:

```python
from invites.sms_service import sms_service

print(sms_service.is_configured())  # True if configured
print(sms_service.get_account_balance())  # Check your Infobip balance
```

### Message Length Limits

- SMS: 160 characters (auto-truncated with "...")
- All messages are optimized for SMS delivery

## Troubleshooting

### Common Issues

1. **"Infobip SMS service not configured"**
   - Check INFOBIP_API_KEY in your .env file
   - Ensure the API key is valid and has SMS permissions

2. **"Invalid phone number format"**
   - Phone numbers must be in international format (+254...)
   - Use the test command to verify formatting

3. **SMS not delivered**
   - Check Infobip dashboard for delivery reports
   - Verify phone number is valid and can receive SMS
   - Check if the number is on a do-not-call list
   - Ensure you have sufficient balance in your Infobip account

4. **Authentication errors**
   - Verify your API key is correct
   - Check if your Infobip account is active
   - Ensure the API key has the right permissions

### Testing SMS Delivery

Test if your configuration works:

```bash
# Test SMS command
python manage.py test_sms --phone +254700000000

# Check SMS service status
python manage.py shell
>>> from invites.sms_service import sms_service
>>> print(sms_service.is_configured())
>>> print(sms_service.send_sms('+254700000000', 'Test message'))
```

## Production Setup

For production deployment:

1. Use a production Infobip account (not trial/sandbox)
2. Set up webhooks for delivery status updates
3. Monitor SMS costs in Infobip dashboard
4. Consider rate limiting for bulk sends
5. Set up proper error monitoring and alerting

### Infobip Account Setup

1. Go to [Infobip Portal](https://portal.infobip.com/homepage)
2. Create a production account or upgrade from trial
3. Generate a production API key with SMS permissions
4. Configure sender ID (alphanumeric or numeric)
5. Set up webhook endpoints for delivery reports (optional)

## Migration from Twilio

If you're migrating from Twilio to Infobip:

1. Update your `.env` file with Infobip credentials
2. The system will automatically use Infobip for new messages
3. Old Twilio configurations are kept for backward compatibility
4. Test thoroughly before going live
