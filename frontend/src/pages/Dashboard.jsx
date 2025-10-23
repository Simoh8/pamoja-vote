import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, MapPin, Plus, Trophy, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { squadAPI, centerAPI } from '../api';
import { Button } from '../components/ui';
import Card from '../components/Card';
import SquadCard from '../components/SquadCard';
import { toast } from 'react-hot-toast'; // or your preferred toast library

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Refresh squads data when component mounts or user returns to dashboard
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['user-squads'] });
    queryClient.invalidateQueries({ queryKey: ['user-membership'] });
  }, [queryClient]);

  // Join squad mutation - add this for direct joining
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

  // Clear membership mutation (for debugging and user-initiated reset)
  const clearMembershipMutation = useMutation({
    mutationFn: () => squadAPI.clearMembership(),
    onSuccess: (response) => {
      // console.log('Membership cleared successfully:', response);
      // Invalidate all related queries to force fresh data fetch
      queryClient.invalidateQueries({ queryKey: ['user-membership'] });
      queryClient.invalidateQueries({ queryKey: ['squads'] });
      queryClient.invalidateQueries({ queryKey: ['user-squads'] });
      queryClient.invalidateQueries({ queryKey: ['my-membership'] });

      // Force refetch the squads query immediately
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

  // Query for squads - always get all squads to determine user's membership from squad data
  const { data: squads, isLoading: squadsLoading } = useQuery({
    queryKey: ['squads'],
    queryFn: () => squadAPI.getSquads(),
  });

  // Get user's membership info - ENABLED to properly detect user membership
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

  // Get nearby centers
  const { data: centers, isLoading: centersLoading, error: centersError } = useQuery({
    queryKey: ['nearby-centers'],
    queryFn: () => centerAPI.getNearbyCenters(),
    retry: (failureCount, error) => {
      // Don't retry on 404 errors (endpoint doesn't exist yet)
      if (error?.response?.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const userSquads = Array.isArray(squads) ? squads : squads?.results ? squads.results : [];

  // Check if user has joined any squads based on membership data
  const hasJoinedSquad = userMembership && userMembership.id ? true : false;

  // Get user's squads - this should contain their actual squad memberships
  const { data: mySquads, isLoading: mySquadsLoading } = useQuery({
    queryKey: ['my-squads'],
    queryFn: () => squadAPI.getMySquads(),
    enabled: hasJoinedSquad, // Only fetch if user has membership
    retry: (failureCount, error) => {
      // Don't retry on 404 (user not a member of any squad)
      if (error?.response?.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Use mySquads if available, otherwise fall back to empty array
  const userMemberSquads = Array.isArray(mySquads) ? mySquads : (mySquads?.results ? mySquads.results : []);

  // Get the current squad for logic purposes - use the first squad from mySquads
  const userCurrentSquad = userMemberSquads.length > 0 ? userMemberSquads[0] : null;
  const userMembershipRole = userMembership?.role || 'member';

  // Check if user's current squad has future registration date
  const hasFutureRegistration = userCurrentSquad?.voter_registration_date
    ? new Date(userCurrentSquad.voter_registration_date) > new Date()
    : false;

  const nearbyCenters = centers || [];

  // Check if user is owner of any squad with future registration
  const ownedSquads = userSquads.filter(squad => squad.owner === user?.phone_number);
  const hasOwnedSquadWithFutureRegistration = ownedSquads.some(squad =>
    squad.voter_registration_date && new Date(squad.voter_registration_date) > new Date()
  );

  // DEFINE MISSING VARIABLES:
  // Check if user is owner of any squad
  const isOwnerOfAnySquad = ownedSquads.length > 0;
  
  // User can create squad if they haven't joined any, or if they're an owner (owners can manage multiple squads)
  const canCreateSquad = !hasJoinedSquad || isOwnerOfAnySquad || !hasFutureRegistration;

  // Refresh data function with toast
  const handleRefreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['squads'] });
    queryClient.refetchQueries({ queryKey: ['squads'] });
    toast.success('Data refreshed!', {
      icon: '🔄',
      duration: 2000
    });
  };

  // Refresh squad data function with toast
  const handleRefreshSquadData = () => {
    queryClient.invalidateQueries({ queryKey: ['squads'] });
    queryClient.invalidateQueries({ queryKey: ['my-squads'] });
    queryClient.refetchQueries({ queryKey: ['squads'] });
    queryClient.refetchQueries({ queryKey: ['my-squads'] });
    toast.success('Squad data refreshed!', {
      icon: '👥',
      duration: 2000
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.first_name || 'Voter'}! 👋
        </h1>
        <p className="text-gray-600">
          Ready to make your voice heard? Let's get registered together.
        </p>

        {/* Membership Status Info */}
        {(hasJoinedSquad || isOwnerOfAnySquad) && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-900">Squad Membership Status</h3>
                <p className="text-sm text-blue-700 mt-1">
                  {hasJoinedSquad
                    ? `You're currently a member of ${userCurrentSquad?.name || 'a squad'}.${hasFutureRegistration ? ' The registration date is in the future.' : ''}`
                    : 'You are the owner of one or more squads but not currently a member of any.'
                  }
                </p>
                {hasOwnedSquadWithFutureRegistration && (
                  <p className="text-xs text-orange-600 mt-1">
                    As an owner with future registration dates, you cannot join other squads until the registration date passes.
                  </p>
                )}
                <p className="text-xs text-blue-600 mt-1">
                  {isOwnerOfAnySquad && 'As an owner, you can always manage your squad membership.'}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={handleRefreshData}
                  variant="outline"
                  size="sm"
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  Refresh Data
                </Button>
                {(hasJoinedSquad || isOwnerOfAnySquad) && (
                  <Button
                    onClick={() => clearMembershipMutation.mutate()}
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-700 hover:bg-red-50"
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
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
      >
        {/* Always show Join Squad card */}
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={handleJoinSquad}>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Join a Squad</h3>
              <p className="text-sm text-gray-600">Team up with friends</p>
            </div>
          </div>
        </Card>

        {canCreateSquad && (
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={handleCreateSquad}>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                <Plus className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Create Squad</h3>
                <p className="text-sm text-gray-600">Start your own group</p>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={handleFindCenters}>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
              <MapPin className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Find Centers</h3>
              <p className="text-sm text-gray-600">Locate registration spots</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* All Squads - Show when user has no squads or when showing user's squads */}
      {(userMemberSquads.length > 0 || (!squadsLoading && !membershipLoading)) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {hasJoinedSquad ? 'Your Squad' : 'Available Squads'}
          </h2>

          {/* Show message when user has membership but no squad info */}
          {hasJoinedSquad && userMemberSquads.length === 0 && !mySquadsLoading && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-blue-900">Squad Membership Detected</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    You're a member of a squad, but we couldn't load the squad details.
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Try refreshing the page or contact support if this persists.
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleRefreshSquadData}
                    variant="outline"
                    size="sm"
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    Refresh Data
                  </Button>
                  <Button
                    onClick={() => navigate('/squad')}
                    variant="outline"
                    size="sm"
                    className="border-green-300 text-green-700 hover:bg-green-50"
                  >
                    View Squad Page
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(hasJoinedSquad ? userMemberSquads : userSquads).map((squad) => (
              <SquadCard
                key={squad.id}
                squad={squad}
                isCurrentUserSquad={userCurrentSquad?.id === squad.id}
                onJoin={handleJoinSquadFromDashboard}
                onLeave={() => {}}
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Nearby Registration Centers</h2>
            <button
              onClick={() => navigate('/find-centers')}
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              View all
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nearbyCenters.slice(0, 3).map((center) => (
              <Card key={center.id} className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{center.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{center.location || center.address}</p>
                <p className="text-xs text-gray-500 mb-2">{center.county}</p>
                {center.constituency && (
                  <p className="text-xs text-blue-600 mb-1">Constituency: {center.constituency}</p>
                )}
                {center.ward && (
                  <p className="text-xs text-blue-600 mb-1">Ward: {center.ward}</p>
                )}
                {center.polling_station_name && (
                  <p className="text-xs text-green-600 mb-2">Polling Station: {center.polling_station_name}</p>
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
          className="mb-8"
        >
          <Card className="p-6 text-center bg-blue-50 border-blue-200">
            <MapPin className="h-12 w-12 text-blue-400 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Location Services Coming Soon!</h3>
            <p className="text-sm text-gray-600 mb-4">
              We're working on adding location-based center search. Browse all centers instead!
            </p>
            <Button onClick={() => navigate('/find-centers')} variant="outline">
              Browse All Centers
            </Button>
          </Card>
        </motion.div>
      )}

      {/* Loading States */}
      {(squadsLoading || centersLoading || membershipLoading || mySquadsLoading) && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Empty States */}
      {!squadsLoading && !membershipLoading && !mySquadsLoading && userMemberSquads.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {hasJoinedSquad ? 'No squads found' : 'No squads yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {hasJoinedSquad
              ? hasFutureRegistration
                ? 'You\'re already part of an active squad. Wait for the registration date or leave your current squad to create a new one.'
                : 'You\'re not a member of any squads yet.'
              : 'Join a squad or create your own to start organizing with friends!'
            }
          </p>
          <Button onClick={canCreateSquad ? handleCreateSquad : handleJoinSquad}>
            {canCreateSquad ? 'Create Squad' : 'Browse Squads'}
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;