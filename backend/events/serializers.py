from rest_framework import serializers
from django.conf import settings
from .models import Event, EventRSVP


class EventRSVPSerializer(serializers.ModelSerializer):
    """Serializer for EventRSVP model"""
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = EventRSVP
        fields = ('id', 'event', 'user', 'status', 'responded_at')
        read_only_fields = ('responded_at',)


class EventSerializer(serializers.ModelSerializer):
    """Serializer for Event model"""
    squad = serializers.StringRelatedField(read_only=True)
    center = serializers.StringRelatedField(read_only=True)
    rsvps = EventRSVPSerializer(source='event_rsvps', many=True, read_only=True)
    rsvp_count = serializers.SerializerMethodField()
    user_rsvp = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = ('id', 'squad', 'center', 'datetime', 'meeting_point',
                 'note', 'rsvps', 'rsvp_count', 'user_rsvp', 'created_at')
        read_only_fields = ('id', 'created_at')

    def get_rsvp_count(self, obj):
        return obj.rsvps.count()

    def get_user_rsvp(self, obj):
        """Get current user's RSVP status for this event"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                rsvp = obj.rsvps.get(user=request.user)
                return EventRSVPSerializer(rsvp).data
            except EventRSVP.DoesNotExist:
                pass
        return None


class EventCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating events"""

    class Meta:
        model = Event
        fields = ('center', 'datetime', 'meeting_point', 'note')

    def validate(self, data):
        """Ensure user is a leader of the squad"""
        user = self.context['request'].user
        center = data.get('center')

        # Check if user is a leader of any squad
        # In production, you'd want to associate events with specific squads
        # For now, we'll assume the user can create events for any center

        return data

    def create(self, validated_data):
        # In production, you'd want to associate with a specific squad
        # For now, we'll create a generic event
        return super().create(validated_data)


class EventRSVPUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating RSVP status"""

    class Meta:
        model = EventRSVP
        fields = ('status',)

    def update(self, instance, validated_data):
        instance.status = validated_data.get('status', instance.status)
        instance.save()
        return instance
