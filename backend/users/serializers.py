from rest_framework import serializers
from django.contrib.auth import authenticate
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
        # For login/OTP sending, we don't require the user to exist yet
        # The user will be created during registration or verified during OTP verification
        return value


class OTPSerializer(serializers.Serializer):
    """Serializer for OTP verification"""
    phone_number = serializers.CharField(max_length=15)
    otp = serializers.CharField(max_length=6)

    def validate(self, data):
        phone_number = data.get('phone_number')
        otp = data.get('otp')

        # For development, we'll mock OTP verification
        # In production, this would verify with Twilio
        if otp != '123456':  # Mock OTP for development
            raise serializers.ValidationError("Invalid OTP.")

        try:
            user = User.objects.get(phone_number=phone_number)
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found.")

        data['user'] = user
        return data


class PasswordResetSerializer(serializers.Serializer):
    """Serializer for password reset via OTP"""
    phone_number = serializers.CharField(max_length=15)
    otp = serializers.CharField(max_length=6)
    new_password = serializers.CharField(min_length=8, write_only=True)

    def validate(self, data):
        phone_number = data.get('phone_number')
        otp = data.get('otp')

        # Mock OTP verification for development
        if otp != '123456':
            raise serializers.ValidationError("Invalid OTP.")

        try:
            user = User.objects.get(phone_number=phone_number)
            data['user'] = user
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found.")

        return data
