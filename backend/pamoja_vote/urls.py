"""
URL configuration for pamoja_vote project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# Import Spectacular views for API documentation
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

# Import viewsets for API documentation
from users.views import RegisterView, LoginView, VerifyOTPView, ProfileView, LogoutView
from squads.views import SquadViewSet, PublicSquadsView
from centers.views import CenterViewSet
from events.views import EventViewSet, UpcomingEventsView
from invites.views import InviteViewSet

# API Router
router = DefaultRouter()
router.register(r'squads', SquadViewSet, basename='squad')
router.register(r'centers', CenterViewSet, basename='center')
router.register(r'events', EventViewSet, basename='event')
router.register(r'invites', InviteViewSet, basename='invite')

urlpatterns = [
    path('admin/', admin.site.urls),

    # Authentication endpoints
    path('api/auth/register/', RegisterView.as_view(), name='register'),
    path('api/auth/login/', LoginView.as_view(), name='login'),
    path('api/auth/verify-otp/', VerifyOTPView.as_view(), name='verify_otp'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/profile/', ProfileView.as_view(), name='profile'),
    path('api/auth/logout/', LogoutView.as_view(), name='logout'),

    # API endpoints
    path('api/', include(router.urls)),
    path('api/public/squads/', PublicSquadsView.as_view(), name='public_squads'),
    path('api/events/upcoming/', UpcomingEventsView.as_view(), name='upcoming_events'),

    # API Documentation
    path('api/docs/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/docs/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
