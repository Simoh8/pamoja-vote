from django.contrib import admin
from .models import Invite


@admin.register(Invite)
class InviteAdmin(admin.ModelAdmin):
    """Admin for Invite model"""
    list_display = ('invitee_contact', 'channel', 'status', 'inviter', 'event', 'squad', 'sent_at')
    list_filter = ('channel', 'status', 'sent_at')
    search_fields = ('invitee_contact', 'inviter__phone_number', 'message')
    readonly_fields = ('sent_at', 'delivered_at')

    fieldsets = (
        (None, {'fields': ('inviter', 'invitee_contact', 'channel')}),
        ('Related', {'fields': ('event', 'squad')}),
        ('Content', {'fields': ('message', 'status')}),
        ('Timestamps', {'fields': ('sent_at', 'delivered_at')}),
    )
