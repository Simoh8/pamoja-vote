from rest_framework import status, generics, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.utils import timezone
from .models import Event, EventRSVP
from .serializers import (
    EventSerializer, EventCreateSerializer,
    EventRSVPSerializer, EventRSVPUpdateSerializer
)


class EventViewSet(viewsets.ModelViewSet):
    """ViewSet for Event CRUD operations"""
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Users can see events from squads they're members of
        return Event.objects.filter(
            squad__members__user=user
        ).distinct().prefetch_related('rsvps')

    def get_serializer_class(self):
        if self.action == 'create':
            return EventCreateSerializer
        return EventSerializer

    @action(detail=True, methods=['post'])
    def rsvp(self, request, pk=None):
        """RSVP to an event"""
        event = self.get_object()

        # Check if RSVP already exists
        rsvp, created = EventRSVP.objects.get_or_create(
            event=event,
            user=request.user,
            defaults={'status': request.data.get('status', 'maybe')}
        )

        if not created:
            # Update existing RSVP
            serializer = EventRSVPUpdateSerializer(rsvp, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()

        return Response({
            'message': 'RSVP updated successfully',
            'rsvp': EventRSVPSerializer(rsvp).data
        })


class EventRSVPViewSet(viewsets.ModelViewSet):
    """ViewSet for EventRSVP operations"""
    serializer_class = EventRSVPSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return EventRSVP.objects.filter(user=user)

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return EventRSVPUpdateSerializer
        return EventRSVPSerializer


class UpcomingEventsView(generics.ListAPIView):
    """Get upcoming events for user's squads"""
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Event.objects.filter(
            squad__members__user=user,
            datetime__gte=timezone.now()
        ).distinct().order_by('datetime').prefetch_related('rsvps')


class EventsBySquadView(generics.ListAPIView):
    """Get events for a specific squad"""
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        squad_id = self.kwargs.get('squad_id')
        return Event.objects.filter(
            squad_id=squad_id,
            squad__members__user=self.request.user
        ).prefetch_related('rsvps')
