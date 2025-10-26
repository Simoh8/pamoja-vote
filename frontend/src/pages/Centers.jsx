import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MapPin, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-3 sm:p-4 border-x border-gray-200/50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 sm:mb-8 border-b border-gray-200/50 pb-4 sm:pb-6"
        >
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 border-2 border-white shadow-lg">
            <MapPin className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Registration Centers</h1>
          <p className="text-gray-600 text-sm sm:text-base">Interactive map showing voter registration centers across Kenya</p>
          {totalCount > 0 && (
            <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">
              Showing {centers.length} of {totalCount} centers
            </p>
          )}
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 sm:mb-6 border border-red-200 rounded-lg"
          >
            <Alert variant="destructive" className="border-0">
              <Alert.Title className="text-sm sm:text-base">Unable to Load Centers</Alert.Title>
              <Alert.Description className="text-xs sm:text-sm">
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
          className="mb-4 sm:mb-6 border border-gray-200/50 rounded-lg"
        >
          <Card className="p-4 sm:p-6 border-0">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search centers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  startIcon={Search}
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="sm:w-40">
                <select
                  value={selectedCounty}
                  onChange={(e) => setSelectedCounty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
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
            className="mb-4 sm:mb-6 p-3 sm:p-4 bg-white border border-gray-200 rounded-lg"
          >
            <div className="flex flex-col xs:flex-row items-center justify-between gap-3">
              <div className="text-xs sm:text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>

              <div className="flex items-center space-x-1 sm:space-x-2">
                <Button
                  onClick={loadPreviousPage}
                  disabled={!hasPreviousPage || isLoading}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Prev
                </Button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                    const pageNumber = Math.max(1, Math.min(totalPages - 2, currentPage - 1)) + i;
                    return (
                      <Button
                        key={pageNumber}
                        onClick={() => goToPage(pageNumber - 1)}
                        variant={pageNumber === currentPage ? "default" : "outline"}
                        size="sm"
                        className="w-7 h-7 sm:w-8 sm:h-8 p-0 text-xs"
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
                  className="text-xs"
                >
                  Next
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Map View - Full Width */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="border border-gray-200/50 rounded-lg overflow-hidden"
        >
          <Card className="p-4 sm:p-6 border-0">
            <div className="mb-3 sm:mb-4 border-b border-gray-200/50 pb-3 sm:pb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">🗺️ Interactive Kenya Election Map</h2>
              <p className="text-gray-600 text-xs sm:text-sm">
                Click on counties, constituencies, wards, and polling stations to explore election data
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <MapView centers={centers} maxMarkers={200} />
            </div>
          </Card>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 sm:mt-6 text-center p-4 border border-gray-200/50 rounded-lg bg-white/50"
          >
            <div className="inline-flex items-center space-x-2 text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">Loading centers...</span>
            </div>
          </motion.div>
        )}

        {/* Footer Border */}
        <div className="mt-6 sm:mt-8 border-t border-gray-200/50 pt-4 sm:pt-6">
          <p className="text-center text-xs sm:text-sm text-gray-500">
            Kenya Voter Registration Centers • Updated regularly
          </p>
        </div>
      </div>
    </div>
  );
};

export default Centers;