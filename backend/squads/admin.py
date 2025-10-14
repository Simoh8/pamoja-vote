from django.contrib import admin
from .models import Squad, SquadMember


@admin.register(Squad)
class SquadAdmin(admin.ModelAdmin):
    """Admin for Squad model"""
    list_display = ('name', 'county', 'owner', 'max_members', 'member_count', 'registration_progress', 'is_public', 'created_at')
    list_filter = ('county', 'is_public', 'created_at')
    search_fields = ('name', 'description', 'owner__phone_number')
    readonly_fields = ('created_at', 'member_count', 'registration_progress')

    fieldsets = (
        (None, {'fields': ('name', 'description', 'county', 'max_members', 'is_public', 'owner')}),
        ('Stats', {'fields': ('member_count', 'registration_progress')}),
        ('Timestamps', {'fields': ('created_at',)}),
    )


@admin.register(SquadMember)
class SquadMemberAdmin(admin.ModelAdmin):
    """Admin for SquadMember model"""
    list_display = ('user', 'squad', 'role', 'joined_at')
    list_filter = ('role', 'joined_at')
    search_fields = ('user__phone_number', 'squad__name')
    readonly_fields = ('joined_at',)
