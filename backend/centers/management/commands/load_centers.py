import json
import os
import uuid
from django.core.management.base import BaseCommand
from django.conf import settings
from centers.models import Center


class Command(BaseCommand):
    help = 'Load registration centers from GeoJSON file into the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--geojson-path',
            default=None,
            help='Path to the polling stations GeoJSON file'
        )

    def handle(self, *args, **options):
        # Try to find the GeoJSON file
        geojson_path = options.get('geojson_path')

        if not geojson_path:
            # Try common locations
            possible_paths = [
                '/home/simon/Documents/pamoja_vote/frontend/public/polling_stations.geojson',
                'frontend/public/polling_stations.geojson',
                '../frontend/public/polling_stations.geojson',
                'polling_stations.geojson'
            ]

            for path in possible_paths:
                if os.path.exists(path):
                    geojson_path = path
                    break

        if not geojson_path or not os.path.exists(geojson_path):
            self.stdout.write(
                self.style.ERROR(
                    f'GeoJSON file not found. Please specify path with --geojson-path'
                )
            )
            return

        self.stdout.write(f'Loading centers from: {geojson_path}')

        try:
            with open(geojson_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            if not data.get('features'):
                self.stdout.write(
                    self.style.ERROR('No features found in GeoJSON file')
                )
                return

            centers_created = 0
            centers_updated = 0

            for feature in data['features']:
                props = feature.get('properties', {})
                geometry = feature.get('geometry', {})

                # Skip if no name or invalid coordinates
                if not props.get('name') or not geometry.get('coordinates'):
                    continue

                coordinates = geometry['coordinates']
                if coordinates[0] == 0.0 and coordinates[1] == 0.0:
                    continue  # Skip centers at origin

                # Create address from available location data
                address_parts = []
                if props.get('ward'):
                    address_parts.append(props['ward'])
                if props.get('location'):
                    address_parts.append(props['location'])
                if props.get('constituency'):
                    address_parts.append(props['constituency'])

                address = ', '.join(address_parts) if address_parts else props.get('name', 'Unknown Location')

                # Generate a proper UUID for the center
                center_id = uuid.uuid4()

                # Try to create or update the center
                center, created = Center.objects.get_or_create(
                    name=props['name'],
                    county=props.get('county', 'Unknown'),
                    defaults={
                        'id': center_id,
                        'constituency': props.get('constituency') or props.get('constituen'),
                        'ward': props.get('ward'),
                        'location': props.get('ward') or props.get('location'),  # Use ward as location if available
                        'polling_station_name': props.get('polling_station_name'),
                        'address': address,
                        'lat': coordinates[1] if len(coordinates) > 1 else None,
                        'lng': coordinates[0] if len(coordinates) > 0 else None,
                    }
                )

                if created:
                    centers_created += 1
                    self.stdout.write(
                        self.style.SUCCESS(f'Created center: {center.name} in {center.county}')
                    )
                else:
                    centers_updated += 1
                    self.stdout.write(f'Updated center: {center.name} in {center.county}')

            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully loaded {centers_created} new centers, '
                    f'updated {centers_updated} existing centers'
                )
            )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error loading centers: {str(e)}')
            )
