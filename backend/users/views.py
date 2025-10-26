from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from django.db import transaction
from .models import User
from .serializers import (
    UserSerializer, UserUpdateSerializer, LoginSerializer,
    OTPSerializer, PasswordResetSerializer
)
from invites.sms_service import sms_service
import logging

logger = logging.getLogger(__name__)


class RegisterView(generics.CreateAPIView):
    """Register a new user"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Generate and send OTP via SMS
        phone_number = serializer.validated_data['phone_number']
        otp = User.generate_otp_for_phone(phone_number)

        # Send OTP via SMS
        message = f"🇰🇪 Your Pamoja2Vote verification code is: {otp}\n\nThis code will expire in 5 minutes."

        sms_result = sms_service.send_sms(
            to_phone=phone_number,
            message=message
        )

        if sms_result['success']:
            logger.info(f"Registration OTP sent successfully to {phone_number}")
        else:
            logger.error(f"Failed to send registration OTP to {phone_number}: {sms_result['error']}")
            # Still create user but log the error
            # In production, you might want to return an error instead

        user = serializer.save()

        response_data = {
            'message': 'User registered successfully. Please verify OTP sent to your phone.',
            'phone_number': phone_number,
            'otp_sent': sms_result['success'],
            'user_id': str(user.id)
        }

        if not sms_result['success']:
            response_data['error'] = 'Failed to send OTP SMS. Please try again.'
            response_data['otp'] = otp  # Include OTP in response for debugging

        return Response(response_data, status=status.HTTP_201_CREATED)




class LoginView(APIView):
    """Login with phone number (sends OTP)"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        phone_number = serializer.validated_data['phone_number']

        # Check if user exists, create if not
        try:
            user = User.objects.get(phone_number=phone_number)
            user_created = False
        except User.DoesNotExist:
            # Create new user with phone number
            user = User.objects.create_user(
                phone_number=phone_number,
                email=f'{phone_number}@temp.local',  # Temporary email
                first_name='',
                last_name='',
                password='temp_password_123'  # Temporary password
            )
            user_created = True

        # Generate and send OTP via SMS
        otp = user.generate_otp()
        message = f"🇰🇪 Your Pamoja2Vote login code is: {otp}\n\nThis code will expire in 5 minutes."

        sms_result = sms_service.send_sms(
            to_phone=phone_number,
            message=message
        )

        if sms_result['success']:
            logger.info(f"Login OTP sent successfully to {phone_number}")
        else:
            logger.error(f"Failed to send login OTP to {phone_number}: {sms_result['error']}")

        response_data = {
            'message': 'OTP sent to your phone number.',
            'phone_number': phone_number,
            'otp_sent': sms_result['success'],
            'user_created': user_created
        }

        if not sms_result['success']:
            response_data['error'] = 'Failed to send OTP SMS. Please try again.'
            response_data['otp'] = otp  # Include OTP in response for debugging

        return Response(response_data)


class VerifyOTPView(APIView):
    """Verify OTP and get JWT tokens"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']

        # Clear OTP after successful verification
        user.clear_otp()

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

        # Generate and send new OTP for password reset confirmation
        otp = user.generate_otp()
        message = f"🇰🇪 Your Pamoja2Vote password reset code is: {otp}\n\nThis code will expire in 5 minutes."

        sms_result = sms_service.send_sms(
            to_phone=user.phone_number,
            message=message
        )

        if sms_result['success']:
            logger.info(f"Password reset OTP sent successfully to {user.phone_number}")
        else:
            logger.error(f"Failed to send password reset OTP to {user.phone_number}: {sms_result['error']}")

        # Set new password (OTP verification will be done separately)
        user.set_password(new_password)
        user.save()

        response_data = {
            'message': 'Password reset OTP sent to your phone. Please verify the code to complete the reset.',
            'otp_sent': sms_result['success']
        }

        if not sms_result['success']:
            response_data['error'] = 'Failed to send OTP SMS. Please try again.'
            response_data['otp'] = otp  # Include OTP in response for debugging

        return Response(response_data)


class VerifyPasswordResetOTPView(APIView):
    """Verify password reset OTP"""
    permission_classes = [AllowAny]

    def post(self, request):
        # Use the same serializer as login verification
        serializer = OTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']

        # Clear OTP after successful verification
        user.clear_otp()

        return Response({
            'message': 'Password reset OTP verified successfully. Your password has been updated.'
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

    def update(self, request, *args, **kwargs):
        """Handle profile update and return complete user data"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        # Save the updated instance
        self.perform_update(serializer)

        # Return complete user data using UserSerializer
        complete_serializer = UserSerializer(instance)
        return Response(complete_serializer.data)


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
