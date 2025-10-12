import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, Plus, ArrowLeft, MapPin, Search, ChevronDown } from 'lucide-react';
import { squadAPI, centerAPI } from '../api';
import { Button, Input, Card, Alert } from '../components/ui';

const CreateSquad = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    county: '',
    goal_count: '',
    is_public: true,
    voter_registration_date: '',
    registration_center: '',
  });
  const [error, setError] = useState('');
  const [showCenterDropdown, setShowCenterDropdown] = useState(false);
  const [centerSearchTerm, setCenterSearchTerm] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCenterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch polling stations data which contains registration centers
  const { data: pollingStations = { features: [] }, isLoading: centersLoading, error: centersError } = useQuery({
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
        feature.properties?.name &&
        feature.geometry.coordinates[0] !== 0.0 &&
        feature.geometry.coordinates[1] !== 0.0
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

  // Filter centers based on search term
  const filteredCenters = useMemo(() => {
    if (!centerSearchTerm.trim()) return centers;

    const searchTerm = centerSearchTerm.toLowerCase().trim();
    return centers.filter(center =>
      center.name.toLowerCase().includes(searchTerm) ||
      center.location.toLowerCase().includes(searchTerm) ||
      center.county.toLowerCase().includes(searchTerm) ||
      center.constituency.toLowerCase().includes(searchTerm)
    );
  }, [centers, centerSearchTerm]);

  const createSquadMutation = useMutation({
    mutationFn: (data) => squadAPI.createSquad(data),
    onSuccess: (data) => {
      console.log('Squad created successfully:', data);
      setError('');
      // Invalidate squads queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['user-squads'] });
      queryClient.invalidateQueries({ queryKey: ['squads'] });
      // Navigate to the squads list
      navigate('/squad');
    },
    onError: (error) => {
      console.error('Squad creation failed:', error);
      setError(error.response?.data?.message || 'Failed to create squad');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim() || !formData.county.trim() || !formData.voter_registration_date.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    const submitData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      county: formData.county.trim(),
      goal_count: formData.goal_count ? parseInt(formData.goal_count) : 0,
      is_public: formData.is_public,
      voter_registration_date: formData.voter_registration_date || null,
      ...(formData.registration_center && formData.registration_center !== '' && { registration_center: formData.registration_center }),
    };

    console.log('Submitting squad data:', submitData);
    createSquadMutation.mutate(submitData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const kenyaCounties = [
    'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu',
    'Garissa', 'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega', 'Kericho',
    'Kiambu', 'Kilifi', 'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui',
    'Kwale', 'Laikipia', 'Lamu', 'Machakos', 'Makueni', 'Mandera',
    'Marsabit', 'Meru', 'Migori', 'Mombasa', 'Murang\'a', 'Nairobi',
    'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua', 'Nyeri',
    'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River', 'Tharaka-Nithi',
    'Trans Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot'
  ];

  const handleCenterSelect = (center) => {
    setFormData(prev => ({ ...prev, registration_center: center.id }));
    setCenterSearchTerm(center.name);
    setShowCenterDropdown(false);
  };

  const selectedCenter = centers.find(center => center.id === formData.registration_center);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Plus className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Squad</h1>
          <p className="text-gray-600">Start your own group and lead the movement</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6">
            {error && (
              <Alert
                type="error"
                message={error}
                onDismiss={() => setError('')}
                dismissible
                className="mb-6"
              />
            )}

            {centersError && (
              <Alert
                type="warning"
                message="Unable to load registration centers. You can still create a squad without selecting a center."
                onDismiss={() => {}}
                className="mb-6"
              />
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Input
                  id="name"
                  label="Squad Name *"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Enter your squad name"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Describe your squad's mission and goals..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  required
                />
              </div>

              <div>
                <Input
                  id="voter_registration_date"
                  label="Voter Registration Date *"
                  type="date"
                  value={formData.voter_registration_date}
                  onChange={(e) => handleChange('voter_registration_date', e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Set the date when squad members should register to vote.
                </p>
              </div>

              <div>
                <label htmlFor="registration_center" className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Center (Optional)
                </label>

                {/* Autocomplete input for centers */}
                <div className="relative" ref={dropdownRef}>
                  <div className="relative">
                    <input
                      type="text"
                      value={centerSearchTerm}
                      onChange={(e) => {
                        setCenterSearchTerm(e.target.value);
                        setShowCenterDropdown(true);
                      }}
                      onFocus={() => setShowCenterDropdown(true)}
                      placeholder="Search and select a registration center..."
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={centersLoading || centersError}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>

                  {/* Dropdown with filtered results */}
                  {showCenterDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {centersLoading ? (
                        <div className="px-3 py-2 text-sm text-gray-500">Loading centers...</div>
                      ) : filteredCenters.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">
                          {centerSearchTerm ? 'No centers found' : 'Start typing to search centers...'}
                        </div>
                      ) : (
                        filteredCenters.slice(0, 10).map(center => (
                          <button
                            key={center.id}
                            type="button"
                            onClick={() => handleCenterSelect(center)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">{center.name}</div>
                            <div className="text-xs text-gray-500">
                              {center.location}, {center.county}
                              {center.constituency && ` • ${center.constituency}`}
                            </div>
                          </button>
                        ))
                      )}
                      {filteredCenters.length > 10 && (
                        <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-100">
                          Showing first 10 results. Type more to filter further.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Selected center display */}
                  {selectedCenter && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center text-sm">
                        <MapPin className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="font-medium text-gray-900">{selectedCenter.name}</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {selectedCenter.location}, {selectedCenter.county}
                        {selectedCenter.constituency && ` • ${selectedCenter.constituency}`}
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-500 mt-1">
                  Associate your squad with a specific registration center that includes County, Constituency, Ward, and Polling Station information to make it a complete squad.
                </p>
              </div>

              <div>
                <Input
                  id="goal_count"
                  label="Maximum Members (Optional)"
                  type="number"
                  value={formData.goal_count}
                  onChange={(e) => handleChange('goal_count', e.target.value)}
                  placeholder="Maximum number of squad members"
                  min="2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Set the maximum number of members for your squad. Leave empty for unlimited members.
                </p>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_public}
                    onChange={(e) => handleChange('is_public', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    Make squad public (visible to everyone)
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Public squads can be joined by anyone. Private squads are invite-only.
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate('/join-squad')}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  type="submit"
                  loading={createSquadMutation.isPending}
                  disabled={createSquadMutation.isPending}
                  className="flex-1"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Create Squad
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-2">Tips for Creating a Great Squad</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Choose a clear, memorable name that represents your group's mission</li>
              <li>• Write a compelling description that explains your goals and values</li>
              <li>• Select your county to connect with people in your area</li>
              <li>• Associate with a registration center to make your squad complete</li>
              <li>• Set a maximum member limit to keep your squad manageable</li>
            </ul>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateSquad;