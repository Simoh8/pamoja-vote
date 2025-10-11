from rest_framework import generics, viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q
from .models import Center
from .serializers import CenterSerializer, CenterCreateSerializer


class CenterViewSet(viewsets.ModelViewSet):
    """ViewSet for Center CRUD operations"""
    serializer_class = CenterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Center.objects.all()
        county = self.request.query_params.get('county')
        search = self.request.query_params.get('search')

        if county:
            queryset = queryset.filter(county=county)

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(address__icontains=search) |
                Q(county__icontains=search)
            )

        return queryset

    def get_serializer_class(self):
        if self.action == 'create':
            return CenterCreateSerializer
        return CenterSerializer


class NearbyCentersView(generics.ListAPIView):
    """Get centers near user's location"""
    serializer_class = CenterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # In production, this would calculate actual distance
        # For now, return all centers
        return Center.objects.all()


class CentersByCountyView(generics.ListAPIView):
    """Get centers filtered by county"""
    serializer_class = CenterSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        county = self.kwargs.get('county')
        return Center.objects.filter(county=county)
