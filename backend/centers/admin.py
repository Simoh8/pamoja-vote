from django.contrib import admin
from .models import Center


@admin.register(Center)
class CenterAdmin(admin.ModelAdmin):
    """Admin for Center model"""
    list_display = ('name', 'county', 'address', 'lat', 'lng')
    list_filter = ('county',)
    search_fields = ('name', 'address', 'county')
    readonly_fields = ('id',)

    fieldsets = (
        (None, {'fields': ('name', 'county', 'address')}),
        ('Location', {'fields': ('lat', 'lng')}),
        ('Additional Info', {'fields': ('opening_hours',)}),
    )
