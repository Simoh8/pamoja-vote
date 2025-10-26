from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils import timezone
import uuid
from datetime import timedelta

class UserManager(BaseUserManager):
    def create_user(self, phone_number, email, password=None, **extra_fields):
        if not phone_number:
            raise ValueError('The Phone number must be set')
        if not email:
            raise ValueError('The Email must be set')

        email = self.normalize_email(email)
        user = self.model(phone_number=phone_number, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone_number, email, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(phone_number, email, password, **extra_fields)


class User(AbstractUser):
    """
    Custom user model for PamojaVote
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone_number = models.CharField(max_length=15, unique=True)
    county = models.CharField(max_length=50, blank=True, null=True)
    profile_pic = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # OTP fields for SMS verification
    otp_code = models.CharField(max_length=6, blank=True, null=True)
    otp_created_at = models.DateTimeField(blank=True, null=True)

    # Remove username field since we're using phone_number as the unique identifier
    username = None

    USERNAME_FIELD = 'phone_number'
    REQUIRED_FIELDS = ['email']

    objects = UserManager()

    def __str__(self):
        return f"{self.phone_number} - {self.get_full_name()}"

    def generate_otp(self):
        """Generate a 6-digit OTP code"""
        import random
        import string

        # Generate random 6-digit OTP
        otp = ''.join(random.choices(string.digits, k=6))
        self.otp_code = otp
        self.otp_created_at = timezone.now()
        self.save(update_fields=['otp_code', 'otp_created_at'])

        return otp

    def verify_otp(self, otp_code):
        """Verify if the provided OTP code is valid"""
        if not self.otp_code or not self.otp_created_at:
            return False

        # Check if OTP has expired (5 minutes expiry)
        expiry_time = self.otp_created_at + timedelta(minutes=5)
        if timezone.now() > expiry_time:
            return False

        return self.otp_code == otp_code

    def clear_otp(self):
        """Clear the OTP code"""
        self.otp_code = None
        self.otp_created_at = None
        self.save(update_fields=['otp_code', 'otp_created_at'])

    @staticmethod
    def generate_otp_for_phone(phone_number):
        """Generate OTP for a phone number (creates user if doesn't exist)"""
        try:
            user = User.objects.get(phone_number=phone_number)
        except User.DoesNotExist:
            # Create user with temporary email if doesn't exist
            user = User.objects.create_user(
                phone_number=phone_number,
                email=f'{phone_number}@temp.local',
                password='temp_password_123'
            )

        return user.generate_otp()
