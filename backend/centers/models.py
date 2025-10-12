from django.db import models
import uuid


class Center(models.Model):
    """
    IEBC Registration Center model
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    county = models.CharField(max_length=50)
    constituency = models.CharField(max_length=100, blank=True, null=True)
    ward = models.CharField(max_length=100, blank=True, null=True)
    polling_station_name = models.CharField(max_length=200, blank=True, null=True, help_text="Primary school or polling station name")
    address = models.TextField()
    lat = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    lng = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    opening_hours = models.JSONField(blank=True, null=True, help_text="Store opening hours as JSON")

    def __str__(self):
        return f"{self.name} - {self.county}"

    class Meta:
        ordering = ['county', 'name']

    def get_coordinates(self):
        """Return coordinates as a tuple"""
        if self.lat and self.lng:
            return (float(self.lat), float(self.lng))
        return None
