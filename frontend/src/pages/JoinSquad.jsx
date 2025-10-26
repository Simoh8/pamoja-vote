import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, Search, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { squadAPI } from '../api';
import { Button, Input, Card, Alert } from '../components/ui';
import SquadCard from '../components/SquadCard';

const JoinSquad = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCounty, setSelectedCounty] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(9);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Refresh squads data when component mounts
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['squads'] });
    queryClient.invalidateQueries({ queryKey: ['user-membership'] });
  }, [queryClient]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCounty]);

  // Check user's current membership
  const { data: userMembership, isLoading: membershipLoading } = useQuery({
    queryKey: ['user-membership'],
    queryFn: () => squadAPI.getMyMembership(),
    enabled: true,
    retry: (failureCount, error) => {
      if (error?.response?.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const hasJoinedSquad = userMembership && userMembership.id;

  // Query for squads
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
    keepPreviousData: true,
  });

  // Extract squads and pagination info from response
  const squads = hasJoinedSquad
    ? (Array.isArray(squadsResponse) ? squadsResponse : [])
    : (squadsResponse?.results || []);
  const totalCount = hasJoinedSquad ? squads.length : (squadsResponse?.count || 0);
  const totalPages = hasJoinedSquad ? 1 : Math.ceil(totalCount / pageSize);
  const hasNextPage = hasJoinedSquad ? false : (squadsResponse?.next !== null);
  const hasPreviousPage = hasJoinedSquad ? false : (squadsResponse?.previous !== null || currentPage > 1);

  // Join squad mutation
  const joinSquadMutation = useMutation({
    mutationFn: (squadId) => squadAPI.joinSquad(squadId),
    onSuccess: () => {
      setError('');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['user-membership'] });
      queryClient.invalidateQueries({ queryKey: ['squads'] });
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
      refetch();
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

  // Check if user is owner of any squad with future registration
  const ownedSquads = squads.filter(squad => squad.owner_id === user?.id);
  const hasOwnedSquadWithFutureRegistration = ownedSquads.some(squad =>
    squad.voter_registration_date && new Date(squad.voter_registration_date) > new Date()
  );

  // Check create permissions
  const { data: createPermissions } = useQuery({
    queryKey: ['create-permissions'],
    queryFn: () => squadAPI.checkCreatePermissions(),
    retry: false,
  });

  const canCreateSquad = createPermissions?.can_create || false;

  // Event handlers
  const handleSquadCardClick = (squad) => {
    const isOwner = squad.owner_id === user?.id;
    const isMember = isAlreadyInSquad && userMembership?.squad?.id === squad.id;

    if (isOwner || isMember) {
      navigate('/squad');
    }
  };

  const handleJoinSquad = (squadId) => {
    // Check if user is owner of any squad with future registration
    if (hasOwnedSquadWithFutureRegistration) {
      const ownedSquad = ownedSquads.find(squad =>
        squad.voter_registration_date && new Date(squad.voter_registration_date) > new Date()
      );
      setError(`You are the owner of squad "${ownedSquad?.name}" with a future registration date (${new Date(ownedSquad?.voter_registration_date).toLocaleDateString()}). You cannot join other squads until the registration date has passed or you reset your membership.`);
      return;
    }

    if (isAlreadyInSquad && userMembership?.squad?.id !== squadId) {
      setError('You are already a member of another squad. Leave your current squad first.');
      return;
    }
    joinSquadMutation.mutate(squadId);
  };

  const handleLeaveSquad = (squadId) => {
    leaveSquadMutation.mutate(squadId);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter squads for display
  const filteredSquads = squads.filter(squad =>
    squad.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    squad.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const counties = squadsError ? [] : [...new Set(squads.map(squad => squad.county))];

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
            <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>
          <div className="flex flex-col xs:flex-row items-center justify-center gap-2 sm:gap-4 mb-3 sm:mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
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
          <p className="text-gray-600 text-sm sm:text-base">
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
            className="mb-4 sm:mb-6"
          />
        )}

        {/* Owner Restriction Warning */}
        {hasOwnedSquadWithFutureRegistration && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 sm:mb-6"
          >
            <Alert
              type="warning"
              message={`You are the owner of squad "${ownedSquads.find(squad => squad.voter_registration_date && new Date(squad.voter_registration_date) > new Date())?.name}" with a future registration date. You cannot join other squads until the registration date has passed or you reset your membership.`}
              onDismiss={() => {}}
              className="mb-4 sm:mb-6"
            />
          </motion.div>
        )}

        {/* Current Squad Section */}
        {isAlreadyInSquad && userMembership?.squad && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 sm:mb-6"
          >
            <Card className="p-4 sm:p-6 bg-green-50 border-green-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-green-900 text-sm sm:text-base truncate">
                      You're in: {userMembership.squad.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-green-700 truncate">
                      {userMembership.squad.county} • {userMembership.role}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col xs:flex-row gap-2">
                  <Button
                    onClick={() => navigate('/squad')}
                    variant="outline"
                    size="sm"
                    className="border-green-300 text-green-700 hover:bg-green-100 text-xs"
                  >
                    View Squad
                  </Button>
                  <Button
                    onClick={() => handleLeaveSquad(userMembership.squad.id)}
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-700 hover:bg-red-100 text-xs"
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
          className="mb-4 sm:mb-6"
        >
          <Card className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search squads..."
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
            <div className="text-center py-8 sm:py-12">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-blue-600 mx-auto mb-3 sm:mb-4"></div>
              <p className="text-gray-600 text-sm sm:text-base">Loading squads...</p>
            </div>
          ) : filteredSquads.length === 0 ? (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 rounded-2xl sm:rounded-3xl blur-2xl sm:blur-3xl transform scale-105 sm:scale-110"></div>

              <Card className="relative p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 border border-blue-200/50 shadow-lg sm:shadow-xl rounded-xl sm:rounded-2xl text-center overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full -translate-y-8 sm:-translate-y-12 translate-x-8 sm:translate-x-12"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full translate-y-8 sm:translate-y-10 -translate-x-8 sm:-translate-x-10"></div>

                <div className="relative max-w-md mx-auto">
                  <div className="relative mb-4 sm:mb-6">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                      <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                    </div>
                    <div className="absolute inset-0 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-xl sm:rounded-2xl mx-auto blur-lg sm:blur-xl opacity-30 -z-10"></div>
                  </div>

                  <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                      {searchTerm || selectedCounty
                        ? 'No squads found'
                        : 'Don\'t see your squad?'}
                    </h3>
                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                      {searchTerm || selectedCounty
                        ? 'Try adjusting your search or filter criteria to find more squads in your area.'
                        : hasJoinedSquad && hasFutureRegistration
                          ? 'You\'re already part of an active squad. Wait for the registration date or leave your current squad to create a new one.'
                          : hasOwnedSquadWithFutureRegistration
                            ? 'You are the owner of a squad with a future registration date. You cannot join other squads until the registration date passes or you reset your membership.'
                            : 'Ready to make your voice heard? Join a squad and team up with friends to organize voter registration drives and awareness campaigns.'}
                    </p>
                  </div>

                  <div className="flex flex-col items-center">
                    {canCreateSquad && (
                      <Button
                        onClick={() => navigate('/squad/create')}
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-semibold px-6 sm:px-8 py-2 sm:py-3 rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm sm:text-base"
                      >
                        <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                        Create Squad
                      </Button>
                    )}

                    <p className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3 text-center">
                      {canCreateSquad
                        ? 'Join thousands of leaders making their voices heard'
                        : hasOwnedSquadWithFutureRegistration
                          ? 'Wait for your squad\'s registration date or reset your membership to join other squads'
                          : 'Focus on your current squad or wait for registration to complete'}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:gap-6 grid-cols-1 xs:grid-cols-2 lg:grid-cols-3">
                {filteredSquads.map((squad) => (
                  <SquadCard
                    key={squad.id}
                    squad={squad}
                    isCurrentUserSquad={isAlreadyInSquad && userMembership?.squad?.id === squad.id}
                    onJoin={handleJoinSquad}
                    onLeave={handleLeaveSquad}
                    onClick={handleSquadCardClick}
                    isJoining={joinSquadMutation.isPending}
                    showJoinButton={!hasOwnedSquadWithFutureRegistration && !isAlreadyInSquad}
                    currentUser={user}
                  />
                ))}
              </div>

              {/* Pagination */}
              {!hasJoinedSquad && totalPages > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6 sm:mt-8 flex flex-col xs:flex-row items-center justify-between gap-3"
                >
                  <div className="text-xs sm:text-sm text-gray-600 text-center xs:text-left">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} squads
                  </div>

                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <Button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!hasPreviousPage || isLoading || membershipLoading}
                      variant="outline"
                      size="sm"
                      className="flex items-center text-xs"
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
                            onClick={() => handlePageChange(pageNumber)}
                            variant={pageNumber === currentPage ? "default" : "outline"}
                            size="sm"
                            className="w-8 h-8 sm:w-9 sm:h-9 p-0 text-xs"
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
                      className="flex items-center text-xs"
                    >
                      Next
                      <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
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