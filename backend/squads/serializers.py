from rest_framework import serializers
from .models import Squad, SquadMember
from centers.models import Center


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
        model = Center
        fields = ('id', 'name', 'county', 'constituency', 'ward', 'location', 'address', 'lat', 'lng')
        read_only_fields = ('id', 'name', 'county', 'constituency', 'ward', 'location', 'address', 'lat', 'lng')

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
    is_full = serializers.ReadOnlyField()

    class Meta:
        model = Squad
        fields = (
            'id', 'name', 'description', 'max_members', 'county',
            'is_public', 'voter_registration_date', 'owner', 'owner_id', 
            'members', 'member_count', 'registration_progress', 
            'registration_center', 'remaining_slots', 'is_full', 'created_at'
        )
        read_only_fields = (
            'id', 'owner', 'owner_id', 'created_at', 'member_count', 
            'registration_progress', 'remaining_slots', 'is_full'
        )

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


class SquadCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new squad"""
    registration_center = serializers.JSONField(required=False, allow_null=True)

    class Meta:
        model = Squad
        fields = [
            'name', 'description', 'max_members', 'county', 'is_public', 
            'voter_registration_date', 'registration_center'
        ]
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

        # Validate registration center data if provided
        registration_center_data = data.get('registration_center')
        if registration_center_data:
            # Ensure it's a dictionary
            if not isinstance(registration_center_data, dict):
                raise serializers.ValidationError({"registration_center": "Must be a dictionary object."})

            # Validate required center fields
            required_center_fields = ['name', 'county']
            for field in required_center_fields:
                if not registration_center_data.get(field):
                    raise serializers.ValidationError({f"registration_center.{field}": 'This field is required.'})

        return data

    def create(self, validated_data):
        # Extract registration_center from validated_data
        registration_center_data = validated_data.pop('registration_center', None)

        # Create or get the center
        registration_center = None
        if registration_center_data:
            # Try to find existing center first
            try:
                registration_center = Center.objects.get(
                    name=registration_center_data['name'],
                    county=registration_center_data['county']
                )
            except Center.DoesNotExist:
                # Create new center
                registration_center = Center.objects.create(
                    name=registration_center_data['name'],
                    county=registration_center_data['county'],
                    constituency=registration_center_data.get('constituency'),
                    ward=registration_center_data.get('ward'),
                    location=registration_center_data.get('ward') or registration_center_data.get('location'),
                    polling_station_name=registration_center_data.get('polling_station_name'),
                    address=registration_center_data.get('address', f"{registration_center_data.get('ward', '')}, {registration_center_data['county']}"),
                    lat=registration_center_data.get('lat'),
                    lng=registration_center_data.get('lng')
                )

        # Create the squad
        squad = Squad.objects.create(
            name=validated_data.get('name'),
            description=validated_data.get('description', ''),
            max_members=validated_data.get('max_members'),
            county=validated_data.get('county'),
            is_public=validated_data.get('is_public', True),
            voter_registration_date=validated_data.get('voter_registration_date'),
            registration_center=registration_center,
            owner=self.context['request'].user
        )

        # Add owner as leader
        SquadMember.objects.create(
            user=self.context['request'].user,
            squad=squad,
            role='leader'
        )

        return squad

    def to_representation(self, instance):
        """Convert the created squad instance to proper JSON representation"""
        # Use the regular SquadSerializer for the response to ensure proper serialization
        return SquadSerializer(instance, context=self.context).data


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

        # Check if squad is full
        if squad.is_full:
            raise serializers.ValidationError(
                f'Squad "{squad.name}" is at maximum capacity ({squad.max_members} members). '
                'Please create a new squad or join another available squad.'
            )

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
    remaining_slots = serializers.ReadOnlyField()
    is_full = serializers.ReadOnlyField()

    class Meta:
        model = Squad
        fields = ('id', 'name', 'county', 'member_count', 'remaining_slots', 'is_full', 'registration_progress', 'created_at')