from rest_framework import serializers
from django.conf import settings
from .models import Squad, SquadMember


def mask_phone_number(phone_number, show_first=4, show_last=2):
    """Mask phone number for privacy - shows first and last digits"""
    if not phone_number or len(phone_number) < show_first + show_last:
        return phone_number or ''

    phone_str = str(phone_number)
    # Remove any non-digit characters
    phone_str = ''.join(filter(str.isdigit, phone_str))

    if len(phone_str) < show_first + show_last:
        return phone_str

    visible_start = phone_str[:show_first]
    visible_end = phone_str[-show_last:]
    mask_length = len(phone_str) - show_first - show_last
    mask = '*' * max(mask_length, 3)  # Minimum 3 asterisks

    return f"{visible_start}{mask}{visible_end}"


class SquadMemberSerializer(serializers.ModelSerializer):
    """Serializer for SquadMember model"""
    user_display = serializers.SerializerMethodField()
    phone_number = serializers.SerializerMethodField()
    user_id = serializers.SerializerMethodField()

    class Meta:
        model = SquadMember
        fields = ('id', 'user_display', 'phone_number', 'user_id', 'role', 'has_registered', 'joined_at')
        read_only_fields = ('joined_at',)

    def get_user_display(self, obj):
        """Return masked phone number for privacy"""
        return mask_phone_number(obj.user.phone_number)

    def get_phone_number(self, obj):
        """Return masked phone number - same as user_display for consistency"""
        return self.get_user_display(obj)

    def get_user_id(self, obj):
        """Return user ID for ownership comparison"""
        return str(obj.user.id)


class CenterSerializer(serializers.ModelSerializer):
    """Serializer for Center model"""
    class Meta:
        from centers.models import Center
        model = Center
        fields = ('id', 'name', 'county', 'constituency', 'ward', 'address', 'lat', 'lng')
        read_only_fields = ('id', 'name', 'county', 'constituency', 'ward', 'address', 'lat', 'lng')

    def to_representation(self, instance):
        """Handle None values properly"""
        if instance is None:
            return None
        return super().to_representation(instance)


class SquadSerializer(serializers.ModelSerializer):
    """Serializer for Squad model"""
    owner = serializers.SerializerMethodField()
    owner_id = serializers.SerializerMethodField()
    members = serializers.SerializerMethodField()
    member_count = serializers.ReadOnlyField()
    registration_progress = serializers.ReadOnlyField()
    registration_center = CenterSerializer(read_only=True)
    remaining_slots = serializers.ReadOnlyField()

    class Meta:
        model = Squad
        fields = ('id', 'name', 'description', 'max_members', 'county',
                 'is_public', 'voter_registration_date', 'owner', 'owner_id', 'members', 'member_count',
                 'registration_progress', 'registration_center', 'remaining_slots', 'created_at')
        read_only_fields = ('id', 'owner', 'owner_id', 'created_at', 'member_count', 'registration_progress', 'remaining_slots')

    def get_owner(self, obj):
        """Return masked phone number for owner"""
        return mask_phone_number(obj.owner.phone_number)

    def get_owner_id(self, obj):
        """Return owner user ID for ownership comparison"""
        return str(obj.owner.id)

    def get_members(self, obj):
        """Return squad members with privacy considerations"""
        # Check if we're in a context that should avoid circular references
        request = self.context.get('request')
        if request and getattr(request, 'avoid_circular_refs', False):
            # Return basic member info without nested squad data
            return [{
                'id': str(member.id),
                'user_display': mask_phone_number(member.user.phone_number),
                'phone_number': mask_phone_number(member.user.phone_number),
                'user_id': str(member.user.id),
                'role': member.role,
                'has_registered': member.has_registered,
                'joined_at': member.joined_at.isoformat(),
            } for member in obj.members.all()]

        # Normal case: return full member data
        members = obj.members.all()
        return SquadMemberSerializer(members, many=True, context=self.context).data

    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)


class SquadCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new squad"""
    registration_center = serializers.DictField(required=False, allow_null=True)

    class Meta:
        model = Squad
        fields = ['name', 'description', 'max_members', 'county', 'is_public', 'voter_registration_date', 'registration_center']
        extra_kwargs = {
            'max_members': {'required': False, 'allow_null': True},
        }

    def validate(self, data):
        # Validate required fields
        required_fields = ['name', 'county', 'voter_registration_date']
        for field in required_fields:
            if not data.get(field):
                raise serializers.ValidationError({field: 'This field is required.'})

        if 'max_members' in data and data['max_members'] is not None and data['max_members'] <= 0:
            raise serializers.ValidationError({"max_members": "Must be a positive number."})

        return data

    def create(self, validated_data):
        # Remove registration_center from validated_data since it's not a model field
        validated_data.pop('registration_center', None)

        squad = Squad.objects.create(
            name=validated_data.get('name'),
            description=validated_data.get('description', ''),
            max_members=validated_data.get('max_members'),
            county=validated_data.get('county'),
            is_public=validated_data.get('is_public', True),
            voter_registration_date=validated_data.get('voter_registration_date'),
            owner=self.context['request'].user
        )

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

        if not squad.is_public and squad.owner != self.context['request'].user:
            raise serializers.ValidationError("Squad not found or not public.")

        user = self.context['request'].user
        if squad.members.filter(user=user).exists():
            raise serializers.ValidationError("You are already a member of this squad.")

        return value

    def save(self):
        squad_id = self.validated_data['squad_id']
        user = self.context['request'].user
        squad = Squad.objects.get(id=squad_id)

        return SquadMember.objects.create(user=user, squad=squad, role='member')


class SquadAnnouncementSerializer(serializers.Serializer):
    """Serializer for squad announcements"""
    message = serializers.CharField(max_length=500, required=True)
    send_to_all = serializers.BooleanField(default=True)

    def validate_message(self, value):
        if not value.strip():
            raise serializers.ValidationError("Message cannot be empty")
        return value.strip()


class SquadLeaderboardSerializer(serializers.ModelSerializer):
    """Serializer for squad leaderboard"""
    member_count = serializers.IntegerField()

    class Meta:
        model = Squad
        fields = ('id', 'name', 'county', 'member_count', 'registration_progress', 'created_at')
