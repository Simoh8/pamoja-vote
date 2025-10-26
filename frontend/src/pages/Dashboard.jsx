import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, MapPin, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { squadAPI, centerAPI } from '../api';
import { Button } from '../components/ui';
import Card from '../components/Card';
import SquadCard from '../components/SquadCard';
import { toast } from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Refresh squads data when component mounts or user returns to dashboard
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['user-squads'] });
    queryClient.invalidateQueries({ queryKey: ['user-membership'] });
  }, [queryClient]);

  // Join squad mutation
  const joinSquadMutation = useMutation({
    mutationFn: (squadId) => squadAPI.joinSquad(squadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-membership'] });
      queryClient.invalidateQueries({ queryKey: ['squads'] });
      queryClient.invalidateQueries({ queryKey: ['user-squads'] });
      toast.success('Successfully joined the squad!');
    },
    onError: (error) => {
      toast.error('Failed to join squad: ' + (error.response?.data?.message || error.message));
    },
  });

  const handleJoinSquad = () => {
    navigate('/squad');
  };

  const handleCreateSquad = () => {
    navigate('/squad/create');
  };

  const handleFindCenters = () => {
    navigate('/find-centers');
  };
  
  const handleJoinSquadFromDashboard = (squadId) => {
    // Check if user is owner of any squad with future registration
    if (hasOwnedSquadWithFutureRegistration) {
      const ownedSquad = ownedSquads.find(squad =>
        squad.voter_registration_date && new Date(squad.voter_registration_date) > new Date()
      );
      toast.error(
        `You are the owner of squad "${ownedSquad?.name}" with a future registration date (${new Date(ownedSquad?.voter_registration_date).toLocaleDateString()}). You cannot join other squads until the registration date has passed or you reset your membership.`,
        { duration: 6000 }
      );
      return;
    }

    if (hasJoinedSquad && userMembership?.squad?.id !== squadId) {
      toast.error('You are already a member of another squad. Leave your current squad first.');
      return;
    }
    joinSquadMutation.mutate(squadId);
  };

  // Clear membership mutation
  const clearMembershipMutation = useMutation({
    mutationFn: () => squadAPI.clearMembership(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-membership'] });
      queryClient.invalidateQueries({ queryKey: ['squads'] });
      queryClient.invalidateQueries({ queryKey: ['user-squads'] });
      queryClient.invalidateQueries({ queryKey: ['my-membership'] });
      queryClient.refetchQueries({ queryKey: ['squads'] });

      toast.success('Membership cleared! You can now join or create squads fresh.', {
        icon: '🔄',
        duration: 4000
      });
    },
    onError: (error) => {
      console.error('Failed to clear membership:', error);
      toast.error('Failed to clear membership: ' + (error.response?.data?.message || error.message));
    },
  });

  // Query for squads
  const { data: squads, isLoading: squadsLoading } = useQuery({
    queryKey: ['squads'],
    queryFn: () => squadAPI.getSquads(),
  });

  // Get user's membership info
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

  // Get nearby centers
  const { data: centers, isLoading: centersLoading, error: centersError } = useQuery({
    queryKey: ['nearby-centers'],
    queryFn: () => centerAPI.getNearbyCenters(),
    retry: (failureCount, error) => {
      if (error?.response?.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Get user's squads
  const { data: mySquads, isLoading: mySquadsLoading } = useQuery({
    queryKey: ['my-squads'],
    queryFn: () => squadAPI.getMySquads(),
    enabled: !!userMembership?.id,
    retry: (failureCount, error) => {
      if (error?.response?.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Derived state
  const userSquads = Array.isArray(squads) ? squads : squads?.results ? squads.results : [];
  const hasJoinedSquad = !!(userMembership && userMembership.id);
  const userMemberSquads = Array.isArray(mySquads) ? mySquads : (mySquads?.results ? mySquads.results : []);
  const userCurrentSquad = userMemberSquads.length > 0 ? userMemberSquads[0] : null;
  const nearbyCenters = centers || [];

  // Check if user's current squad has future registration date
  const hasFutureRegistration = userCurrentSquad?.voter_registration_date
    ? new Date(userCurrentSquad.voter_registration_date) > new Date()
    : false;

  // Check if user owns any squads
  const { data: ownedSquads, isLoading: ownedSquadsLoading } = useQuery({
    queryKey: ['my-squads'],
    queryFn: () => squadAPI.getMySquads(),
    enabled: true,
    retry: (failureCount, error) => {
      if (error?.response?.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Check if user is owner of any squad
  const isOwnerOfAnySquad = ownedSquads && ownedSquads.length > 0;

  // Check if user is owner of any squad with future registration
  const hasOwnedSquadWithFutureRegistration = ownedSquads && ownedSquads.length > 0
    ? ownedSquads.some(squad =>
        squad.voter_registration_date && new Date(squad.voter_registration_date) > new Date()
      )
    : false;

  // User can create squad ONLY if they don't have any squad membership and don't own any squads
  const canCreateSquad = !hasJoinedSquad && !isOwnerOfAnySquad;

  // Refresh data functions
  const handleRefreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['squads'] });
    queryClient.refetchQueries({ queryKey: ['squads'] });
    toast.success('Data refreshed!', {
      icon: '🔄',
      duration: 2000
    });
  };

  const handleRefreshSquadData = () => {
    queryClient.invalidateQueries({ queryKey: ['my-squads'] });
    queryClient.invalidateQueries({ queryKey: ['user-membership'] });
    queryClient.refetchQueries({ queryKey: ['my-squads'] });
    toast.success('Squad data refreshed!', {
      icon: '🔄',
      duration: 2000
    });
  };

  const handleSquadCardClick = (squad) => {
    const isOwner = squad.owner_id === user?.id;
    const isMember = userCurrentSquad?.id === squad.id;

    if (isOwner || isMember) {
      navigate('/squad');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-3 sm:py-6 lg:py-8 border-x border-gray-200/50">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 sm:mb-8"
      >
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.first_name || 'Voter'}! 👋
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Ready to make your voice heard? Let's get registered together.
        </p>

        {/* Membership Status Info */}
        {(hasJoinedSquad || isOwnerOfAnySquad) && (
          <div className="mt-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-blue-900 text-sm sm:text-base">Squad Status</h3>
                <p className="text-xs sm:text-sm text-blue-700 mt-1">
                  {hasJoinedSquad
                    ? `You're currently a member of ${userCurrentSquad?.name || 'a squad'}.${hasFutureRegistration ? ' The registration date is in the future.' : ''}`
                    : `You are the owner of ${ownedSquads?.length || 0} squad${ownedSquads?.length !== 1 ? 's' : ''} but not currently a member of any.`
                  }
                </p>
                {isOwnerOfAnySquad && hasOwnedSquadWithFutureRegistration && (
                  <p className="text-xs text-orange-600 mt-1">
                    As an owner with future registration dates, you cannot join other squads until the registration date passes.
                  </p>
                )}
                <p className="text-xs text-blue-600 mt-1">
                  {isOwnerOfAnySquad && 'As an owner, you can always manage your squad membership.'}
                </p>
              </div>
              <div className="flex flex-col xs:flex-row gap-2">
                <Button
                  onClick={handleRefreshData}
                  variant="outline"
                  size="sm"
                  className="border-blue-300 text-blue-700 hover:bg-blue-50 text-xs"
                >
                  Refresh Data
                </Button>
                {(hasJoinedSquad || isOwnerOfAnySquad) && (
                  <Button
                    onClick={() => clearMembershipMutation.mutate()}
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-700 hover:bg-red-50 text-xs"
                    disabled={clearMembershipMutation.isPending}
                  >
                    {clearMembershipMutation.isPending ? 'Clearing...' : 'Reset Membership'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>

  {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-6 sm:mb-8"
      >
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Quick Actions</h2>
        <div className={`flex flex-row flex-wrap justify-center gap-3 sm:gap-4 ${!canCreateSquad ? 'max-w-2xl mx-auto' : ''}`}>
          {/* Join Squad Card */}
          <Card className="p-3 sm:p-4 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200/50 flex-1 min-w-[140px] max-w-[200px]" onClick={handleJoinSquad}>
            <div className="flex flex-col items-center text-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center mb-2 flex-shrink-0 border border-blue-200">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">Join a Squad</h3>
                <p className="text-xs sm:text-sm text-gray-600 truncate">Team up with friends</p>
              </div>
            </div>
          </Card>

          {/* Create Squad Card - Conditionally Rendered */}
          {canCreateSquad && (
            <Card className="p-3 sm:p-4 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200/50 flex-1 min-w-[140px] max-w-[200px]" onClick={handleCreateSquad}>
              <div className="flex flex-col items-center text-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center mb-2 flex-shrink-0 border border-green-200">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">Create Squad</h3>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">Start your own group</p>
                </div>
              </div>
            </Card>
          )}

          {/* Find Centers Card */}
          <Card className="p-3 sm:p-4 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200/50 flex-1 min-w-[140px] max-w-[200px]" onClick={handleFindCenters}>
            <div className="flex flex-col items-center text-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-full flex items-center justify-center mb-2 flex-shrink-0 border border-orange-200">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">Find Centers</h3>
                <p className="text-xs sm:text-sm text-gray-600 truncate">Locate registration spots</p>
              </div>
            </div>
          </Card>
        </div>
      </motion.div>
      {/* All Squads */}
      {(userMemberSquads.length > 0 || (!squadsLoading && !membershipLoading && !ownedSquadsLoading)) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6 sm:mb-8"
        >
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
            {hasJoinedSquad ? 'Your Squad' : 'Available Squads'}
          </h2>

          {hasJoinedSquad && userMemberSquads.length === 0 && !mySquadsLoading && (
            <div className="mb-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-blue-900 text-sm sm:text-base">Squad Membership Detected</h3>
                  <p className="text-xs sm:text-sm text-blue-700 mt-1">
                    You're a member of a squad, but we couldn't load the squad details.
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Try refreshing the page or contact support if this persists.
                  </p>
                </div>
                <div className="flex flex-col xs:flex-row gap-2">
                  <Button
                    onClick={handleRefreshSquadData}
                    variant="outline"
                    size="sm"
                    className="border-blue-300 text-blue-700 hover:bg-blue-50 text-xs"
                  >
                    Refresh Data
                  </Button>
                  <Button
                    onClick={() => navigate('/squad')}
                    variant="outline"
                    size="sm"
                    className="border-green-300 text-green-700 hover:bg-green-50 text-xs"
                  >
                    View Squad Page
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {(hasJoinedSquad ? userMemberSquads : userSquads).map((squad) => (
              <SquadCard
                key={squad.id}
                squad={squad}
                isCurrentUserSquad={userCurrentSquad?.id === squad.id}
                onJoin={handleJoinSquadFromDashboard}
                onClick={handleSquadCardClick}
                showJoinButton={!hasOwnedSquadWithFutureRegistration && (!hasJoinedSquad || squad.id !== userCurrentSquad?.id)}
                currentUser={user}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Nearby Centers */}
      {!centersError && nearbyCenters.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-2 mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Nearby Registration Centers</h2>
            <button
              onClick={() => navigate('/find-centers')}
              className="text-primary hover:text-primary/80 text-xs sm:text-sm font-medium self-start xs:self-auto"
            >
              View all
            </button>
          </div>
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {nearbyCenters.slice(0, 3).map((center) => (
              <Card key={center.id} className="p-3 sm:p-4 border border-gray-200/50">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-2 truncate">{center.name}</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-2 truncate">{center.location || center.address}</p>
                <p className="text-xs text-gray-500 mb-2">{center.county}</p>
                {center.constituency && (
                  <p className="text-xs text-blue-600 mb-1 truncate">Constituency: {center.constituency}</p>
                )}
                {center.ward && (
                  <p className="text-xs text-blue-600 mb-1 truncate">Ward: {center.ward}</p>
                )}
                {center.polling_station_name && (
                  <p className="text-xs text-green-600 mb-2 truncate">Polling Station: {center.polling_station_name}</p>
                )}
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {/* Centers API Error Notice */}
      {centersError && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-6 sm:mb-8"
        >
          <Card className="p-4 sm:p-6 text-center bg-blue-50 border border-blue-200">
            <MapPin className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400 mx-auto mb-2 sm:mb-3" />
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-2">Location Services Coming Soon!</h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
              We're working on adding location-based center search. Browse all centers instead!
            </p>
            <Button onClick={() => navigate('/find-centers')} variant="outline" size="sm" className="text-xs sm:text-sm">
              Browse All Centers
            </Button>
          </Card>
        </motion.div>
      )}

      {/* Loading States */}
      {(squadsLoading || centersLoading || membershipLoading || mySquadsLoading || ownedSquadsLoading) && (
        <div className="flex justify-center py-6 sm:py-8">
          <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Empty States */}
      {!squadsLoading && !membershipLoading && !mySquadsLoading && !ownedSquadsLoading && userMemberSquads.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 sm:py-12 border-t border-gray-200/50 pt-8 sm:pt-12"
        >
          <Users className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">
            {hasJoinedSquad ? 'No squads found' : 'No squads yet'}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 max-w-md mx-auto">
            {hasJoinedSquad
              ? hasFutureRegistration
                ? 'You\'re already part of an active squad. Wait for the registration date or leave your current squad to create a new one.'
                : 'You\'re not a member of any squads yet.'
              : 'Join a squad or create your own to start organizing with friends!'
            }
          </p>
          <Button onClick={canCreateSquad ? handleCreateSquad : handleJoinSquad} size="sm" className="text-xs sm:text-sm">
            {canCreateSquad ? 'Create Squad' : 'Browse Squads'}
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;