import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MapPin, Phone, Clock, Search, Filter } from 'lucide-react';
import { centerAPI } from '../api';
import { Button, Input, Card, Alert } from '../components/ui';

const Centers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCounty, setSelectedCounty] = useState('');

  // Fetch centers
  const { data: centers = [], isLoading } = useQuery({
    queryKey: ['centers', selectedCounty],
    queryFn: () => centerAPI.getCenters(selectedCounty ? { county: selectedCounty } : undefined),
  });

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Registration Centers</h1>
          <p className="text-gray-600">Find voter registration centers across Kenya</p>
        </motion.div>

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

        {/* Centers List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
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
                  <Card className="h-full">
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">{center.name}</h3>
                      <div className="space-y-1 text-sm text-gray-600 mb-3">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          {center.location || center.address}, {center.county}
                        </div>
                        {center.constituency && (
                          <div className="text-blue-600 font-medium">
                            Constituency: {center.constituency}
                          </div>
                        )}
                        {center.ward && (
                          <div className="text-blue-600 font-medium">
                            Ward: {center.ward}
                          </div>
                        )}
                        {center.polling_station_name && (
                          <div className="text-green-600 font-medium">
                            Polling Station: {center.polling_station_name}
                          </div>
                        )}
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
                        <p className="text-sm text-gray-600 line-clamp-2">
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

export default Centers;
