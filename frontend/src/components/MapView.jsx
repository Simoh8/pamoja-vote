import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import { Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

// Component to handle marker clustering
const MarkerCluster = ({ pollingStations }) => {
  const map = useMap();

  useEffect(() => {
    if (!pollingStations || !map) return;

    // Load markercluster dynamically to avoid import issues
    const loadMarkerCluster = async () => {
      try {
        const markerClusterModule = await import('leaflet.markercluster');
        const MarkerClusterGroup = markerClusterModule.default || markerClusterModule;

        // Create marker cluster group
        const markers = new MarkerClusterGroup();

        // Add polling station markers
        pollingStations.features.forEach((feature, index) => {
          if (feature.geometry && feature.geometry.coordinates) {
            const [lng, lat] = feature.geometry.coordinates;
            const marker = L.marker([lat, lng]).bindPopup(`
              <div class="p-2">
                <h4 class="font-semibold text-gray-900">
                  ${feature.properties?.name || 'Polling Station'}
                </h4>
                ${feature.properties?.county ? `<p class="text-sm text-gray-600">County: ${feature.properties.county}</p>` : ''}
                ${feature.properties?.constituency ? `<p class="text-sm text-gray-600">Constituency: ${feature.properties.constituency}</p>` : ''}
              </div>
            `);
            markers.addLayer(marker);
          }
        });

        // Add cluster group to map
        map.addLayer(markers);

        // Cleanup function
        return () => {
          map.removeLayer(markers);
        };
      } catch (error) {
        console.error('Failed to load marker cluster:', error);
      }
    };

    loadMarkerCluster();
  }, [pollingStations, map]);

  return null;
};

const MapView = ({ centers }) => {
  const [geoJsonData, setGeoJsonData] = useState({
    counties: null,
    constituencies: null,
    wards: null,
    pollingStations: null
  });
  const [kenyaCenter] = useState([0.0236, 37.9062]); // Center of Kenya

  // Load polling stations data for marker clustering
  useEffect(() => {
    const loadPollingStations = async () => {
      try {
        const response = await fetch('/polling_stations.geojson');
        if (response.ok) {
          const data = await response.json();
          setGeoJsonData(prev => ({ ...prev, pollingStations: data }));
        }
      } catch (error) {
        console.error('Error loading polling stations:', error);
      }
    };

    loadPollingStations();
  }, []);

  // Custom icon for registration centers
  const centerIcon = new Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#2563eb" width="24" height="24">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    `),
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24]
  });

  // Load all GeoJSON data
  useEffect(() => {
    const loadGeoJsonData = async () => {
      try {
        // Load Counties
        const countiesResponse = await fetch('/kenya_counties.geojson');
        if (countiesResponse.ok) {
          const countiesData = await countiesResponse.json();
          setGeoJsonData(prev => ({ ...prev, counties: countiesData }));
        }

        // Load Constituencies
        const constituenciesResponse = await fetch('/kenya_constituencies.geojson');
        if (constituenciesResponse.ok) {
          const constituenciesData = await constituenciesResponse.json();
          setGeoJsonData(prev => ({ ...prev, constituencies: constituenciesData }));
        }

        // Load Wards
        const wardsResponse = await fetch('/kenya_wards.geojson');
        if (wardsResponse.ok) {
          const wardsData = await wardsResponse.json();
          setGeoJsonData(prev => ({ ...prev, wards: wardsData }));
        }
      } catch (error) {
        console.error('Error loading GeoJSON data:', error);
      }
    };

    loadGeoJsonData();
  }, []);

  // Style functions for different GeoJSON layers
  const countyStyle = { color: 'blue', weight: 2, fillOpacity: 0.1 };
  const constituencyStyle = { color: 'green', weight: 1, fillOpacity: 0.1 };
  const wardStyle = { color: 'orange', weight: 0.5, fillOpacity: 0.05 };

  // Handle feature click events for different layers
  const onEachCountyFeature = (feature, layer) => {
    if (feature.properties && feature.properties.COUNTY_NAM) {
      layer.bindPopup(`<strong>${feature.properties.COUNTY_NAM}</strong>`);
    }
  };

  const onEachConstituencyFeature = (feature, layer) => {
    if (feature.properties && feature.properties.CONSTITUEN) {
      layer.bindPopup(`<strong>${feature.properties.CONSTITUEN}</strong><br/>County: ${feature.properties.COUNTY_NAM}`);
    }
  };

  const onEachWardFeature = (feature, layer) => {
    if (feature.properties && feature.properties.NAME) {
      layer.bindPopup(`<strong>${feature.properties.NAME}</strong>`);
    }
  };

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden border border-gray-300">
      <MapContainer
        center={kenyaCenter}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Counties Layer */}
        {geoJsonData.counties && (
          <GeoJSON
            data={geoJsonData.counties}
            style={countyStyle}
            onEachFeature={onEachCountyFeature}
          />
        )}

        {/* Constituencies Layer */}
        {geoJsonData.constituencies && (
          <GeoJSON
            data={geoJsonData.constituencies}
            style={constituencyStyle}
            onEachFeature={onEachConstituencyFeature}
          />
        )}

        {/* Wards Layer */}
        {geoJsonData.wards && (
          <GeoJSON
            data={geoJsonData.wards}
            style={wardStyle}
            onEachFeature={onEachWardFeature}
          />
        )}

        {/* Polling Stations with Clustering */}
        {geoJsonData.pollingStations && (
          <MarkerCluster pollingStations={geoJsonData.pollingStations} />
        )}

        {/* Registration Centers */}
        {centers && centers.map((center) => (
          <Marker
            key={center.id}
            position={[center.latitude || 0, center.longitude || 0]}
            icon={centerIcon}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-gray-900">{center.name}</h3>
                <p className="text-sm text-gray-600">{center.location}</p>
                <p className="text-sm text-blue-600">{center.county}</p>
                {center.phone && (
                  <p className="text-sm text-gray-600">Phone: {center.phone}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;
