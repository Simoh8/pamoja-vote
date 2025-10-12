import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MapPin, Search, Filter } from 'lucide-react';
import { Button, Input, Card, Alert } from '../components/ui';
import MapView from '../components/MapView';

const Centers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCounty, setSelectedCounty] = useState('');

  // Fetch polling stations data which contains registration centers
  const { data: pollingStations = { features: [] }, isLoading, error } = useQuery({
    queryKey: ['polling-stations'],
    queryFn: async () => {
      const response = await fetch('/polling_stations.geojson');
      if (!response.ok) {
        throw new Error('Failed to load polling stations data');
      }
      return await response.json();
    },
    retry: 3,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Transform polling stations to registration centers format
  const transformToCenters = (stations) => {
    return stations.features
      .filter(feature =>
        feature.geometry &&
        feature.geometry.coordinates &&
        feature.properties?.name
      )
      .map((feature, index) => ({
        id: `center-${index}`,
        name: feature.properties.name,
        location: feature.properties.ward || 'Unknown Location',
        county: feature.properties.county,
        constituency: feature.properties.constituen,
        latitude: feature.geometry.coordinates[1],
        longitude: feature.geometry.coordinates[0],
        phone: null, // No phone data in polling stations
        hours: null, // No hours data in polling stations
        description: `Registration center in ${feature.properties.ward || 'Unknown'}, ${feature.properties.county}`,
      }));
  };

  const centers = transformToCenters(pollingStations);

  // Ensure centers is always an array
  const centersArray = Array.isArray(centers) ? centers : [];

  const filteredCenters = useMemo(() => {
    const trimmedSearchTerm = searchTerm.trim().toLowerCase();

    return centersArray.filter(center => {
      const matchesSearch = trimmedSearchTerm === '' ||
        center?.name?.toLowerCase().includes(trimmedSearchTerm) ||
        center?.location?.toLowerCase().includes(trimmedSearchTerm) ||
        center?.county?.toLowerCase().includes(trimmedSearchTerm) ||
        center?.constituency?.toLowerCase().includes(trimmedSearchTerm);

      const matchesCounty = selectedCounty === '' || center?.county === selectedCounty;

      return matchesSearch && matchesCounty;
    });
  }, [centersArray, searchTerm, selectedCounty]);

  const counties = [...new Set(centersArray.map(center => center?.county).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Registration Centers</h1>
          <p className="text-gray-600">Interactive map showing voter registration centers across Kenya</p>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Alert variant="destructive">
              <Alert.Title>Unable to Load Centers</Alert.Title>
              <Alert.Description>
                We're having trouble loading registration centers. Please check your connection or try again later.
              </Alert.Description>
            </Alert>
          </motion.div>
        )}

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search centers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  startIcon={Search}
                />
              </div>
              <div className="md:w-48">
                <select
                  value={selectedCounty}
                  onChange={(e) => setSelectedCounty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Counties</option>
                  {counties.map(county => (
                    <option key={county} value={county}>{county}</option>
                  ))}
                </select>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'list'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="h-4 w-4" />
              <span>List View</span>
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'map'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Map className="h-4 w-4" />
              <span>Map View</span>
            </button>
          </div>
        </motion.div>

        {/* Map View - Full Width */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">🗺️ Interactive Kenya Election Map</h2>
              <p className="text-gray-600 text-sm">
                Click on counties, constituencies, wards, and polling stations to explore election data
              </p>
            </div>
            <MapView centers={filteredCenters} />
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Centers;
