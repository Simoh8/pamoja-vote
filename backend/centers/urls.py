from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CenterViewSet, NearbyCentersView, CentersByCountyView, PollingStationsView

app_name = 'centers'

router = DefaultRouter()
router.register(r'centers', CenterViewSet, basename='center')

urlpatterns = [
    path('', include(router.urls)),
    path('nearby/', NearbyCentersView.as_view(), name='nearby_centers'),
    path('county/<str:county>/', CentersByCountyView.as_view(), name='centers_by_county'),
    path('polling-stations/', PollingStationsView.as_view(), name='polling_stations'),
]
