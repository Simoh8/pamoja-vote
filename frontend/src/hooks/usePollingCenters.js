import { useQuery } from "@tanstack/react-query";

/**
 * Custom hook to fetch and transform polling stations into registration centers.
 */
export const usePollingCenters = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["polling-stations"],
    queryFn: async () => {
      const response = await fetch("/polling_stations.geojson");
      if (!response.ok) {
        throw new Error("Failed to load polling stations data");
      }
      return await response.json();
    },
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  const transformToCenters = (stations) => {
    if (!stations?.features?.length) return [];
    return stations.features
      .filter(
        (feature) =>
          feature.geometry &&
          feature.geometry.coordinates &&
          feature.properties?.name &&
          feature.geometry.coordinates[0] !== 0.0 &&
          feature.geometry.coordinates[1] !== 0.0
      )
      .map((feature, index) => ({
        id: `center-${index}`,
        name: feature.properties.name,
        location: feature.properties.ward || "Unknown Location",
        county: feature.properties.county,
        constituency: feature.properties.constituen,
        latitude: feature.geometry.coordinates[1],
        longitude: feature.geometry.coordinates[0],
        description: `Registration center in ${
          feature.properties.ward || "Unknown"
        }, ${feature.properties.county}`,
      }));
  };

  const centers = transformToCenters(data);

  return { centers, isLoading, error };
};
