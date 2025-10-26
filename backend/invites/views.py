from rest_framework import status, generics, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Invite
from .serializers import InviteSerializer, InviteCreateSerializer, WhatsAppInviteSerializer
from squads.models import Squad
from events.models import Event
from .sms_service import sms_service
import logging

logger = logging.getLogger(__name__)


class InviteViewSet(viewsets.ModelViewSet):
    """ViewSet for Invite CRUD operations"""
    serializer_class = InviteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Invite.objects.filter(inviter=user)

    def get_serializer_class(self):
        if self.action == 'create':
            return InviteCreateSerializer
        return InviteSerializer


class WhatsAppInviteView(generics.CreateAPIView):
    """Generate and send WhatsApp invites"""
    serializer_class = WhatsAppInviteSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        invites = serializer.create_invites()

        # Send SMS messages if channel is SMS
        failed_sends = []
        success_count = 0

        for invite in invites:
            if invite.channel == 'sms' and sms_service.is_configured():
                sms_result = sms_service.send_sms(
                    to_phone=invite.invitee_contact,
                    message=invite.message
                )

                if sms_result['success']:
                    invite.status = 'sent'
                    success_count += 1
                    logger.info(f"SMS sent successfully for invite to {invite.invitee_contact}")
                else:
                    invite.status = 'failed'
                    failed_sends.append({
                        'phone': invite.invitee_contact,
                        'error': sms_result['error']
                    })
                    logger.error(f"Failed to send SMS for invite to {invite.invitee_contact}: {sms_result['error']}")
            else:
                invite.status = 'sent'  # For WhatsApp or when SMS not configured
                success_count += 1

            invite.save()

        # Prepare response
        response_data = {
            'message': f'Successfully created and sent {success_count} invites',
            'invites': InviteSerializer(invites, many=True).data,
            'total_sent': success_count,
            'total_failed': len(failed_sends),
        }

        if failed_sends:
            response_data['failed_sends'] = failed_sends
            logger.warning(f"WhatsApp invite creation completed with {len(failed_sends)} SMS failures")

        return Response(response_data, status=status.HTTP_201_CREATED)


class BulkInviteView(generics.CreateAPIView):
    """Send bulk invites via WhatsApp/SMS"""
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        phone_numbers = request.data.get('phone_numbers', [])
        squad_id = request.data.get('squad_id')
        event_id = request.data.get('event_id')
        channel = request.data.get('channel', 'whatsapp')

        if not phone_numbers:
            return Response(
                {'error': 'phone_numbers is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not squad_id and not event_id:
            return Response(
                {'error': 'Either squad_id or event_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        invites = []
        failed_sends = []
        base_url = "https://pamoja-vote.vercel.app"

        for phone_number in phone_numbers:
            if squad_id:
                try:
                    squad = Squad.objects.get(id=squad_id, owner=request.user)

                    # Different message format based on channel
                    if channel == 'sms':
                        message = f"🇰🇪 Join squad '{squad.name}' on Pamoja2Vote - register to vote together! {base_url}/join/{squad_id}"
                    else:  # WhatsApp
                        message = f"Hey! 🇰🇪 Join our squad '{squad.name}' on Pamoja2Vote - we're working together to register as voters. Tap here to join 👉 {base_url}/join/{squad_id}"

                    # Create invite first
                    invite = Invite.objects.create(
                        squad=squad,
                        inviter=request.user,
                        invitee_contact=phone_number,
                        channel=channel,
                        message=message
                    )

                    # Send SMS if channel is SMS and service is configured
                    if channel == 'sms' and sms_service.is_configured():
                        sms_result = sms_service.send_sms(
                            to_phone=phone_number,
                            message=message
                        )

                        if sms_result['success']:
                            invite.status = 'sent'
                            logger.info(f"SMS sent successfully for squad invite to {phone_number}")
                        else:
                            invite.status = 'failed'
                            failed_sends.append({
                                'phone': phone_number,
                                'error': sms_result['error']
                            })
                            logger.error(f"Failed to send SMS for squad invite to {phone_number}: {sms_result['error']}")
                    else:
                        invite.status = 'sent'  # For WhatsApp or when SMS not configured

                    invite.save()
                    invites.append(invite)

                except Squad.DoesNotExist:
                    logger.warning(f"Squad {squad_id} not found or user not owner")
                    continue
            else:
                try:
                    event = Event.objects.get(id=event_id)

                    # Different message format based on channel
                    if channel == 'sms':
                        message = f"🇰🇪 Voter registration event at {event.center.name} on {event.datetime.strftime('%Y-%m-%d %H:%M')}. {base_url}/event/{event_id}"
                    else:  # WhatsApp
                        message = f"Hey! 🇰🇪 Join us for a voter registration event at {event.center.name} on {event.datetime.strftime('%Y-%m-%d %H:%M')}. Tap here 👉 {base_url}/event/{event_id}"

                    # Create invite first
                    invite = Invite.objects.create(
                        event=event,
                        inviter=request.user,
                        invitee_contact=phone_number,
                        channel=channel,
                        message=message
                    )

                    # Send SMS if channel is SMS and service is configured
                    if channel == 'sms' and sms_service.is_configured():
                        sms_result = sms_service.send_sms(
                            to_phone=phone_number,
                            message=message
                        )

                        if sms_result['success']:
                            invite.status = 'sent'
                            logger.info(f"SMS sent successfully for event invite to {phone_number}")
                        else:
                            invite.status = 'failed'
                            failed_sends.append({
                                'phone': phone_number,
                                'error': sms_result['error']
                            })
                            logger.error(f"Failed to send SMS for event invite to {phone_number}: {sms_result['error']}")
                    else:
                        invite.status = 'sent'  # For WhatsApp or when SMS not configured

                    invite.save()
                    invites.append(invite)

                except Event.DoesNotExist:
                    logger.warning(f"Event {event_id} not found")
                    continue

        # Prepare response
        response_data = {
            'message': f'Successfully created {len(invites)} invites',
            'invites': InviteSerializer(invites, many=True).data,
            'total_sent': len(invites),
            'total_failed': len(failed_sends),
        }

        if failed_sends:
            response_data['failed_sends'] = failed_sends
            logger.warning(f"Bulk invite completed with {len(failed_sends)} failures")

        return Response(response_data, status=status.HTTP_201_CREATED)
