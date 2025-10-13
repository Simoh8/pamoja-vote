import { useEffect, useState, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import { Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Lazy load marker cluster to reduce initial bundle size
const loadMarkerCluster = async () => {
  try {
    const markerClusterModule = await import('leaflet.markercluster');
    return markerClusterModule.default || markerClusterModule;
  } catch (error) {
    console.warn('MarkerCluster not available:', error);
    return null;
  }
};

// Optimized marker cluster component with memoization
const MarkerCluster = ({ pollingStations, visibleFeatures = null }) => {
  const map = useMap();

  useEffect(() => {
    if (!pollingStations || !map) return;

    let markers = null;
    let cleanup = null;

    const setupMarkers = async () => {
      const MarkerClusterGroup = await loadMarkerCluster();

      if (!MarkerClusterGroup) {
        console.warn('MarkerCluster not loaded, using regular markers');
        return;
      }

      // Create marker cluster group with optimized settings
      markers = new MarkerClusterGroup({
        chunkedLoading: true,
        maxClusterRadius: 80,
        spiderfyOnMaxZoom: false,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
      });

      // Filter features if visibleFeatures is provided (for performance)
      const featuresToShow = visibleFeatures || pollingStations.features;

      // Process features in batches to avoid blocking the UI
      const batchSize = 100;
      for (let i = 0; i < featuresToShow.length; i += batchSize) {
        const batch = featuresToShow.slice(i, i + batchSize);

        // Use setTimeout to yield control to the browser
        await new Promise(resolve => setTimeout(resolve, 0));

        batch.forEach((feature) => {
          if (feature.geometry && feature.geometry.coordinates) {
            const [lng, lat] = feature.geometry.coordinates;

            // Skip invalid coordinates
            if (isNaN(lat) || isNaN(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
              return;
            }

            const marker = L.marker([lat, lng]).bindPopup(`
              <div class="p-2 max-w-xs">
                <h4 class="font-semibold text-gray-900 text-sm">
                  ${feature.properties?.name || 'Polling Station'}
                </h4>
                ${feature.properties?.county ? `<p class="text-xs text-gray-600">County: ${feature.properties.county}</p>` : ''}
                ${feature.properties?.constituency ? `<p class="text-xs text-gray-600">Constituency: ${feature.properties.constituency}</p>` : ''}
                ${feature.properties?.ward ? `<p class="text-xs text-gray-600">Ward: ${feature.properties.ward}</p>` : ''}
              </div>
            `);
            markers.addLayer(marker);
          }
        });
      }

      // Add cluster group to map
      map.addLayer(markers);

      cleanup = () => {
        if (map && markers) {
          map.removeLayer(markers);
        }
      };
    };

    setupMarkers();

    return cleanup;
  }, [pollingStations, map, visibleFeatures]);

  return null;
};

const MapView = ({ centers = [], maxMarkers = 1000 }) => {
  const [geoJsonData, setGeoJsonData] = useState({
    counties: null,
    constituencies: null,
    wards: null,
    pollingStations: null
  });

  const [kenyaCenter] = useState([0.0236, 37.9062]); // Center of Kenya
  const [loadedLayers, setLoadedLayers] = useState({
    counties: false,
    constituencies: false,
    wards: false
  });

  // Memoize filtered centers to avoid unnecessary recalculations
  const filteredCenters = useMemo(() => {
    if (!centers || centers.length === 0) return [];

    // Limit markers for performance
    return centers.slice(0, maxMarkers).filter(center =>
      center.latitude && center.longitude &&
      !isNaN(center.latitude) && !isNaN(center.longitude) &&
      Math.abs(center.latitude) <= 90 && Math.abs(center.longitude) <= 180
    );
  }, [centers, maxMarkers]);

  // Custom icon for registration centers - memoized for performance
  const centerIcon = useMemo(() => {
    try {
      // Try multiple approaches for creating the custom icon
      const approaches = [
        // Approach 1: Simple SVG circle
        () => {
          const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="8" fill="#2563eb" stroke="white" stroke-width="2"/>
          </svg>`;

          return new Icon({
            iconUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
            popupAnchor: [0, -10]
          });
        },

        // Approach 2: Base64 encoded SVG
        () => {
          const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#2563eb" width="20" height="20">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>`;

          return new Icon({
            iconUrl: 'data:image/svg+xml;base64,' + btoa(svgString),
            iconSize: [20, 20],
            iconAnchor: [10, 20],
            popupAnchor: [0, -20]
          });
        }
      ];

      // Try each approach until one works
      for (const createIcon of approaches) {
        try {
          const icon = createIcon();
          console.log('Custom icon created successfully');
          return icon;
        } catch (error) {
          console.warn('Icon creation approach failed:', error);
        }
      }

      // If all approaches fail, return null to use default marker
      console.log('All icon creation approaches failed, using default marker');
      return null;

    } catch (error) {
      console.error('Failed to create custom icon:', error);
      return null;
    }
  }, []);

  // Lazy load GeoJSON data only when needed
  const loadGeoJsonData = useCallback(async (layerType) => {
    if (loadedLayers[layerType]) return;

    try {
      let url = '';
      switch (layerType) {
        case 'counties':
          url = '/kenya_counties.geojson';
          break;
        case 'constituencies':
          url = '/kenya_constituencies.geojson';
          break;
        case 'wards':
          url = '/kenya_wards.geojson';
          break;
        default:
          return;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setGeoJsonData(prev => ({ ...prev, [layerType]: data }));
        setLoadedLayers(prev => ({ ...prev, [layerType]: true }));
      }
    } catch (error) {
      console.warn(`Failed to load ${layerType} data:`, error);
    }
  }, [loadedLayers]);

  // Style functions for different GeoJSON layers - memoized for performance
  const countyStyle = useMemo(() => ({
    color: '#3b82f6',
    weight: 2,
    fillOpacity: 0.1,
    opacity: 0.6
  }), []);

  const constituencyStyle = useMemo(() => ({
    color: '#10b981',
    weight: 1.5,
    fillOpacity: 0.1,
    opacity: 0.5
  }), []);

  const wardStyle = useMemo(() => ({
    color: '#f59e0b',
    weight: 1,
    fillOpacity: 0.05,
    opacity: 0.4
  }), []);

  return (
    <div className="w-full h-[600px] rounded-lg overflow-hidden border border-gray-300">
      {/* Custom styles for Leaflet icons */}
      <style jsx global>{`
        .leaflet-container .leaflet-marker-icon {
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        }
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .leaflet-popup-tip {
          border: none;
        }
      `}</style>

      <MapContainer
        center={kenyaCenter}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={18}
        />

        {/* Counties Layer - Load on demand */}
        <GeoJSON
          data={geoJsonData.counties}
          style={countyStyle}
          onEachFeature={(feature, layer) => {
            if (feature.properties && feature.properties.COUNTY_NAM) {
              layer.bindPopup(`<strong>${feature.properties.COUNTY_NAM}</strong>`);
            }
          }}
        />

        {/* Constituencies Layer - Load on demand */}
        <GeoJSON
          data={geoJsonData.constituencies}
          style={constituencyStyle}
          onEachFeature={(feature, layer) => {
            if (feature.properties && feature.properties.CONSTITUEN) {
              layer.bindPopup(`<strong>${feature.properties.CONSTITUEN}</strong><br/>County: ${feature.properties.COUNTY_NAM}`);
            }
          }}
        />

        {/* Wards Layer - Load on demand */}
        <GeoJSON
          data={geoJsonData.wards}
          style={wardStyle}
          onEachFeature={(feature, layer) => {
            if (feature.properties && feature.properties.NAME) {
              layer.bindPopup(`<strong>${feature.properties.NAME}</strong>`);
            }
          }}
        />

        {/* Registration Centers - Optimized rendering */}
        {filteredCenters.map((center) => (
          <Marker
            key={center.id}
            position={[center.latitude, center.longitude]}
            icon={centerIcon}
            title={center.name}
          >
            <Popup>
              <div className="p-3 max-w-sm">
                <h3 className="font-semibold text-gray-900 text-base mb-1">{center.name}</h3>
                <p className="text-sm text-gray-600 mb-1">{center.location}</p>
                <p className="text-sm text-blue-600 mb-2">{center.county}</p>
                {center.description && (
                  <p className="text-xs text-gray-500">{center.description}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Show limited polling stations for context (optional) */}
        {geoJsonData.pollingStations && (
          <MarkerCluster
            pollingStations={geoJsonData.pollingStations}
            visibleFeatures={geoJsonData.pollingStations.features?.slice(0, 500)} // Limit for performance
          />
        )}
      </MapContainer>
    </div>
  );
};

export default MapView;
