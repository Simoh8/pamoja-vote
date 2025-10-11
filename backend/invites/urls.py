from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InviteViewSet, WhatsAppInviteView, BulkInviteView

app_name = 'invites'

router = DefaultRouter()
router.register(r'invites', InviteViewSet, basename='invite')

urlpatterns = [
    path('', include(router.urls)),
    path('whatsapp/', WhatsAppInviteView.as_view(), name='whatsapp_invite'),
    path('bulk/', BulkInviteView.as_view(), name='bulk_invite'),
]
