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
from invites.sms_service import sms_service
import logging

logger = logging.getLogger(__name__)


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
        user = self.request.user

        # Check if user is already a member of any squad
        existing_membership = SquadMember.objects.filter(user=user).first()
        if existing_membership:
            return Response(
                {'error': f'You are already a member of "{existing_membership.squad.name}". You cannot create a new squad while being a member of another squad.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user is already an owner of any squad
        owned_squads = Squad.objects.filter(owner=user)
        if owned_squads.exists():
            return Response(
                {'error': f'You are already the owner of squad "{owned_squads.first().name}". You cannot create another squad while owning an existing squad.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer.save(owner=user)

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

        # Check if squad is at maximum capacity
        if squad.max_members is not None and squad.member_count >= squad.max_members:
            # Get other squads at the same registration center that aren't full
            available_squads = []
            if squad.registration_center:
                for other_squad in Squad.objects.filter(
                    registration_center=squad.registration_center,
                    is_public=True
                ).exclude(id=squad.id):
                    if other_squad.max_members is None or other_squad.member_count < other_squad.max_members:
                        available_squads.append(other_squad)

            suggestion_message = f'Squad "{squad.name}" is at maximum capacity ({squad.max_members} members). '

            if available_squads:
                available_count = len(available_squads)
                center_name = squad.registration_center.name if squad.registration_center else "this center"
                suggestion_message += f'There are {available_count} other squad(s) available at {center_name}. '

            suggestion_message += 'Please create a new squad or join another available squad.'

            return Response(
                {
                    'error': 'Squad is full',
                    'message': suggestion_message,
                    'squad_info': {
                        'id': str(squad.id),
                        'name': squad.name,
                        'current_members': squad.member_count,
                        'max_members': squad.max_members,
                        'registration_center': squad.registration_center.name if squad.registration_center else None,
                        'is_full': True
                    },
                    'available_squads': [
                        {
                            'id': str(s.id),
                            'name': s.name,
                            'current_members': s.member_count,
                            'max_members': s.max_members,
                            'remaining_slots': s.remaining_slots
                        } for s in available_squads[:3]  # Show up to 3 alternatives
                    ]
                },
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

        # Send announcements via SMS
        failed_sends = []
        success_count = 0

        for member in members:
            invite_message = f"📢 SQUAD ANNOUNCEMENT from '{squad.name}':\n\n{message}\n\n🏛️ Stay registered to vote! https://pamoja-vote.vercel.app"

            # Create invite record first
            invite = Invite.objects.create(
                squad=squad,
                inviter=request.user,
                invitee_contact=member.user.phone_number,
                channel='sms',
                message=invite_message
            )

            # Send SMS if service is configured
            if sms_service.is_configured():
                sms_result = sms_service.send_sms(
                    to_phone=member.user.phone_number,
                    message=invite_message
                )

                if sms_result['success']:
                    invite.status = 'sent'
                    success_count += 1
                    logger.info(f"Announcement SMS sent successfully to {member.user.phone_number}")
                else:
                    invite.status = 'failed'
                    failed_sends.append({
                        'member': str(member.user),
                        'phone': member.user.phone_number,
                        'error': sms_result['error']
                    })
                    logger.error(f"Failed to send announcement SMS to {member.user.phone_number}: {sms_result['error']}")
            else:
                invite.status = 'sent'  # Mark as sent when SMS not configured
                success_count += 1
                logger.warning("SMS service not configured, announcement marked as sent without delivery")

            invite.save()

        # Prepare response
        response_data = {
            'message': f'Announcement sent to {success_count} squad members',
            'recipients_count': success_count,
            'total_failed': len(failed_sends),
        }

        if failed_sends:
            response_data['failed_sends'] = failed_sends
            logger.warning(f"Announcement completed with {len(failed_sends)} SMS failures")

        return Response(response_data, status=status.HTTP_200_OK)

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

    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """Get members of a specific squad"""
        squad = self.get_object()

        # Check if user has permission to view this squad's members
        if not squad.is_public and squad.owner != request.user:
            # Check if user is a member of this squad
            if not squad.members.filter(user=request.user).exists():
                return Response(
                    {'error': 'You do not have permission to view this squad\'s members'},
                    status=status.HTTP_403_FORBIDDEN
                )

    @action(detail=True, methods=['get'])
    def available_at_center(self, request, pk=None):
        """Get available squads at the same registration center"""
        squad = self.get_object()

        if not squad.registration_center:
            return Response(
                {'message': 'This squad is not associated with a registration center'},
                status=status.HTTP_200_OK
            )

        # Get available squads at the same center
        available_squads = squad.get_available_squads_at_center(exclude_self=True)

        serializer = SquadSerializer(available_squads[:5], many=True)  # Limit to 5 suggestions
        return Response({
            'available_squads': serializer.data,
            'center_name': squad.registration_center.name,
            'total_available': len(available_squads)
        })


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
