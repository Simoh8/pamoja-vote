from rest_framework import status, generics, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Count, Q
from django.utils import timezone
from .models import Squad, SquadMember
from .serializers import (
    SquadSerializer, SquadCreateSerializer, SquadJoinSerializer,
    SquadLeaderboardSerializer, SquadMemberSerializer, SquadAnnouncementSerializer
)
from invites.models import Invite
from invites.serializers import InviteSerializer


class SquadViewSet(viewsets.ModelViewSet):
    """ViewSet for Squad CRUD operations"""
    serializer_class = SquadSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Squad.objects.filter(
            Q(is_public=True) | Q(owner=user) | Q(members__user=user)
        ).distinct().prefetch_related('members')

    def get_serializer_class(self):
        if self.action == 'create':
            return SquadCreateSerializer
        return SquadSerializer

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        """Join a squad"""
        squad = self.get_object()

        existing_membership = SquadMember.objects.filter(user=request.user).first()
        if existing_membership and existing_membership.squad != squad:
            return Response(
                {'error': f'You are already a member of "{existing_membership.squad.name}". Leave that squad first to join another.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        owned_squads = Squad.objects.filter(owner=request.user)
        if owned_squads.exists():
            for owned_squad in owned_squads:
                if owned_squad.voter_registration_date:
                    registration_date = owned_squad.voter_registration_date
                    if registration_date > timezone.now().date():
                        return Response(
                            {
                                'error': f'You are the owner of squad "{owned_squad.name}" with a future registration date ({registration_date}). '
                                        f'You cannot join other squads until the registration date has passed or you reset your membership.'
                            },
                            status=status.HTTP_400_BAD_REQUEST
                        )

        if squad.owner == request.user:
            return Response(
                {'error': 'You are the owner of this squad and cannot join it as a member.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = SquadJoinSerializer(data={'squad_id': pk}, context={'request': request})
        serializer.is_valid(raise_exception=True)

        serializer.validated_data['squad_id'] = pk
        membership = serializer.save()

        return Response({
            'message': 'Successfully joined the squad',
            'membership': SquadMemberSerializer(membership).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        """Leave a squad"""
        squad = self.get_object()
        user = request.user

        try:
            membership = SquadMember.objects.get(squad=squad, user=user)

            if squad.owner == user:
                other_leaders = squad.members.filter(role='leader').exclude(user=user)
                if other_leaders.exists():
                    new_owner = other_leaders.first().user
                    squad.owner = new_owner
                    squad.save()

                    if membership.role == 'leader':
                        membership.role = 'member'
                        membership.save()
                else:
                    squad.delete()
                    return Response({
                        'message': 'You were the owner and only leader. Squad has been deleted.'
                    })

            elif membership.role == 'leader' and squad.members.filter(role='leader').count() == 1:
                return Response(
                    {'error': 'Cannot leave squad. You are the only leader.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            membership.delete()
            return Response({'message': 'Successfully left the squad'})

        except SquadMember.DoesNotExist:
            return Response(
                {'error': 'You are not a member of this squad'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def send_announcement(self, request, pk=None):
        """Send announcement to squad members (only owners can do this)"""
        squad = self.get_object()

        if squad.owner != request.user:
            return Response(
                {'error': 'Only the squad owner can send announcements'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = SquadAnnouncementSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        message = serializer.validated_data['message']

        members = squad.members.exclude(user=request.user)

        if not members.exists():
            return Response(
                {'message': 'No members to send announcement to'},
                status=status.HTTP_200_OK
            )

        invites = []
        base_url = "https://pamoja.vote"

        for member in members:
            invite_message = f"📢 SQUAD ANNOUNCEMENT from '{squad.name}':\n\n{message}\n\n🏛️ Stay registered to vote! {base_url}"
            invite = Invite.objects.create(
                squad=squad,
                inviter=request.user,
                invitee_contact=member.user.phone_number,
                channel='sms',
                message=invite_message
            )
            invites.append(invite)

        return Response({
            'message': f'Announcement sent to {len(invites)} squad members',
            'recipients_count': len(invites)
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def my_squads(self, request):
        """Get squads the current user is a member of"""
        user = request.user
        memberships = SquadMember.objects.filter(user=user).select_related('squad')
        squads = [membership.squad for membership in memberships]

        serializer = SquadSerializer(squads, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_membership(self, request):
        """Get current user's squad membership"""
        user = request.user
        membership = SquadMember.objects.filter(user=user).select_related('squad').first()

        if membership:
            # Set context to avoid circular references
            request.avoid_circular_refs = True
            serializer = SquadSerializer(membership.squad, context={'request': request})
            squad_data = serializer.data

            # Add membership data to the response
            membership_serializer = SquadMemberSerializer(membership)
            membership_data = membership_serializer.data

            return Response({
                **membership_data,
                'squad': squad_data
            })
        return Response({'message': 'Not a member of any squad'})

    @action(detail=False, methods=['delete'])
    def clear_membership(self, request):
        """Clear user's squad membership (for debugging/testing)"""
        user = request.user
        memberships = SquadMember.objects.filter(user=user).select_related('squad')
        owned_squads = Squad.objects.filter(owner=user)
        deleted_count = 0

        for membership in memberships:
            if membership.squad.owner == user:
                other_leaders = membership.squad.members.filter(role='leader').exclude(user=user)
                if other_leaders.exists():
                    new_owner = other_leaders.first().user
                    membership.squad.owner = new_owner
                    membership.squad.save()
                else:
                    membership.squad.delete()
                    continue

            membership.delete()
            deleted_count += 1

        return Response({
            'message': f'Cleared {deleted_count} membership(s)',
            'user': str(user)
        })

    @action(detail=False, methods=['get'])
    def leaderboard(self, request):
        """Get squad leaderboard by county"""
        county = request.query_params.get('county')

        squads = Squad.objects.annotate(
            member_count=Count('members')
        ).filter(
            member_count__gt=0
        ).order_by('-member_count')

        if county:
            squads = squads.filter(county=county)

        serializer = SquadLeaderboardSerializer(squads, many=True)
        return Response(serializer.data)


class SquadMemberViewSet(viewsets.ModelViewSet):
    """ViewSet for SquadMember operations"""
    serializer_class = SquadMemberSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return SquadMember.objects.filter(user=user)

    @action(detail=True, methods=['post'])
    def change_role(self, request, pk=None):
        """Change member role (only leaders can do this)"""
        membership = self.get_object()
        new_role = request.data.get('role')

        if new_role not in ['member', 'leader']:
            return Response(
                {'error': 'Invalid role'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if membership.squad.owner != request.user and membership.role != 'leader':
            return Response(
                {'error': 'You do not have permission to change roles'},
                status=status.HTTP_403_FORBIDDEN
            )

        membership.role = new_role
        membership.save()

    @action(detail=True, methods=['patch'])
    def update_registration_status(self, request, pk=None):
        """Update registration status for a squad member"""
        membership = self.get_object()

        if membership.user != request.user:
            return Response(
                {'error': 'You can only update your own registration status'},
                status=status.HTTP_403_FORBIDDEN
            )

        has_registered = request.data.get('has_registered', False)
        membership.has_registered = has_registered
        membership.save()

        return Response({
            'message': 'Registration status updated successfully',
            'membership': SquadMemberSerializer(membership).data
        })


class PublicSquadsView(generics.ListAPIView):
    """List all public squads"""
    serializer_class = SquadSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Squad.objects.filter(is_public=True).prefetch_related('members')
