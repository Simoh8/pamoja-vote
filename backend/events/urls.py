from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventViewSet, EventRSVPViewSet, UpcomingEventsView, EventsBySquadView

app_name = 'events'

router = DefaultRouter()
router.register(r'events', EventViewSet, basename='event')
router.register(r'rsvps', EventRSVPViewSet, basename='rsvp')

urlpatterns = [
    path('', include(router.urls)),
    path('upcoming/', UpcomingEventsView.as_view(), name='upcoming_events'),
    path('squad/<uuid:squad_id>/', EventsBySquadView.as_view(), name='events_by_squad'),
]
