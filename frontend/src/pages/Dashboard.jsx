import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, MapPin, Plus, Trophy, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { squadAPI, centerAPI } from '../api';
import { Button } from '../components/ui';
import Card from '../components/Card';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Refresh squads data when component mounts or user returns to dashboard
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['user-squads'] });
  }, [queryClient]);

  const handleJoinSquad = () => {
    navigate('/squad');
  };

  const handleCreateSquad = () => {
    navigate('/squad/create');
  };

  const handleFindCenters = () => {
    navigate('/find-centers');
  };

  // Check user's current membership
  const { data: userMembership } = useQuery({
    queryKey: ['user-membership'],
    queryFn: () => squadAPI.getMyMembership(),
  });

  const hasJoinedSquad = userMembership && userMembership.id;

  // Query for user's squads if they have any, or all squads if they don't
  const { data: squads, isLoading: squadsLoading } = useQuery({
    queryKey: hasJoinedSquad ? ['user-squads'] : ['squads'],
    queryFn: hasJoinedSquad ? () => squadAPI.getMySquads() : () => squadAPI.getSquads(),
  });

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

  const userSquads = Array.isArray(squads) ? squads : 
                   squads?.results ? squads.results : [];
  const nearbyCenters = centers || [];

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
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
      >
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

      {/* User's Squads */}
      {userSquads.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {hasJoinedSquad ? 'Your Squad' : 'Available Squads'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userSquads.map((squad) => (
              <Card key={squad.id} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">{squad.name}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    squad.is_public ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {squad.is_public ? 'Public' : 'Private'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{squad.description}</p>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">
                    {squad.member_count || 0} members
                  </span>
                  <span className="text-gray-500">
                    {squad.max_members !== null && squad.max_members > 0
                      ? `${squad.remaining_slots} of ${squad.max_members} slots left`
                      : 'No limit'}
                  </span>
                </div>

                {squad.voter_registration_date && (
                  <div className="mt-3 p-2 bg-green-50 rounded-lg">
                    <div className="flex items-center text-sm text-green-800">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span className="font-medium">Registration:</span>
                    </div>
                    <div className="text-sm text-green-700 ml-6">
                      {new Date(squad.voter_registration_date).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </Card>
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
      {(squadsLoading || centersLoading) && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Empty States */}
      {!squadsLoading && userSquads.length === 0 && (
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
              ? 'You\'re not a member of any squads yet.'
              : 'Join a squad or create your own to start organizing with friends!'
            }
          </p>
          <Button onClick={hasJoinedSquad ? handleJoinSquad : handleCreateSquad}>
            {hasJoinedSquad ? 'Browse Squads' : 'Create Your First Squad'}
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;
