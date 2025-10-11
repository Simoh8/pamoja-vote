from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SquadViewSet, SquadMemberViewSet, PublicSquadsView

app_name = 'squads'

router = DefaultRouter()
router.register(r'squads', SquadViewSet, basename='squad')
router.register(r'members', SquadMemberViewSet, basename='member')

urlpatterns = [
    path('', include(router.urls)),
    path('public/', PublicSquadsView.as_view(), name='public_squads'),
]
