import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, MapPin, Plus, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { squadAPI, centerAPI } from '../api/axiosClient';
import Card from '../components/Card';

const Dashboard = () => {
  const { user } = useAuth();

  const { data: squads, isLoading: squadsLoading } = useQuery({
    queryKey: ['user-squads'],
    queryFn: () => squadAPI.getSquads(),
  });

  const { data: centers, isLoading: centersLoading } = useQuery({
    queryKey: ['nearby-centers'],
    queryFn: () => centerAPI.getNearbyCenters(),
  });

  const userSquads = squads?.data || [];
  const nearbyCenters = centers?.data || [];

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
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
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

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
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

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
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
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Squads</h2>
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
                    Goal: {squad.goal_count}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {/* Nearby Centers */}
      {nearbyCenters.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Nearby Registration Centers</h2>
            <button className="text-primary hover:text-primary/80 text-sm font-medium">
              View all
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nearbyCenters.slice(0, 3).map((center) => (
              <Card key={center.id} className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{center.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{center.address}</p>
                <p className="text-xs text-gray-500">{center.county}</p>
              </Card>
            ))}
          </div>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No squads yet</h3>
          <p className="text-gray-600 mb-4">
            Join a squad or create your own to start organizing with friends!
          </p>
          <button className="btn-primary">
            Create Your First Squad
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;
