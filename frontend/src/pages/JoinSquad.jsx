import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, MapPin, UserPlus, Search, Filter, Calendar, Plus } from 'lucide-react';
import { squadAPI } from '../api';
import { Button, Input, Card, Alert } from '../components/ui';

const JoinSquad = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCounty, setSelectedCounty] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Refresh squads data when component mounts
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['squads'] });
  }, [queryClient]);

  // Check user's current membership
  const { data: userMembership } = useQuery({
    queryKey: ['user-membership'],
    queryFn: () => squadAPI.getMyMembership(),
  });

  const hasJoinedSquad = userMembership && userMembership.id;

  // Query for user's squads if they have any, or all squads if they don't
  const { data: squadsResponse, isLoading, error: squadsError, refetch } = useQuery({
    queryKey: hasJoinedSquad ? ['user-squads'] : ['squads', selectedCounty],
    queryFn: hasJoinedSquad ? () => squadAPI.getMySquads() : () => squadAPI.getSquads(selectedCounty ? { county: selectedCounty } : undefined),
  });

  // Safely extract squads array from response
  const squads = Array.isArray(squadsResponse) ? squadsResponse : 
                 squadsResponse?.results ? squadsResponse.results : [];

  // Join squad mutation
  const joinSquadMutation = useMutation({
    mutationFn: (squadId) => squadAPI.joinSquad(squadId),
    onSuccess: () => {
      setError('');
      refetch(); // Refresh squads list
      queryClient.invalidateQueries({ queryKey: ['user-membership'] }); // Refresh user membership
    },
    onError: (error) => {
      setError(error.response?.data?.message || 'Failed to join squad');
    },
  });

  const isAlreadyInSquad = userMembership && userMembership.id;

  // Leave squad mutation
  const leaveSquadMutation = useMutation({
    mutationFn: (squadId) => squadAPI.leaveSquad(squadId),
    onSuccess: () => {
      setError('');
      queryClient.invalidateQueries({ queryKey: ['squads'] });
      queryClient.invalidateQueries({ queryKey: ['user-membership'] });
    },
    onError: (error) => {
      setError(error.response?.data?.message || 'Failed to leave squad');
    },
  });

  const handleLeaveSquad = (squadId) => {
    if (confirm('Are you sure you want to leave this squad?')) {
      leaveSquadMutation.mutate(squadId);
    }
  };

  const handleJoinSquad = (squadId) => {
    if (isAlreadyInSquad && userMembership?.squad?.id !== squadId) {
      setError('You are already a member of another squad. Leave your current squad first.');
      return;
    }
    joinSquadMutation.mutate(squadId);
  };

  const filteredSquads = squads.filter(squad =>
    squad.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    squad.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const counties = squadsError ? [] : [...new Set(squads.map(squad => squad.county))];

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
            <Users className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join a Squad</h1>
          <p className="text-gray-600">Team up with friends and make your voice count together</p>
        </motion.div>

        {error && (
          <Alert
            type="error"
            message={error}
            onDismiss={() => setError('')}
            dismissible
            className="mb-6"
          />
        )}

        {squadsError && (
          <Alert
            type="warning"
            message="Unable to load squads. Please try again later."
            onDismiss={() => {}}
            className="mb-6"
          />
        )}

        {/* Current Squad Section */}
        {isAlreadyInSquad && userMembership?.squad && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="p-6 bg-green-50 border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-900">
                      You're in: {userMembership.squad.name}
                    </h3>
                    <p className="text-sm text-green-700">
                      {userMembership.squad.county} • {userMembership.role}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => navigate('/squad')}
                    variant="outline"
                    size="sm"
                    className="border-green-300 text-green-700 hover:bg-green-100"
                  >
                    View Squad
                  </Button>
                  <Button
                    onClick={() => handleLeaveSquad(userMembership.squad.id)}
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-700 hover:bg-red-100"
                    loading={leaveSquadMutation.isPending}
                    disabled={leaveSquadMutation.isPending}
                  >
                    Leave Squad
                  </Button>
                </div>
              </div>
            </Card>
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
                  placeholder="Search squads..."
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
                  disabled={squadsError}
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

        {/* Squads List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading squads...</p>
            </div>
          ) : filteredSquads.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {hasJoinedSquad ? 'No squads found' : 'No squads found'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || selectedCounty
                  ? 'Try adjusting your search or filter criteria'
                  : hasJoinedSquad
                    ? 'You\'re not a member of any squads in this area.'
                    : 'Be the first to create a squad in your area!'
                }
              </p>
              <Button onClick={() => navigate('/squad/create')}>
                Create Squad
              </Button>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredSquads.map((squad) => (
                <motion.div
                  key={squad.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="h-full flex flex-col">
                    <div className="p-6 flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{squad.name}</h3>
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="h-4 w-4 mr-1" />
                              {squad.county}
                            </div>
                          </div>
                        </div>
                        {isAlreadyInSquad && userMembership?.squad?.id === squad.id && (
                          <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                            Your Squad
                          </div>
                        )}
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {squad.description}
                      </p>

                      {squad.registration_center && (
                        <div className="mb-3 p-2 bg-blue-50 rounded-lg">
                          <div className="flex items-center text-sm text-blue-800">
                            <MapPin className="h-4 w-4 mr-2" />
                            <span className="font-medium">Registration Center:</span>
                          </div>
                          <div className="text-sm text-blue-700 ml-6">
                            <div className="font-medium">{squad.registration_center.name}</div>
                            <div>{squad.registration_center.location || squad.registration_center.address}, {squad.registration_center.county}</div>
                            {squad.registration_center.constituency && (
                              <div className="text-blue-600">Constituency: {squad.registration_center.constituency}</div>
                            )}
                            {squad.registration_center.ward && (
                              <div className="text-blue-600">Ward: {squad.registration_center.ward}</div>
                            )}
                            {squad.registration_center.polling_station_name && (
                              <div className="text-green-600">Polling Station: {squad.registration_center.polling_station_name}</div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <span>{squad.member_count || 0} members</span>
                        <span>
                          {squad.goal_count 
                            ? `${squad.remaining_slots || 0} slots remaining`
                            : 'No limit'
                          }
                        </span>
                      </div>

                      {squad.voter_registration_date && (
                        <div className="mb-3 p-2 bg-green-50 rounded-lg">
                          <div className="flex items-center text-sm text-green-800">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span className="font-medium">Registration Date:</span>
                          </div>
                          <div className="text-sm text-green-700 ml-6">
                            {new Date(squad.voter_registration_date).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-6 pt-0">
                      <Button
                        onClick={() => handleJoinSquad(squad.id)}
                        loading={joinSquadMutation.isPending}
                        disabled={joinSquadMutation.isPending || (isAlreadyInSquad && userMembership?.squad?.id !== squad.id)}
                        className="w-full"
                        variant={(isAlreadyInSquad && userMembership?.squad?.id === squad.id) ? "secondary" : "default"}
                      >
                        {isAlreadyInSquad && userMembership?.squad?.id === squad.id ? (
                          <>
                            <Users className="h-4 w-4 mr-2" />
                            Already a Member
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Join Squad
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Create Squad CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <Card className="p-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Plus className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Don't see your squad?</h3>
              <p className="text-gray-600 mb-6 text-lg">Create your own squad and lead the movement!</p>
              <Button
                onClick={() => navigate('/squad/create')}
                variant="outline"
                size="lg"
                className="bg-white hover:bg-blue-50 border-2 border-blue-200 hover:border-blue-300 text-blue-700 hover:text-blue-800 font-semibold px-8 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Squad
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default JoinSquad;
