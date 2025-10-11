from django.db import models
import uuid
from django.conf import settings


class Squad(models.Model):
    """
    Squad model for PamojaVote
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    goal_count = models.PositiveIntegerField(help_text="Target number of people to register")
    county = models.CharField(max_length=50)
    is_public = models.BooleanField(default=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='owned_squads'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    @property
    def member_count(self):
        return self.members.count()

    @property
    def registration_progress(self):
        """Calculate percentage of members who have confirmed registration"""
        if self.member_count == 0:
            return 0
        confirmed_count = self.members.filter(role='leader').count()  # Assuming leaders confirm registration
        return (confirmed_count / self.member_count) * 100

    class Meta:
        ordering = ['-created_at']


class SquadMember(models.Model):
    """
    Squad member relationship model
    """
    ROLE_CHOICES = [
        ('member', 'Member'),
        ('leader', 'Leader'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='squad_memberships'
    )
    squad = models.ForeignKey(
        Squad,
        on_delete=models.CASCADE,
        related_name='members'
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='member')
    joined_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.phone_number} - {self.squad.name} ({self.role})"

    class Meta:
        unique_together = ['user', 'squad']
        ordering = ['-joined_at']
