from django.db import models
import uuid
from django.conf import settings


class Event(models.Model):
    """
    Voter registration event model
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    squad = models.ForeignKey(
        'squads.Squad',
        on_delete=models.CASCADE,
        related_name='events'
    )
    center = models.ForeignKey(
        'centers.Center',
        on_delete=models.CASCADE,
        related_name='events'
    )
    datetime = models.DateTimeField()
    meeting_point = models.TextField(blank=True, null=True)
    note = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.squad.name} - {self.center.name} ({self.datetime.strftime('%Y-%m-%d %H:%M')})"

    class Meta:
        ordering = ['datetime']


class EventRSVP(models.Model):
    """
    RSVP responses for events
    """
    RSVP_CHOICES = [
        ('yes', 'Yes'),
        ('no', 'No'),
        ('maybe', 'Maybe'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='rsvps'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='event_rsvps'
    )
    status = models.CharField(max_length=10, choices=RSVP_CHOICES, default='maybe')
    responded_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.phone_number} - {self.event.squad.name} ({self.status})"

    class Meta:
        unique_together = ['event', 'user']
        ordering = ['-responded_at']
