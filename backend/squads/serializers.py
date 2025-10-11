from rest_framework import serializers
from django.conf import settings
from .models import Squad, SquadMember


class SquadMemberSerializer(serializers.ModelSerializer):
    """Serializer for SquadMember model"""
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = SquadMember
        fields = ('id', 'user', 'role', 'joined_at')
        read_only_fields = ('joined_at',)


class SquadSerializer(serializers.ModelSerializer):
    """Serializer for Squad model"""
    owner = serializers.StringRelatedField(read_only=True)
    members = SquadMemberSerializer(source='squad_members', many=True, read_only=True)
    member_count = serializers.ReadOnlyField()
    registration_progress = serializers.ReadOnlyField()

    class Meta:
        model = Squad
        fields = ('id', 'name', 'description', 'goal_count', 'county',
                 'is_public', 'owner', 'members', 'member_count',
                 'registration_progress', 'created_at')
        read_only_fields = ('id', 'owner', 'created_at', 'member_count', 'registration_progress')

    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)


class SquadCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating squads"""

    class Meta:
        model = Squad
        fields = ('name', 'description', 'goal_count', 'county', 'is_public')

    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        squad = super().create(validated_data)

        # Add creator as leader
        SquadMember.objects.create(
            user=self.context['request'].user,
            squad=squad,
            role='leader'
        )

        return squad


class SquadJoinSerializer(serializers.Serializer):
    """Serializer for joining a squad"""
    squad_id = serializers.UUIDField()

    def validate_squad_id(self, value):
        try:
            squad = Squad.objects.get(id=value, is_public=True)
        except Squad.DoesNotExist:
            raise serializers.ValidationError("Squad not found or not public.")

        # Check if user is already a member
        user = self.context['request'].user
        if squad.members.filter(user=user).exists():
            raise serializers.ValidationError("You are already a member of this squad.")

        return value

    def save(self):
        squad_id = self.validated_data['squad_id']
        user = self.context['request'].user
        squad = Squad.objects.get(id=squad_id)

        return SquadMember.objects.create(user=user, squad=squad, role='member')


class SquadLeaderboardSerializer(serializers.Serializer):
    """Serializer for squad leaderboard"""
    county = serializers.CharField()
    squad_name = serializers.CharField()
    member_count = serializers.IntegerField()
    registration_progress = serializers.FloatField()
    created_at = serializers.DateTimeField()
