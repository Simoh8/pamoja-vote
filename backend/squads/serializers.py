from rest_framework import serializers
from django.conf import settings
from .models import Squad, SquadMember


class SquadMemberSerializer(serializers.ModelSerializer):
    """Serializer for SquadMember model"""
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = SquadMember
        fields = ('id', 'user', 'role', 'has_registered', 'joined_at')
        read_only_fields = ('joined_at',)


class SquadSerializer(serializers.ModelSerializer):
    """Serializer for Squad model"""
    owner = serializers.StringRelatedField(read_only=True)
    members = SquadMemberSerializer(source='squad_members', many=True, read_only=True)
    member_count = serializers.ReadOnlyField()
    registration_progress = serializers.ReadOnlyField()
    registration_center = serializers.StringRelatedField(read_only=True)
    remaining_slots = serializers.ReadOnlyField()

    class Meta:
        model = Squad
        fields = ('id', 'name', 'description', 'goal_count', 'county',
                 'is_public', 'voter_registration_date', 'owner', 'members', 'member_count',
                 'registration_progress', 'registration_center', 'remaining_slots', 'created_at')
        read_only_fields = ('id', 'owner', 'created_at', 'member_count', 'registration_progress', 'remaining_slots')

    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)


class SquadCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating squads"""
    registration_center = serializers.UUIDField(required=False, allow_null=True)

    class Meta:
        model = Squad
        fields = ('name', 'description', 'goal_count', 'county', 'is_public', 'voter_registration_date', 'registration_center')

    def validate_registration_center(self, value):
        if value:
            try:
                from centers.models import Center
                Center.objects.get(id=value)
            except (Center.DoesNotExist, ValueError):
                # Allow empty or invalid center IDs for now
                return None
        return value

    def create(self, validated_data):
        registration_center_id = validated_data.pop('registration_center', None)
        validated_data['owner'] = self.context['request'].user

        squad = super().create(validated_data)

        # Associate with registration center if provided
        if registration_center_id:
            try:
                from centers.models import Center
                center = Center.objects.get(id=registration_center_id)
                squad.registration_center = center
                squad.save()
            except Center.DoesNotExist:
                pass  # Center doesn't exist, continue without it

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
            squad = Squad.objects.get(id=value)
        except Squad.DoesNotExist:
            raise serializers.ValidationError("Squad not found.")

        # Check if squad is public or if user is the owner
        if not squad.is_public and squad.owner != self.context['request'].user:
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
