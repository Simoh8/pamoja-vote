import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Phone, Search, Filter, Clock, Map, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { centerAPI } from '../api';
import { Button, Input, Card, Alert } from '../components/ui';
import MapView from '../components/MapView';

const FindCenters = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCounty, setSelectedCounty] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [activeTab, setActiveTab] = useState('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8); // Reduced from 12 for mobile

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
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
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
        phone: null,
        hours: null,
        description: `Registration center in ${feature.properties.ward || 'Unknown'}, ${feature.properties.county}`,
      }));
  };

  const centers = transformToCenters(pollingStations);

  // Get nearby centers if location available
  const { data: nearbyCenters = [], isLoading: nearbyLoading, error: nearbyError } = useQuery({
    queryKey: ['nearby-centers', userLocation],
    queryFn: () => centerAPI.getNearbyCenters(),
    enabled: !!userLocation,
    retry: (failureCount, error) => {
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

  // Ensure centers is always an array
  const centersArray = Array.isArray(centers) ? centers : [];

  const filteredCenters = useMemo(() => {
    const trimmedSearchTerm = searchTerm.trim().toLowerCase();

    const filtered = centersArray.filter(center => {
      if (!center) return false;

      const trimmedSearch = trimmedSearchTerm.toLowerCase();

      const searchFields = [
        center?.name,
        center?.location,
        center?.county,
        center?.constituency,
        center?.description
      ].filter(Boolean);

      const directMatches = searchFields.some(field =>
        field.toLowerCase().includes(trimmedSearch)
      );

      const partialMatches = searchFields.some(field =>
        field.toLowerCase().split(/\s+/).some(word =>
          word.startsWith(trimmedSearch) ||
          trimmedSearch.startsWith(word.slice(0, Math.min(3, word.length))) ||
          (trimmedSearch.length >= 3 && word.includes(trimmedSearch.slice(0, 3)))
        )
      );

      const jsonMatch = JSON.stringify(center).toLowerCase().includes(trimmedSearch);

      const result = directMatches || partialMatches || (trimmedSearch.length >= 3 && jsonMatch);

      const matchesCounty = selectedCounty === '' || center?.county === selectedCounty;

      return (directMatches || partialMatches || (trimmedSearch.length >= 3 && jsonMatch)) && matchesCounty;
    });

    return filtered;
  }, [centersArray, searchTerm, selectedCounty]);

  const counties = [...new Set(centersArray.map(center => center?.county).filter(Boolean))];

  // Pagination logic
  const totalPages = Math.ceil(filteredCenters.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCenters = filteredCenters.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCounty]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-3 sm:p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 sm:mb-8"
        >
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <MapPin className="h-5 w-5 sm:h-8 sm:w-8 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Find Registration Centers</h1>
          <p className="text-xs sm:text-sm text-gray-600">Locate voter registration spots near you</p>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 sm:mb-6"
          >
            <Alert variant="destructive">
              <Alert.Title className="text-sm">Unable to Load Centers</Alert.Title>
              <Alert.Description className="text-xs">
                We're having trouble loading registration centers. Please check your connection or try again later.
              </Alert.Description>
            </Alert>
          </motion.div>
        )}

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-4 sm:mb-6"
        >
          <Card className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search centers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  startIcon={Search}
                  className="text-sm"
                />
              </div>
              <div className="sm:w-40 md:w-48">
                <select
                  value={selectedCounty}
                  onChange={(e) => setSelectedCounty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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

        {/* Search Debug Info */}
        {searchTerm.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 p-2 sm:p-3 bg-gray-50 border border-gray-200 rounded-lg"
          >
            <p className="text-xs sm:text-sm text-gray-600">
              🔍 Found {filteredCenters.length} centers for "{searchTerm}"
              {selectedCounty && ` in ${selectedCounty} county`}
            </p>
          </motion.div>
        )}

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-4 sm:mb-6"
        >
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center space-x-1 sm:space-x-2 px-3 py-2 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all flex-1 sm:flex-none justify-center ${
                activeTab === 'list'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>List</span>
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center space-x-1 sm:space-x-2 px-3 py-2 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all flex-1 sm:flex-none justify-center ${
                activeTab === 'map'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Map className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Map</span>
            </button>
          </div>
        </motion.div>

        {/* Nearby Centers Section */}
        {userLocation && !nearbyError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6 sm:mb-8"
          >
            {nearbyLoading ? (
              <div className="text-center py-6 sm:py-8">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600 text-xs sm:text-sm">Finding centers near you...</p>
              </div>
            ) : nearbyCenters.length > 0 ? (
              <>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">🏠 Centers Near You</h2>
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {nearbyCenters.map((center) => (
                    <Card key={center.id} className="border-l-4 border-l-green-500">
                      <div className="p-3 sm:p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{center.name}</h3>
                          <span className="text-xs bg-green-100 text-green-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded flex-shrink-0 ml-2">
                            Near You
                          </span>
                        </div>
                        <div className="space-y-1 text-xs sm:text-sm text-gray-600">
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                            <span className="truncate">{center.location}, {center.county}</span>
                          </div>
                          {center.phone && (
                            <div className="flex items-center">
                              <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                              {center.phone}
                            </div>
                          )}
                          {center.hours && (
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
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
              <Card className="p-4 sm:p-6 text-center bg-blue-50 border-blue-200">
                <MapPin className="h-8 w-8 sm:h-12 sm:w-12 text-blue-400 mx-auto mb-2 sm:mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Location-Based Search Coming Soon!</h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  We're working on adding location-based center search. For now, browse all centers below.
                </p>
              </Card>
            )}
          </motion.div>
        )}

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {activeTab === 'list' ? (
            /* Centers List */
            <>
              {isLoading ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-3 sm:mb-4"></div>
                  <p className="text-gray-600 text-sm">Loading centers...</p>
                </div>
              ) : filteredCenters.length === 0 ? (
                <Card className="p-6 sm:p-8 text-center">
                  <MapPin className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">
                    {error ? 'Unable to load centers' : 'No centers found'}
                  </h3>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    {searchTerm || selectedCounty
                      ? `No centers found for "${searchTerm}" in ${selectedCounty ? `${selectedCounty} county` : 'all counties'}. Try a different search term or check your spelling.`
                      : error
                        ? 'Please check your connection and try again'
                        : centersArray.length === 0
                          ? 'No registration centers are available. Please contact support.'
                          : 'No registration centers are currently available that match your criteria'
                    }
                  </p>
                  {centersArray.length > 0 && (searchTerm || selectedCounty) && (
                    <p className="text-xs text-gray-500 mt-2">
                      Total centers available: {centersArray.length} | Current filters: {searchTerm ? `Search: "${searchTerm}"` : 'No search'} {selectedCounty ? `| County: ${selectedCounty}` : ''}
                    </p>
                  )}
                </Card>
              ) : (
                <>
                  <div className="mb-3 sm:mb-4 flex items-center justify-between">
                    <p className="text-xs sm:text-sm text-gray-600">
                      Showing {startIndex + 1}-{Math.min(endIndex, filteredCenters.length)} of {filteredCenters.length} centers
                    </p>
                  </div>

                  <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {paginatedCenters.map((center) => (
                      <motion.div
                        key={center.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card>
                          <div className="p-3 sm:p-4">
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1 sm:mb-2 line-clamp-2">{center.name}</h3>
                            <div className="space-y-1 text-xs sm:text-sm text-gray-600">
                              <div className="flex items-center">
                                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                                <span className="truncate">{center.location}, {center.county}</span>
                              </div>
                              {center.phone && (
                                <div className="flex items-center">
                                  <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                                  {center.phone}
                                </div>
                              )}
                              {center.hours && (
                                <div className="flex items-center">
                                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                                  {center.hours}
                                </div>
                              )}
                            </div>
                            {center.description && (
                              <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2 line-clamp-2">
                                {center.description}
                              </p>
                            )}
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-6 sm:mt-8 flex items-center justify-center space-x-1 sm:space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="text-xs px-2 sm:px-3"
                      >
                        <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Previous</span>
                        <span className="sm:hidden">Prev</span>
                      </Button>

                      <div className="flex space-x-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(page =>
                            page === 1 ||
                            page === totalPages ||
                            Math.abs(page - currentPage) <= 1 // Show fewer pages on mobile
                          )
                          .map((page, index, array) => {
                            if (index > 0 && page - array[index - 1] > 1) {
                              return [
                                <span key={`ellipsis-${page}`} className="px-1 sm:px-2 text-gray-500 text-xs">...</span>,
                                <Button
                                  key={page}
                                  variant={currentPage === page ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handlePageChange(page)}
                                  className="min-w-[2rem] sm:min-w-[2.5rem] text-xs"
                                >
                                  {page}
                                </Button>
                              ];
                            }
                            return (
                              <Button
                                key={page}
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(page)}
                                className="min-w-[2rem] sm:min-w-[2.5rem] text-xs"
                              >
                                {page}
                              </Button>
                            );
                          })}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="text-xs px-2 sm:px-3"
                      >
                        <span className="hidden sm:inline">Next</span>
                        <span className="sm:hidden">Next</span>
                        <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            /* Map View */
            <Card className="p-4 sm:p-6">
              <div className="mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">🗺️ Interactive Kenya Election Map</h2>
                <p className="text-gray-600 text-xs sm:text-sm">
                  Click on counties, constituencies, wards, and polling stations to explore election data
                </p>
              </div>
              {isLoading ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-3 sm:mb-4"></div>
                  <p className="text-gray-600 text-sm">Loading map...</p>
                </div>
              ) : filteredCenters.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <Map className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">No centers to display on map</h3>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    {searchTerm || selectedCounty
                      ? `No centers found for "${searchTerm}" in ${selectedCounty ? `${selectedCounty} county` : 'all counties'}. Try a different search term or check your spelling.`
                      : error
                        ? 'Please check your connection and try again'
                        : centersArray.length === 0
                          ? 'No registration centers are available. Please contact support.'
                          : 'No registration centers are currently available that match your criteria'
                    }
                  </p>
                </div>
              ) : (
                <div className="h-[400px] sm:h-[500px] md:h-[600px]">
                  <MapView centers={filteredCenters} />
                </div>
              )}
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default FindCenters;