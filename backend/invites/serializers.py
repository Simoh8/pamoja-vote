from rest_framework import serializers
from django.conf import settings
from .models import Invite
from squads.models import Squad
from events.models import Event
from .sms_service import sms_service
import logging

logger = logging.getLogger(__name__)


class InviteSerializer(serializers.ModelSerializer):
    """Serializer for Invite model"""
    inviter = serializers.StringRelatedField(read_only=True)
    event = serializers.StringRelatedField(read_only=True)
    squad = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Invite
        fields = ('id', 'event', 'squad', 'inviter', 'invitee_contact',
                 'channel', 'status', 'message', 'sent_at', 'delivered_at')
        read_only_fields = ('id', 'sent_at', 'delivered_at')


class InviteCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating invites"""

    class Meta:
        model = Invite
        fields = ('event', 'squad', 'invitee_contact', 'channel', 'message')

    def create(self, validated_data):
        validated_data['inviter'] = self.context['request'].user

        # Send invite via chosen channel
        invite = super().create(validated_data)

        # Send actual SMS message if channel is SMS
        if invite.channel == 'sms' and sms_service.is_configured():
            sms_result = sms_service.send_sms(
                to_phone=invite.invitee_contact,
                message=invite.message
            )

            if sms_result['success']:
                invite.status = 'sent'
                logger.info(f"SMS sent successfully for invite {invite.id}")
            else:
                invite.status = 'failed'
                logger.error(f"Failed to send SMS for invite {invite.id}: {sms_result['error']}")
        else:
            # For WhatsApp or when SMS service is not configured, mark as sent
            invite.status = 'sent'
            if not sms_service.is_configured():
                logger.warning("SMS service not configured, invite marked as sent without actual delivery")

        invite.save()
        return invite


class WhatsAppInviteSerializer(serializers.Serializer):
    """Serializer for generating WhatsApp invite messages"""
    squad_id = serializers.UUIDField(required=False)
    event_id = serializers.UUIDField(required=False)
    phone_numbers = serializers.ListField(
        child=serializers.CharField(max_length=15),
        allow_empty=False
    )
    channel = serializers.ChoiceField(
        choices=['whatsapp', 'sms'],
        default='sms',
        help_text="Channel to send invite through (WhatsApp or SMS)"
    )

    def validate(self, data):
        squad_id = data.get('squad_id')
        event_id = data.get('event_id')

        if not squad_id and not event_id:
            raise serializers.ValidationError("Either squad_id or event_id is required.")

        if squad_id and event_id:
            raise serializers.ValidationError("Provide either squad_id or event_id, not both.")

        return data

    def create_invites(self):
        """Create invite objects and generate messages"""
        data = self.validated_data
        user = self.context['request'].user
        invites = []

        base_url = "https://pamoja-vote.vercel.app"  # In production, use actual domain

        for phone_number in data['phone_numbers']:
            if data.get('squad_id'):
                squad_id = data['squad_id']
                squad = Squad.objects.get(id=squad_id)

                # Different message format based on channel
                if data.get('channel') == 'sms':
                    message = f"🇰🇪 Join squad '{squad.name}' on Pamoja2Vote - register to vote together! {base_url}/join/{squad_id}"
                else:  # WhatsApp
                    message = f"Hey! 🇰🇪 Join our squad '{squad.name}' on Pamoja2Vote - we're working together to register as voters. Tap here to join 👉 {base_url}/join/{squad_id}"

                invite = Invite.objects.create(
                    squad=squad,
                    inviter=user,
                    invitee_contact=phone_number,
                    channel=data.get('channel'),
                    message=message
                )
            else:
                event_id = data['event_id']
                event = Event.objects.get(id=event_id)

                # Different message format based on channel
                if data.get('channel') == 'sms':
                    message = f"🇰🇪 Voter registration event at {event.center.name} on {event.datetime.strftime('%Y-%m-%d %H:%M')}. {base_url}/event/{event_id}"
                else:  # WhatsApp
                    message = f"Hey! 🇰🇪 Join us for a voter registration event at {event.center.name} on {event.datetime.strftime('%Y-%m-%d %H:%M')}. Tap here 👉 {base_url}/event/{event_id}"

                invite = Invite.objects.create(
                    event=event,
                    inviter=user,
                    invitee_contact=phone_number,
                    channel=data.get('channel'),
                    message=message
                )

            invites.append(invite)

        return invites
