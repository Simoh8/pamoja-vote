import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";

/**
 * Custom hook to fetch and transform polling stations into registration centers with pagination support.
 */
export const usePollingCenters = (options = {}) => {
  const {
    pageSize = 50, // Load in chunks of 50
    enablePagination = false,
    searchTerm = '',
    selectedCounty = '',
  } = options;

  const [currentChunk, setCurrentChunk] = useState(0);

  // Main query to load polling stations data
  const { data: rawData, isLoading, error, isError } = useQuery({
    queryKey: ["polling-stations"],
    queryFn: async () => {
      try {
        const response = await fetch("/polling_stations.geojson");
        if (!response.ok) {
          throw new Error(`Failed to load polling stations data: ${response.status}`);
        }
        const data = await response.json();
        return data;
      } catch (err) {
        console.error("Error loading polling stations:", err);
        throw err;
      }
    },
    retry: (failureCount, error) => {
      // Don't retry on 404 errors (file doesn't exist)
      if (error?.message?.includes('404')) {
        return false;
      }
      return failureCount < 3;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - polling data doesn't change often
    cacheTime: 30 * 60 * 1000, // 30 minutes cache
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
  });

  // Transform polling stations to registration centers format with pagination
  const transformToCenters = (stations, startIndex = 0, chunkSize = pageSize) => {
    if (!stations?.features?.length) return { centers: [], totalCount: 0 };

    const features = stations.features.filter(
      (feature) =>
        feature.geometry &&
        feature.geometry.coordinates &&
        feature.properties?.name &&
        feature.geometry.coordinates[0] !== 0.0 &&
        feature.geometry.coordinates[1] !== 0.0
    );

    // Apply search and county filters if provided
    let filteredFeatures = features;

    if (searchTerm || selectedCounty) {
      filteredFeatures = features.filter(feature => {
        const props = feature.properties || {};
        const name = (props.name || '').toLowerCase();
        const location = (props.ward || props.location || '').toLowerCase();
        const county = (props.county || '').toLowerCase();
        const constituency = (props.constituency || props.constituen || '').toLowerCase();

        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = !searchTerm ||
          name.includes(searchLower) ||
          location.includes(searchLower) ||
          constituency.includes(searchLower);

        const matchesCounty = !selectedCounty || county === selectedCounty.toLowerCase();

        return matchesSearch && matchesCounty;
      });
    }

    const totalCount = filteredFeatures.length;
    const start = startIndex * chunkSize;
    const end = start + chunkSize;
    const chunkFeatures = filteredFeatures.slice(start, end);

    const centers = chunkFeatures.map((feature, index) => {
      const props = feature.properties || {};
      const globalIndex = start + index;

      return {
        id: `center-${globalIndex}`,
        name: props.name || 'Unknown Center',
        location: props.ward || props.location || 'Unknown Location',
        county: props.county || 'Unknown County',
        constituency: props.constituency || props.constituen || 'Unknown Constituency',
        latitude: feature.geometry.coordinates[1],
        longitude: feature.geometry.coordinates[0],
        description: `Registration center in ${props.ward || props.location || 'Unknown'}, ${props.county || 'Unknown'}`,
      };
    });

    return { centers, totalCount };
  };

  // Process data with current filters and pagination
  const processedData = useMemo(() => {
    if (!rawData) return { centers: [], totalCount: 0 };

    if (enablePagination) {
      return transformToCenters(rawData, currentChunk, pageSize);
    } else {
      return transformToCenters(rawData);
    }
  }, [rawData, currentChunk, pageSize, searchTerm, selectedCounty, enablePagination]);

  // Calculate pagination info
  const totalPages = Math.ceil(processedData.totalCount / pageSize);
  const hasNextPage = currentChunk < totalPages - 1;
  const hasPreviousPage = currentChunk > 0;

  // Pagination handlers
  const loadNextPage = () => {
    if (hasNextPage) {
      setCurrentChunk(prev => prev + 1);
    }
  };

  const loadPreviousPage = () => {
    if (hasPreviousPage) {
      setCurrentChunk(prev => prev - 1);
    }
  };

  const goToPage = (page) => {
    if (page >= 0 && page < totalPages) {
      setCurrentChunk(page);
    }
  };

  const resetPagination = () => {
    setCurrentChunk(0);
  };

  return {
    centers: processedData.centers,
    totalCount: processedData.totalCount,
    isLoading,
    error,
    isError,
    // Pagination
    currentPage: currentChunk,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    pageSize,
    // Pagination handlers
    loadNextPage,
    loadPreviousPage,
    goToPage,
    resetPagination,
    // Raw data for advanced use cases
    rawData,
  };
};
