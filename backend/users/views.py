from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
import random
import string
from .models import User
from .serializers import (
    UserSerializer, UserUpdateSerializer, LoginSerializer,
    OTPSerializer, PasswordResetSerializer
)


class RegisterView(generics.CreateAPIView):
    """Register a new user"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Send OTP for verification (mock for development)
        phone_number = serializer.validated_data['phone_number']
        otp = '123456'  # Mock OTP

        # In production, integrate with Twilio Verify API
        # twilio_client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        # verification = twilio_client.verify.services(settings.TWILIO_VERIFY_SID).verifications.create(
        #     to=phone_number, channel='sms'
        # )

        user = serializer.save()

        return Response({
            'message': 'User registered successfully. Please verify OTP.',
            'phone_number': phone_number,
            'otp': otp,  # Remove in production
            'user_id': str(user.id)
        }, status=status.HTTP_201_CREATED)




class LoginView(APIView):
    """Login with phone number (sends OTP)"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        phone_number = serializer.validated_data['phone_number']
        otp = '123456'  # Mock OTP

        # Check if user exists, create if not
        try:
            user = User.objects.get(phone_number=phone_number)
        except User.DoesNotExist:
            # Create new user with phone number
            user = User.objects.create_user(
                phone_number=phone_number,
                email=f'{phone_number}@temp.local',  # Temporary email
                first_name='',
                last_name='',
                password='temp_password_123'  # Temporary password
            )

        # In production, integrate with Twilio Verify API
        # twilio_client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        # verification = twilio_client.verify.services(settings.TWILIO_VERIFY_SID).verifications.create(
        #     to=phone_number, channel='sms'
        # )

        return Response({
            'message': 'OTP sent to your phone number.',
            'phone_number': phone_number,
            'otp': otp,  # Remove in production
            'user_created': not User.objects.filter(phone_number=phone_number).exists()
        })


class VerifyOTPView(APIView):
    """Verify OTP and get JWT tokens"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        # Update last login
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])

        return Response({
            'message': 'Login successful',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': UserSerializer(user).data
        })


class PasswordResetView(APIView):
    """Reset password with OTP"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        new_password = serializer.validated_data['new_password']

        user.set_password(new_password)
        user.save()

        return Response({
            'message': 'Password reset successfully'
        })


class ProfileView(generics.RetrieveUpdateAPIView):
    """Get and update user profile"""
    serializer_class = UserUpdateSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return UserSerializer
        return UserUpdateSerializer


class LogoutView(APIView):
    """Logout user (blacklist refresh token)"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            pass  # Token might already be blacklisted

        return Response({'message': 'Logout successful'})
