import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, MapPin, UserPlus, Search, Filter, Calendar, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { squadAPI } from '../api';
import { Button, Input, Card, Alert } from '../components/ui';
import SquadCard from '../components/SquadCard';

const JoinSquad = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCounty, setSelectedCounty] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(9); // Show 9 squads per page (3x3 grid)
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Refresh squads data when component mounts
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['squads'] });
    queryClient.invalidateQueries({ queryKey: ['user-membership'] });
  }, [queryClient]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCounty]);

  // Check user's current membership - ENABLED to properly detect user membership
  const { data: userMembership, isLoading: membershipLoading } = useQuery({
    queryKey: ['user-membership'],
    queryFn: () => squadAPI.getMyMembership(),
    enabled: true, // Enable this query to fetch actual membership data
    retry: (failureCount, error) => {
      // Don't retry on 404 (user not a member of any squad)
      if (error?.response?.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const hasJoinedSquad = userMembership && userMembership.id;

  // Query for squads - show user's squads if they have any, or all squads if they don't
  const {
    data: squadsResponse,
    isLoading,
    error: squadsError,
    refetch
  } = useQuery({
    queryKey: hasJoinedSquad ? ['user-squads', selectedCounty, currentPage, searchTerm] : ['squads', selectedCounty, currentPage, searchTerm],
    queryFn: () => {
      const params = {
        page: currentPage,
        page_size: pageSize,
        ...(selectedCounty && { county: selectedCounty }),
        ...(searchTerm && { search: searchTerm }),
      };
      return hasJoinedSquad ? squadAPI.getMySquads() : squadAPI.getSquads(params);
    },
    keepPreviousData: true, // Keep previous data while loading new page
  });

  // Extract squads and pagination info from response
  // Handle different response formats: getMySquads() vs getSquads()
  const squads = hasJoinedSquad
    ? (Array.isArray(squadsResponse) ? squadsResponse : [])
    : (squadsResponse?.results || []);
  const totalCount = hasJoinedSquad ? squads.length : (squadsResponse?.count || 0);
  const totalPages = hasJoinedSquad ? 1 : Math.ceil(totalCount / pageSize); // My squads don't paginate
  const hasNextPage = hasJoinedSquad ? false : (squadsResponse?.next !== null);
  const hasPreviousPage = hasJoinedSquad ? false : (squadsResponse?.previous !== null || currentPage > 1);

  // Join squad mutation
  const joinSquadMutation = useMutation({
    mutationFn: (squadId) => squadAPI.joinSquad(squadId),
    onSuccess: () => {
      setError('');
      refetch(); // Refresh squads list
      queryClient.invalidateQueries({ queryKey: ['user-membership'] }); // Refresh user membership
      queryClient.invalidateQueries({ queryKey: ['squads'] }); // Refresh all squads
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
      queryClient.invalidateQueries({ queryKey: ['user-squads'] });
      refetch(); // Refresh current query
    },
    onError: (error) => {
      setError(error.response?.data?.message || 'Failed to leave squad');
    },
  });

  // Check if user's current squad has future registration date
  const userCurrentSquad = userMembership?.squad;
  const userSquadData = squads.find(squad => squad.id === userCurrentSquad?.id);
  const hasFutureRegistration = userSquadData?.voter_registration_date
    ? new Date(userSquadData.voter_registration_date) > new Date()
    : false;

  // User cannot create squad if they're in an active squad with future registration
  const canCreateSquad = !hasJoinedSquad || !hasFutureRegistration;

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

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
          <div className="flex items-center justify-center space-x-4 mb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              {hasJoinedSquad ? 'The Squadz' : 'Join a Squad'}
            </h1>
            <Button
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['user-membership'] });
                queryClient.invalidateQueries({ queryKey: ['squads'] });
                refetch();
                setError('');
              }}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Refresh
            </Button>
          </div>
          <p className="text-gray-600">
            {hasJoinedSquad
              ? 'Manage your squad and connect with fellow voters'
              : 'Team up with friends and make your voice count together'
            }
          </p>
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
          {isLoading || membershipLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading squads...</p>
            </div>
          ) : filteredSquads.length === 0 ? (
            <div className="relative">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 rounded-3xl blur-3xl transform scale-110"></div>

              <Card className="relative p-8 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 border border-blue-200/50 shadow-xl rounded-2xl text-center overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full translate-y-12 -translate-x-12"></div>

                <div className="relative max-w-md mx-auto">
                  {/* Icon container */}
                  <div className="relative mb-6">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                      <Users className="h-10 w-10 text-white" />
                    </div>
                    {/* Glow effect */}
                    <div className="absolute inset-0 w-20 h-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl mx-auto blur-xl opacity-30 -z-10"></div>
                  </div>

                  {/* Dynamic content based on state */}
                  <div className="space-y-3 mb-6">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {searchTerm || selectedCounty
                        ? 'No squads found'
                        : 'Don\'t see your squad?'}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {searchTerm || selectedCounty
                        ? 'Try adjusting your search or filter criteria to find more squads in your area.'
                        : hasJoinedSquad && hasFutureRegistration
                          ? 'You\'re already part of an active squad. Wait for the registration date or leave your current squad to create a new one.'
                          : 'Ready to make your voice heard? Join a squad and team up with friends to organize voter registration drives and awareness campaigns.'}
                    </p>
                  </div>

                  {/* Enhanced button */}
                  <div className="flex flex-col items-center">
                    {canCreateSquad && (
                      <Button
                        onClick={() => navigate('/squad/create')}
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Create Squad
                      </Button>
                    )}

                    {/* Subtle text below button */}
                    <p className="text-sm text-gray-500 mt-3">
                      {canCreateSquad
                        ? 'Join thousands of leaders making their voices heard'
                        : 'Focus on your current squad or wait for registration to complete'}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredSquads.map((squad) => (
                  <SquadCard
                    key={squad.id}
                    squad={squad}
                    isCurrentUserSquad={isAlreadyInSquad && userMembership?.squad?.id === squad.id}
                    onJoin={handleJoinSquad}
                    onLeave={handleLeaveSquad}
                    isJoining={joinSquadMutation.isPending}
                    showJoinButton={true}
                  />
                ))}
              </div>

              {/* Pagination - only show when browsing all squads, not user's squads */}
              {!hasJoinedSquad && totalPages > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8 flex items-center justify-between"
                >
                  <div className="text-sm text-gray-600">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} squads
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!hasPreviousPage || isLoading || membershipLoading}
                      variant="outline"
                      size="sm"
                      className="flex items-center"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>

                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNumber = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                        return (
                          <Button
                            key={pageNumber}
                            onClick={() => handlePageChange(pageNumber)}
                            variant={pageNumber === currentPage ? "default" : "outline"}
                            size="sm"
                            className="w-10 h-10 p-0"
                            disabled={isLoading || membershipLoading}
                          >
                            {pageNumber}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!hasNextPage || isLoading || membershipLoading}
                      variant="outline"
                      size="sm"
                      className="flex items-center"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default JoinSquad;
