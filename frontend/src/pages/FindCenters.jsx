import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Phone, Search, Filter } from 'lucide-react';
import { centerAPI } from '../api';
import { Button, Input, Card, Alert } from '../components/ui';

const FindCenters = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCounty, setSelectedCounty] = useState('');
  const [userLocation, setUserLocation] = useState(null);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
        }
      );
    }
  }, []);

  // Fetch centers
  const { data: centers = [], isLoading } = useQuery({
    queryKey: ['centers', selectedCounty],
    queryFn: () => centerAPI.getCenters(selectedCounty ? { county: selectedCounty } : undefined),
  });

  // Get nearby centers if location available
  const { data: nearbyCenters = [], isLoading: nearbyLoading, error: nearbyError } = useQuery({
    queryKey: ['nearby-centers', userLocation],
    queryFn: () => centerAPI.getNearbyCenters(),
    enabled: !!userLocation,
    retry: (failureCount, error) => {
      // Don't retry on 404 errors (endpoint doesn't exist yet)
      if (error?.response?.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const handleGetNearbyCenters = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          alert('Please enable location access to find nearby centers');
        }
      );
    }
  };

  const filteredCenters = centers.filter(center =>
    center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    center.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    center.county.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const counties = [...new Set(centers.map(center => center.county))];

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Registration Centers</h1>
          <p className="text-gray-600">Locate voter registration spots near you</p>
        </motion.div>

        {/* Location Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1">
                <p className="text-gray-600 text-sm">
                  {userLocation
                    ? `📍 Location detected - finding centers near you`
                    : `📍 Enable location to find centers near you`
                  }
                </p>
              </div>
              <Button
                onClick={handleGetNearbyCenters}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Navigation className="h-4 w-4" />
                <span>{userLocation ? 'Update Location' : 'Use My Location'}</span>
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
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

        {/* Nearby Centers Section */}
        {userLocation && !nearbyError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            {nearbyLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600 text-sm">Finding centers near you...</p>
              </div>
            ) : nearbyCenters.length > 0 ? (
              <>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">🏠 Centers Near You</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {nearbyCenters.map((center) => (
                    <Card key={center.id} className="border-l-4 border-l-green-500">
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{center.name}</h3>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            Near You
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2" />
                            {center.location}, {center.county}
                          </div>
                          {center.phone && (
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-2" />
                              {center.phone}
                            </div>
                          )}
                          {center.hours && (
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2" />
                              {center.hours}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <Card className="p-6 text-center bg-blue-50 border-blue-200">
                <MapPin className="h-12 w-12 text-blue-400 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Location-Based Search Coming Soon!</h3>
                <p className="text-sm text-gray-600">
                  We're working on adding location-based center search. For now, browse all centers below.
                </p>
              </Card>
            )}
          </motion.div>
        )}

        {/* All Centers */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📍 All Registration Centers
          </h2>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading centers...</p>
            </div>
          ) : filteredCenters.length === 0 ? (
            <Card className="p-8 text-center">
              <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No centers found</h3>
              <p className="text-gray-600">
                {searchTerm || selectedCounty
                  ? 'Try adjusting your search or filter criteria'
                  : 'No registration centers available at the moment'
                }
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCenters.map((center) => (
                <motion.div
                  key={center.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">{center.name}</h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          {center.location}, {center.county}
                        </div>
                        {center.phone && (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2" />
                            {center.phone}
                          </div>
                        )}
                        {center.hours && (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            {center.hours}
                          </div>
                        )}
                      </div>
                      {center.description && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {center.description}
                        </p>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default FindCenters;
