from django.contrib import admin
from .models import Event, EventRSVP


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    """Admin for Event model"""
    list_display = ('squad', 'center', 'datetime', 'meeting_point', 'created_at')
    list_filter = ('datetime', 'created_at')
    search_fields = ('squad__name', 'center__name', 'note')
    readonly_fields = ('created_at',)

    fieldsets = (
        (None, {'fields': ('squad', 'center', 'datetime')}),
        ('Details', {'fields': ('meeting_point', 'note')}),
        ('Timestamps', {'fields': ('created_at',)}),
    )


@admin.register(EventRSVP)
class EventRSVPAdmin(admin.ModelAdmin):
    """Admin for EventRSVP model"""
    list_display = ('event', 'user', 'status', 'responded_at')
    list_filter = ('status', 'responded_at')
    search_fields = ('event__squad__name', 'user__phone_number')
    readonly_fields = ('responded_at',)
