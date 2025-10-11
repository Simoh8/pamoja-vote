from django.db import models
import uuid
from django.conf import settings


class Invite(models.Model):
    """
    Invite model for tracking invitations sent via WhatsApp/SMS
    """
    CHANNEL_CHOICES = [
        ('whatsapp', 'WhatsApp'),
        ('sms', 'SMS'),
    ]

    STATUS_CHOICES = [
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(
        'events.Event',
        on_delete=models.CASCADE,
        related_name='invites',
        null=True, blank=True
    )
    squad = models.ForeignKey(
        'squads.Squad',
        on_delete=models.CASCADE,
        related_name='invites',
        null=True, blank=True
    )
    inviter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_invites'
    )
    invitee_contact = models.CharField(max_length=15, help_text="Phone number of invitee")
    channel = models.CharField(max_length=10, choices=CHANNEL_CHOICES)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='sent')
    message = models.TextField(blank=True, null=True)
    sent_at = models.DateTimeField(auto_now_add=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Invite to {self.invitee_contact} via {self.channel}"

    class Meta:
        ordering = ['-sent_at']
