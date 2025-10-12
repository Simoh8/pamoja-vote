from rest_framework import serializers
from .models import Center


class CenterSerializer(serializers.ModelSerializer):
    """Serializer for Center model"""
    distance = serializers.SerializerMethodField()

    class Meta:
        model = Center
        fields = ('id', 'name', 'county', 'constituency', 'ward', 'polling_station_name',
                 'address', 'lat', 'lng', 'opening_hours', 'distance')

    def get_distance(self, obj):
        """Calculate distance from user's location (if provided)"""
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.latitude and request.user.longitude:
            # This would use a distance calculation library in production
            # For now, return None or a mock value
            return None
        return None


class CenterCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating centers"""

    class Meta:
        model = Center
        fields = ('name', 'county', 'constituency', 'ward', 'polling_station_name',
                 'address', 'lat', 'lng', 'opening_hours')

    def create(self, validated_data):
        # In production, you might want to geocode the address
        # to get lat/lng coordinates if not provided
        return super().create(validated_data)
