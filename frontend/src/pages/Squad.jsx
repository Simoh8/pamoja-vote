import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, Plus, UserPlus, ArrowRight, MapPin, MessageSquare, Send, Phone } from 'lucide-react';
import { Button, Card, Input, Textarea, Alert } from '../components/ui';
import { squadAPI, inviteAPI } from '../api';

const Squad = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);
  const [messagingError, setMessagingError] = useState('');

  // Get user's current squad membership
  const { data: userMembership, isLoading: membershipLoading } = useQuery({
    queryKey: ['user-membership'],
    queryFn: () => squadAPI.getMyMembership(),
  });

  const hasJoinedSquad = userMembership && userMembership.id;
  const userSquad = userMembership?.squad;
  const isSquadCreator = userSquad?.owner === userMembership?.user;

  // Get squad members if user has joined a squad
  const { data: squadMembers, isLoading: membersLoading } = useQuery({
    queryKey: ['squad-members', userSquad?.id],
    queryFn: () => squadAPI.getSquadMembers(userSquad.id),
    enabled: hasJoinedSquad && !!userSquad?.id,
  });

  // Send message to squad members mutation
  const sendMessageMutation = useMutation({
    mutationFn: (messageData) => inviteAPI.sendBulkInvite({
      squad_id: userSquad.id,
      message: messageData.message,
    }),
    onSuccess: () => {
      setMessage('');
      setMessagingError('');
      setIsMessagingOpen(false);
      // Show success toast or alert
      alert('Message sent to all squad members!');
    },
    onError: (error) => {
      setMessagingError(error.response?.data?.message || 'Failed to send message');
    },
  });

  const handleSendMessage = () => {
    if (!message.trim()) {
      setMessagingError('Please enter a message');
      return;
    }

    sendMessageMutation.mutate({ message: message.trim() });
  };

  const handleJoinSquad = () => {
    navigate('/join-squad');
  };

  const handleCreateSquad = () => {
    navigate('/squad/create');
  };

  // If user hasn't joined any squad, show the original landing page
  if (!hasJoinedSquad) {
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
  }

  // If user has joined a squad, show squad management interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{userSquad?.name || 'Squad'}</h1>
              <p className="text-gray-600 flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {userSquad?.county || 'Unknown'} • {userMembership?.role || 'member'}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => navigate('/join-squad')}
                variant="outline"
              >
                Browse Other Squads
              </Button>
              {isSquadCreator && (
                <Button
                  onClick={() => setIsMessagingOpen(!isMessagingOpen)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message Members
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Messaging Interface */}
        {isMessagingOpen && isSquadCreator && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Send Message to Squad Members
              </h3>

              {messagingError && (
                <Alert type="error" message={messagingError} className="mb-4" />
              )}

              <div className="space-y-4">
                <Textarea
                  placeholder="Type your message to all squad members..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full"
                />

                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    This message will be sent via SMS to {squadMembers?.length || 0} squad members
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setIsMessagingOpen(false)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSendMessage}
                      loading={sendMessageMutation.isPending}
                      disabled={sendMessageMutation.isPending || !message.trim()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Squad Details */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Squad Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Squad Information</h3>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <p className="text-gray-600 mt-1">{userSquad?.description || 'No description available'}</p>
                </div>

                {userSquad?.max_members && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Capacity</label>
                    <p className="text-gray-600 mt-1">
                      {userSquad?.member_count || 0} of {userSquad?.max_members} members
                    </p>
                  </div>
                )}

                {userSquad?.voter_registration_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Registration Date</label>
                    <p className="text-gray-600 mt-1">
                      {new Date(userSquad?.voter_registration_date).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-700">Visibility</label>
                  <p className="text-gray-600 mt-1">
                    {userSquad?.is_public ? 'Public (anyone can join)' : 'Private (invite only)'}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Squad Members */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Squad Members</h3>
                <span className="text-sm text-gray-500">
                  {squadMembers?.length || 0} members
                </span>
              </div>

              {membersLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {squadMembers?.map((member) => (
                    <div key={member.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {member.user}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {member.role}
                        </p>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${
                        member.has_registered ? 'bg-green-500' : 'bg-gray-300'
                      }`} title={member.has_registered ? 'Registered' : 'Not registered'} />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        </div>

        {/* Registration Center Info */}
        {userSquad?.registration_center && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Registration Center
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">Name</label>
                  <p className="text-gray-600 mt-1">{userSquad?.registration_center?.name || 'Not specified'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Location</label>
                  <p className="text-gray-600 mt-1">
                    {userSquad?.registration_center?.location || userSquad?.registration_center?.address || 'Not specified'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">County</label>
                  <p className="text-gray-600 mt-1">{userSquad?.registration_center?.county || 'Not specified'}</p>
                </div>

                {userSquad?.registration_center?.constituency && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Constituency</label>
                    <p className="text-gray-600 mt-1">{userSquad?.registration_center?.constituency}</p>
                  </div>
                )}

                {userSquad?.registration_center?.ward && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Ward</label>
                    <p className="text-gray-600 mt-1">{userSquad?.registration_center?.ward}</p>
                  </div>
                )}

                {userSquad?.registration_center?.polling_station_name && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Polling Station</label>
                    <p className="text-green-600 mt-1 font-medium">{userSquad?.registration_center?.polling_station_name}</p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 flex justify-center space-x-4"
        >
          <Button
            onClick={() => navigate('/dashboard')}
            variant="outline"
          >
            Back to Dashboard
          </Button>

          {isSquadCreator && (
            <Button
              onClick={() => setIsMessagingOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Message Members
            </Button>
          )}

          <Button
            onClick={() => navigate('/join-squad')}
            variant="outline"
          >
            Browse Other Squads
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Squad;
