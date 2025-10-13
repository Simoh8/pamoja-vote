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


class CenterSerializer(serializers.ModelSerializer):
    """Serializer for Center model"""
    class Meta:
        from centers.models import Center
        model = Center
        fields = ('id', 'name', 'county', 'constituency', 'ward', 'address', 'lat', 'lng')
        read_only_fields = fields

class SquadSerializer(serializers.ModelSerializer):
    """Serializer for Squad model"""
    owner = serializers.StringRelatedField(read_only=True)
    members = SquadMemberSerializer(source='squad_members', many=True, read_only=True)
    member_count = serializers.ReadOnlyField()
    registration_progress = serializers.ReadOnlyField()
    registration_center = CenterSerializer(read_only=True)
    remaining_slots = serializers.ReadOnlyField()

    class Meta:
        model = Squad
        fields = ('id', 'name', 'description', 'max_members', 'county',
                 'is_public', 'voter_registration_date', 'owner', 'members', 'member_count',
                 'registration_progress', 'registration_center', 'remaining_slots', 'created_at')
        read_only_fields = ('id', 'owner', 'created_at', 'member_count', 'registration_progress', 'remaining_slots')

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
        """
        Validate the squad data and check for existing squads with the same registration center and date.
        """
        # First call the parent's validate method (which includes basic field validation)
        data = super().validate(data)
        
        # Validate required fields
        required_fields = ['name', 'county', 'voter_registration_date']
        for field in required_fields:
            if not data.get(field):
                raise serializers.ValidationError({field: 'This field is required.'})
                
        if 'max_members' in data and data['max_members'] is not None and data['max_members'] <= 0:
            raise serializers.ValidationError({"max_members": "Must be a positive number."})
        
        # Get registration center data and voter registration date
        registration_center_data = data.get('registration_center')
        voter_registration_date = data.get('voter_registration_date')
        
        if registration_center_data and voter_registration_date:
            from .models import Squad
            from centers.models import Center
            
            print(f"DEBUG: Validating squad creation - center data: {registration_center_data}, date: {voter_registration_date}")
            
            # Handle different formats of registration center data
            center_id = None
            
            if isinstance(registration_center_data, str):
                # If it's a UUID string, use it directly
                try:
                    center_id = registration_center_data
                    print(f"DEBUG: Using center ID from string: {center_id}")
                except (ValueError, TypeError):
                    center_id = None
                    
            elif isinstance(registration_center_data, dict):
                # If it's a dictionary, try to find or create the center first
                center_name = registration_center_data.get('name')
                county = registration_center_data.get('county')
                
                if center_name and county:
                    # Try to find existing center
                    center = Center.objects.filter(
                        name__iexact=center_name,
                        county__iexact=county
                    ).first()
                    
                    if center:
                        center_id = str(center.id)
                        print(f"DEBUG: Found existing center: {center.name} (ID: {center_id})")
                    else:
                        # For validation purposes, we can't create the center here
                        # but we need to check if a similar center exists
                        print(f"DEBUG: Center not found, will create during squad creation")
            
            # Check for existing squads with the same center and date
            if center_id:
                print(f"DEBUG: Checking for existing squads with center ID: {center_id}")
                existing_squads = Squad.objects.filter(
                    registration_center_id=center_id,
                    voter_registration_date=voter_registration_date
                )
                
                print(f"DEBUG: Found {existing_squads.count()} existing squads")
                for squad in existing_squads:
                    print(f"DEBUG: Existing squad: {squad.name}, remaining slots: {squad.remaining_slots}")
                    if squad.remaining_slots is None or squad.remaining_slots > 0:
                        try:
                            center = Center.objects.get(id=center_id)
                            raise serializers.ValidationError(
                                f'A squad "{squad.name}" already exists for {center.name} on {voter_registration_date} '
                                f'with available slots. Please join "{squad.name}" instead of creating a new squad.'
                            )
                        except Center.DoesNotExist:
                            raise serializers.ValidationError(
                                f'A squad "{squad.name}" already exists for this registration center on {voter_registration_date} '
                                f'with available slots. Please join "{squad.name}" instead of creating a new squad.'
                            )
            else:
                print("DEBUG: No center ID found for validation")
        
        return data
        
    def validate_registration_center(self, value):
        """Handle registration center data. Create a new center if it doesn't exist."""
        from centers.models import Center
        import uuid
        
        # If value is None, return None (no registration center)
        if not value:
            return None
            
        # If value is a dictionary with center data
        if isinstance(value, dict):
            center_data = {
                'name': value.get('name', 'Unnamed Center').strip(),
                'county': value.get('county', '').strip(),
                'constituency': value.get('constituency', '').strip(),
                'ward': value.get('ward', '').strip() or 'Unknown',
                'address': value.get('address') or f"{value.get('name', 'Unnamed Center')}, {value.get('ward', 'Unknown')}",
                'polling_station_name': value.get('name', 'Unnamed Center').strip()
            }
            
            # Try to find an existing center with the same name in the same county
            existing_center = Center.objects.filter(
                name__iexact=center_data['name'],
                county__iexact=center_data['county']
            ).first()
            
            if existing_center:
                return str(existing_center.id)
                
            # If not found, create a new center
            try:
                center = Center.objects.create(**center_data)
                print(f"Created new center: {center.id} - {center.name}")
                return str(center.id)
            except Exception as e:
                print(f"Error creating center: {str(e)}")
                return None
                
        # If value is a UUID string or prefixed ID, try to find the center
        elif isinstance(value, (str, uuid.UUID)):
            try:
                if isinstance(value, str) and value.startswith('center-'):
                    # Handle prefixed IDs (from frontend)
                    try:
                        index = int(value.split('-')[1])
                        centers = Center.objects.all().order_by('id')
                        if 0 <= index < len(centers):
                            return str(centers[index].id)
                    except (ValueError, IndexError):
                        pass
                else:
                    # Handle UUID string or UUID object
                    center_id = str(value) if isinstance(value, uuid.UUID) else value
                    center = Center.objects.get(id=center_id)
                    return str(center.id)
            except (Center.DoesNotExist, ValueError):
                pass
                
        print(f"Unhandled registration center format: {type(value)} - {value}")
        return None

    def create(self, validated_data):
        from centers.models import Center
        
        print("\n=== DEBUG: Starting squad creation ===")
        print(f"Validated data: {validated_data}")
        
        # Extract registration center data
        registration_center_data = validated_data.pop('registration_center', None)
        print(f"Registration center data from request: {registration_center_data}")
        
        # Get center ID before creating the squad
        center_id = None
        if registration_center_data:
            print("Validating registration center data...")
            center_id = self.validate_registration_center(registration_center_data)
            print(f"Validated center ID: {center_id}")
        
        # Create the squad
        squad = Squad.objects.create(
            name=validated_data.get('name'),
            description=validated_data.get('description', ''),
            max_members=validated_data.get('max_members'),
            county=validated_data.get('county'),
            is_public=validated_data.get('is_public', True),
            voter_registration_date=validated_data.get('voter_registration_date'),
            owner=self.context['request'].user
        )
        print(f"Created squad with ID: {squad.id}")
        
        # Handle registration center if we have a valid ID
        if center_id:
            print(f"Processing registration center with ID: {center_id}")
            try:
                center = Center.objects.get(id=center_id)
                print(f"Found center: {center.name} (ID: {center.id})")
                
                # Assign and save
                squad.registration_center = center
                squad.save(update_fields=['registration_center'])
                print(f"Successfully associated squad {squad.id} with center {center_id}")
                
                # Verify the save worked
                squad.refresh_from_db()
                print(f"After save - Squad center ID: {squad.registration_center_id}")
                
            except Center.DoesNotExist:
                print(f"ERROR: Center with ID {center_id} does not exist")
            except Exception as e:
                print(f"ERROR saving center: {str(e)}")
                import traceback
                print(traceback.format_exc())
        else:
            print("No valid registration center ID to process")
        
        # Add creator as leader
        SquadMember.objects.create(
            user=self.context['request'].user,
            squad=squad,
            role='leader'
        )
        print("Added creator as squad leader")
        
        # Return the serialized squad
        from .serializers import SquadSerializer
        result = SquadSerializer(squad, context=self.context).to_representation(squad)
        print(f"Final squad data being returned: {result}")
        print("=== End of squad creation ===\n")
        return result


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
