from rest_framework import generics, viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.db.models import Q
from .models import Center
from .serializers import CenterSerializer, CenterCreateSerializer
import json
import os


class CenterViewSet(viewsets.ModelViewSet):
    """ViewSet for Center CRUD operations"""
    serializer_class = CenterSerializer

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

    def get_permissions(self):
        """Allow public read access, authenticated write access"""
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'create':
            return CenterCreateSerializer
        return CenterSerializer


class NearbyCentersView(generics.ListAPIView):
    """Get centers near user's location"""
    serializer_class = CenterSerializer
    permission_classes = [AllowAny]  # Allow public access for finding centers

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


@api_view(['GET'])
@permission_classes([AllowAny])
def PollingStationsView(request):
    """Serve polling stations GeoJSON data"""
    try:
        # Try to find the polling stations file in common locations
        possible_paths = [
            # If deployed together with frontend
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'frontend', 'public', 'polling_stations.geojson'),
            # If served as static file
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'staticfiles', 'polling_stations.geojson'),
            # Fallback: return empty GeoJSON
        ]

        for path in possible_paths:
            if os.path.exists(path):
                with open(path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                return Response(data)

        # If file not found, return empty GeoJSON structure
        return Response({
            "type": "FeatureCollection",
            "features": []
        })

    except Exception as e:
        # Return empty GeoJSON on any error
        return Response({
            "type": "FeatureCollection",
            "features": []
        })
