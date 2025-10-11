from rest_framework import status, generics, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Invite
from .serializers import InviteSerializer, InviteCreateSerializer, WhatsAppInviteSerializer
from squads.models import Squad
from events.models import Event


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

        return Response({
            'message': f'Successfully created {len(invites)} invites',
            'invites': InviteSerializer(invites, many=True).data
        }, status=status.HTTP_201_CREATED)


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
        base_url = "https://pamoja.vote"

        for phone_number in phone_numbers:
            if squad_id:
                try:
                    squad = Squad.objects.get(id=squad_id, owner=request.user)
                    message = f"Hey! 🇰🇪 Join our squad '{squad.name}' on PamojaVote - we're working together to register as voters. Tap here to join 👉 {base_url}/join/{squad_id}"
                    invite = Invite.objects.create(
                        squad=squad,
                        inviter=request.user,
                        invitee_contact=phone_number,
                        channel=channel,
                        message=message
                    )
                except Squad.DoesNotExist:
                    continue
            else:
                try:
                    event = Event.objects.get(id=event_id)
                    message = f"Hey! 🇰🇪 Join us for a voter registration event at {event.center.name} on {event.datetime.strftime('%Y-%m-%d %H:%M')}. Tap here 👉 {base_url}/event/{event_id}"
                    invite = Invite.objects.create(
                        event=event,
                        inviter=request.user,
                        invitee_contact=phone_number,
                        channel=channel,
                        message=message
                    )
                except Event.DoesNotExist:
                    continue

            invites.append(invite)

        return Response({
            'message': f'Successfully created {len(invites)} invites',
            'invites': InviteSerializer(invites, many=True).data
        }, status=status.HTTP_201_CREATED)
