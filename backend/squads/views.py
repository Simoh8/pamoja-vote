from rest_framework import status, generics, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django.db.models import Count, Q
from .models import Squad, SquadMember
from .serializers import (
    SquadSerializer, SquadCreateSerializer, SquadJoinSerializer,
    SquadLeaderboardSerializer, SquadMemberSerializer
)


class SquadViewSet(viewsets.ModelViewSet):
    """ViewSet for Squad CRUD operations"""
    serializer_class = SquadSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Users can see public squads and squads they're members of
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
        serializer = SquadJoinSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        # Override squad_id with the URL parameter
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
            if membership.role == 'leader' and squad.members.filter(role='leader').count() == 1:
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

        # Check if user has permission to change roles
        if membership.squad.owner != request.user and membership.role != 'leader':
            return Response(
                {'error': 'You do not have permission to change roles'},
                status=status.HTTP_403_FORBIDDEN
            )

        membership.role = new_role
        membership.save()

        return Response({
            'message': f'Role changed to {new_role}',
            'membership': SquadMemberSerializer(membership).data
        })


class PublicSquadsView(generics.ListAPIView):
    """List all public squads"""
    serializer_class = SquadSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Squad.objects.filter(is_public=True).prefetch_related('members')
