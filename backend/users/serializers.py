from rest_framework import serializers
from django.contrib.auth import authenticate
from django.utils import timezone
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('id', 'phone_number', 'email', 'first_name', 'last_name',
                 'county', 'profile_pic', 'created_at', 'password')
        read_only_fields = ('id', 'created_at')

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile"""

    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'county', 'profile_pic')
        read_only_fields = ('phone_number', 'email')


class LoginSerializer(serializers.Serializer):
    """Serializer for phone number login"""
    phone_number = serializers.CharField(max_length=15)

    def validate_phone_number(self, value):
        # Validate phone number format
        if not value.startswith('+'):
            # Add +254 prefix for Kenyan numbers if not present
            if value.startswith('254'):
                value = f'+{value}'
            elif value.startswith('0'):
                value = f'+254{value[1:]}'
            elif value.startswith('7') or value.startswith('1'):
                value = f'+254{value}'

        # Basic validation for Kenyan numbers
        if not value.startswith('+254') or len(value) != 13:
            raise serializers.ValidationError(
                "Please enter a valid Kenyan phone number (e.g., +254700000000)"
            )

        return value


class OTPSerializer(serializers.Serializer):
    """Serializer for OTP verification"""
    phone_number = serializers.CharField(max_length=15)
    otp = serializers.CharField(max_length=6)

    def validate_phone_number(self, value):
        # Use the same validation as LoginSerializer
        if not value.startswith('+'):
            if value.startswith('254'):
                value = f'+{value}'
            elif value.startswith('0'):
                value = f'+254{value[1:]}'
            elif value.startswith('7') or value.startswith('1'):
                value = f'+254{value}'

        if not value.startswith('+254') or len(value) != 13:
            raise serializers.ValidationError(
                "Please enter a valid Kenyan phone number (e.g., +254700000000)"
            )

        return value

    def validate(self, data):
        phone_number = data.get('phone_number')
        otp = data.get('otp')

        try:
            user = User.objects.get(phone_number=phone_number)
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found. Please register first.")

        # Verify OTP using the user's verify_otp method
        if not user.verify_otp(otp):
            raise serializers.ValidationError("Invalid or expired OTP code.")

        data['user'] = user
        return data


class PasswordResetSerializer(serializers.Serializer):
    """Serializer for password reset via OTP"""
    phone_number = serializers.CharField(max_length=15)
    otp = serializers.CharField(max_length=6)
    new_password = serializers.CharField(min_length=8, write_only=True)

    def validate_phone_number(self, value):
        # Use the same validation as LoginSerializer
        if not value.startswith('+'):
            if value.startswith('254'):
                value = f'+{value}'
            elif value.startswith('0'):
                value = f'+254{value[1:]}'
            elif value.startswith('7') or value.startswith('1'):
                value = f'+254{value}'

        if not value.startswith('+254') or len(value) != 13:
            raise serializers.ValidationError(
                "Please enter a valid Kenyan phone number (e.g., +254700000000)"
            )

        return value

    def validate(self, data):
        phone_number = data.get('phone_number')
        otp = data.get('otp')

        try:
            user = User.objects.get(phone_number=phone_number)
            data['user'] = user
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found.")

        # Verify OTP using the user's verify_otp method
        if not user.verify_otp(otp):
            raise serializers.ValidationError("Invalid or expired OTP code.")

        return data
