import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MapPin, Search, Filter } from 'lucide-react';
import { Button, Input, Card, Alert } from '../components/ui';
import MapView from '../components/MapView';
import { usePollingCenters } from '../hooks/usePollingCenters';

const Centers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCounty, setSelectedCounty] = useState('');

  // Use the improved usePollingCenters hook with pagination
  const {
    centers,
    totalCount,
    isLoading,
    error,
    currentPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    loadNextPage,
    loadPreviousPage,
    goToPage,
    resetPagination,
  } = usePollingCenters({
    enablePagination: true,
    searchTerm,
    selectedCounty,
    pageSize: 50, // Load 50 centers per page
  });

  // Reset pagination when filters change
  useMemo(() => {
    resetPagination();
  }, [searchTerm, selectedCounty, resetPagination]);

  // Get unique counties for filter dropdown
  const counties = useMemo(() => {
    if (!centers || centers.length === 0) return [];
    return [...new Set(centers.map(center => center?.county).filter(Boolean))];
  }, [centers]);

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
          {totalCount > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              Showing {centers.length} of {totalCount} centers
            </p>
          )}
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

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 flex items-center justify-between"
          >
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>

            <div className="flex items-center space-x-2">
              <Button
                onClick={loadPreviousPage}
                disabled={!hasPreviousPage || isLoading}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNumber = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  return (
                    <Button
                      key={pageNumber}
                      onClick={() => goToPage(pageNumber - 1)}
                      variant={pageNumber === currentPage ? "default" : "outline"}
                      size="sm"
                      className="w-8 h-8 p-0"
                      disabled={isLoading}
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
              </div>

              <Button
                onClick={loadNextPage}
                disabled={!hasNextPage || isLoading}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          </motion.div>
        )}

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
            <MapView centers={centers} maxMarkers={200} />
          </Card>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 text-center"
          >
            <div className="inline-flex items-center space-x-2 text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Loading centers...</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Centers;
