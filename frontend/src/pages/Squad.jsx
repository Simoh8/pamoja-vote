import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Plus, UserPlus, ArrowRight, MapPin } from 'lucide-react';
import { Button, Card } from '../components/ui';

const Squad = () => {
  const navigate = useNavigate();

  const handleJoinSquad = () => {
    navigate('/join-squad');
  };

  const handleCreateSquad = () => {
    navigate('/squad/create');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Squad Management</h1>
          <p className="text-gray-600">Team up with friends and make your voice count together</p>
        </motion.div>

        {/* Action Cards */}
        <div className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto">
          {/* Join Squad Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={handleJoinSquad}>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Join a Squad</h3>
              <p className="text-gray-600 mb-4">Team up with friends</p>
              <Button variant="outline" className="w-full">
                Browse Squads <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Card>
          </motion.div>

          {/* Create Squad Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={handleCreateSquad}>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Create Squad</h3>
              <p className="text-gray-600 mb-4">Start your own group</p>
              <Button className="w-full">
                Create Squad <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Card>
          </motion.div>
        </div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 text-center"
        >
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Why Join or Create a Squad?</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>• <strong>Team up</strong> with friends and like-minded people in your area</p>
              <p>• <strong>Organize</strong> voter registration drives and awareness campaigns</p>
              <p>• <strong>Track progress</strong> and compete on leaderboards</p>
              <p>• <strong>Make an impact</strong> in your community and across Kenya</p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Squad;
