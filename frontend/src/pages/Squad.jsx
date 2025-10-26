import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, Plus, UserPlus, ArrowRight, MapPin, MessageSquare, Send, Phone } from 'lucide-react';
import { Button, Card, Input, Textarea, Alert } from '../components/ui';
import { squadAPI, inviteAPI } from '../api';
import { toast } from 'react-toastify';

const Squad = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);
  const [messagingError, setMessagingError] = useState('');

  // Get user's current squad membership
  const { data: userMembership, isLoading: membershipLoading, error: membershipError } = useQuery({
    queryKey: ['user-membership'],
    queryFn: () => squadAPI.getMyMembership(),
  });

  const hasJoinedSquad = userMembership && userMembership.id;
  const userSquad = userMembership?.squad;
  const isSquadCreator = userMembership?.user_id === userMembership?.squad?.owner_id;

  // Get squad members if user has joined a squad
  const { data: squadMembers, isLoading: membersLoading, error: membersError } = useQuery({
    queryKey: ['squad-members', userSquad?.id],
    queryFn: () => squadAPI.getSquadMembers(userSquad.id),
    enabled: hasJoinedSquad && !!userSquad?.id,
  });

  // Send announcement to squad members mutation
  const sendAnnouncementMutation = useMutation({
    mutationFn: (announcementData) => squadAPI.sendAnnouncement(userSquad.id, announcementData),
    onSuccess: (data) => {
      setMessage('');
      setMessagingError('');
      setIsMessagingOpen(false);
      toast.success(`Announcement sent to ${data.recipients_count} squad members!`, {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        style: {
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: 'white',
          borderRadius: '12px',
          border: 'none',
          boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)'
        }
      });
    },
    onError: (error) => {
      setMessagingError(error.response?.data?.error || 'Failed to send announcement');
    },
  });

  const handleSendAnnouncement = () => {
    if (!message.trim()) {
      setMessagingError('Please enter a message');
      return;
    }
    sendAnnouncementMutation.mutate({ message: message.trim() });
  };

  const handleJoinSquad = () => {
    navigate('/join-squad');
  };

  const handleCreateSquad = () => {
    navigate('/squad/create');
  };

  // Render loading state
  if (membershipLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-3 sm:p-4">
        <div className="max-w-4xl mx-auto text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">Loading your squad information...</p>
        </div>
      </div>
    );
  }

  // Render error state for membership loading
  if (membershipError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-3 sm:p-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 sm:mb-8"
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Squad Management</h1>
          </motion.div>
          <Card className="p-4 sm:p-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 max-w-2xl mx-auto">
            <Alert 
              type="error" 
              message={`Error loading membership: ${membershipError.message}`}
              className="mb-4 sm:mb-6"
            />
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button onClick={() => navigate('/dashboard')} variant="outline" size="sm" className="text-xs sm:text-sm">
                Back to Dashboard
              </Button>
              <Button onClick={() => window.location.reload()} size="sm" className="text-xs sm:text-sm">
                Try Again
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // If user has joined squad but squad data is missing
  if (hasJoinedSquad && !userSquad) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-3 sm:p-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 sm:mb-8"
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Squad Management</h1>
            <p className="text-gray-600 text-sm sm:text-base">You're a member of a squad</p>
          </motion.div>

          <Card className="p-4 sm:p-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 max-w-2xl mx-auto">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Squad Information Unavailable</h3>
            <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6">
              We couldn't load your squad information. This might be a temporary issue.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button onClick={() => navigate('/dashboard')} variant="outline" size="sm" className="text-xs sm:text-sm">
                Back to Dashboard
              </Button>
              <Button onClick={() => navigate('/join-squad')} size="sm" className="text-xs sm:text-sm">
                Browse Squads
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // If user hasn't joined any squad, show the original landing page
  if (!hasJoinedSquad) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-3 sm:p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6 sm:mb-8"
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Squad Management</h1>
            <p className="text-gray-600 text-sm sm:text-base">Team up with friends and make your voice count together</p>
          </motion.div>

          {/* Action Cards */}
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 max-w-2xl mx-auto">
            {/* Join Squad Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-4 sm:p-6 text-center hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={handleJoinSquad}>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <UserPlus className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Join a Squad</h3>
                <p className="text-gray-600 text-sm sm:text-base mb-3 sm:mb-4">Team up with friends</p>
                <Button variant="outline" className="w-full text-xs sm:text-sm py-2">
                  Browse Squads <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                </Button>
              </Card>
            </motion.div>

            {/* Create Squad Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-4 sm:p-6 text-center hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={handleCreateSquad}>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Create Squad</h3>
                <p className="text-gray-600 text-sm sm:text-base mb-3 sm:mb-4">Start your own group</p>
                <Button className="w-full text-xs sm:text-sm py-2">
                  Create Squad <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                </Button>
              </Card>
            </motion.div>
          </div>

          {/* Info Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 sm:mt-12 text-center"
          >
            <Card className="p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 max-w-2xl mx-auto">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Why Join or Create a Squad?</h3>
              <div className="text-xs sm:text-sm text-gray-600 space-y-1 sm:space-y-2">
                <p className="text-left">• <strong>Team up</strong> with friends and like-minded people in your area</p>
                <p className="text-left">• <strong>Organize</strong> voter registration drives and awareness campaigns</p>
                <p className="text-left">• <strong>Track progress</strong> and compete on leaderboards</p>
                <p className="text-left">• <strong>Make an impact</strong> in your community and across Kenya</p>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // If user has joined a squad, show squad management interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-3 sm:p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 truncate">{userSquad?.name || 'Squad'}</h1>
              <p className="text-gray-600 flex items-center text-sm sm:text-base">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                {userSquad?.county || 'Unknown'} • {userMembership?.role || 'member'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
              <Button
                onClick={() => navigate('/join-squad')}
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm"
              >
                Browse Other Squads
              </Button>
              {isSquadCreator && (
                <Button
                  onClick={() => setIsMessagingOpen(!isMessagingOpen)}
                  className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm"
                  size="sm"
                >
                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Send Announcement
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
            className="mb-4 sm:mb-6"
          >
            <Card className="p-3 sm:p-4 lg:p-6">
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Send Announcement to Squad Members
              </h3>

              {messagingError && (
                <Alert type="error" message={messagingError} className="mb-4" />
              )}

              <div className="space-y-4">
                <Textarea
                  placeholder="Type your announcement message to all squad members..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full text-sm sm:text-base"
                />

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                    This announcement will be sent via SMS to {squadMembers?.length || 0} squad members
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
                    <Button
                      onClick={() => setIsMessagingOpen(false)}
                      variant="outline"
                      size="sm"
                      className="text-xs sm:text-sm"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSendAnnouncement}
                      loading={sendAnnouncementMutation.isPending}
                      disabled={sendAnnouncementMutation.isPending || !message.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm"
                      size="sm"
                    >
                      <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Send Announcement
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Error State for Squad Loading */}
        {membersError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Alert
              type="error"
              message={`Error loading squad members: ${membersError.message}`}
              className="mb-4"
            />
          </motion.div>
        )}

        {/* Loading State for Squad Members */}
        {membersLoading && (
          <div className="text-center py-6 sm:py-8">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto mb-3 sm:mb-4"></div>
            <p className="text-gray-600 text-sm sm:text-base">Loading squad members...</p>
          </div>
        )}

        {/* Squad Details - Only show if no errors and not loading */}
        {!membersError && (
          <>
            <div className="grid gap-3 sm:gap-4 lg:gap-6 lg:grid-cols-2">
              {/* Squad Info */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="p-3 sm:p-4 lg:p-6">
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Squad Information</h3>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-gray-700">Description</label>
                      <p className="text-gray-600 mt-1 text-sm sm:text-base">{userSquad?.description || 'No description available'}</p>
                    </div>

                    {userSquad?.max_members && (
                      <div>
                        <label className="text-xs sm:text-sm font-medium text-gray-700">Capacity</label>
                        <p className="text-gray-600 mt-1 text-sm sm:text-base">
                          {userSquad?.member_count || 0} of {userSquad?.max_members} members
                        </p>
                      </div>
                    )}

                    {userSquad?.voter_registration_date && (
                      <div>
                        <label className="text-xs sm:text-sm font-medium text-gray-700">Registration Date</label>
                        <p className="text-gray-600 mt-1 text-sm sm:text-base">
                          {new Date(userSquad?.voter_registration_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="text-xs sm:text-sm font-medium text-gray-700">Visibility</label>
                      <p className="text-gray-600 mt-1 text-sm sm:text-base">
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
                <Card className="p-3 sm:p-4 lg:p-6">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">Squad Members</h3>
                    <span className="text-xs sm:text-sm text-gray-500">
                      {squadMembers?.length || 0} members
                    </span>
                  </div>

                  {membersLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                  ) : (
                    <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 overflow-y-auto">
                      {squadMembers?.map((member) => (
                        <div key={member.id} className="flex items-center space-x-2 sm:space-x-3 p-2 rounded-lg hover:bg-gray-50">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                              {member.user_display || member.phone_number}
                            </p>
                            <p className="text-xs text-gray-500 capitalize truncate">
                              {member.role}
                            </p>
                          </div>
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
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
                className="mt-4 sm:mt-6"
              >
                <Card className="p-3 sm:p-4 lg:p-6">
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Registration Center
                  </h3>

                  <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-gray-700">Name</label>
                      <p className="text-gray-600 mt-1 text-sm sm:text-base">{userSquad?.registration_center?.name || 'Not specified'}</p>
                    </div>

                    <div>
                      <label className="text-xs sm:text-sm font-medium text-gray-700">Location</label>
                      <p className="text-gray-600 mt-1 text-sm sm:text-base">
                        {userSquad?.registration_center?.location || userSquad?.registration_center?.address || 'Not specified'}
                      </p>
                    </div>

                    <div>
                      <label className="text-xs sm:text-sm font-medium text-gray-700">County</label>
                      <p className="text-gray-600 mt-1 text-sm sm:text-base">{userSquad?.registration_center?.county || 'Not specified'}</p>
                    </div>

                    {userSquad?.registration_center?.constituency && (
                      <div>
                        <label className="text-xs sm:text-sm font-medium text-gray-700">Constituency</label>
                        <p className="text-gray-600 mt-1 text-sm sm:text-base">{userSquad?.registration_center?.constituency}</p>
                      </div>
                    )}

                    {userSquad?.registration_center?.ward && (
                      <div>
                        <label className="text-xs sm:text-sm font-medium text-gray-700">Ward</label>
                        <p className="text-gray-600 mt-1 text-sm sm:text-base">{userSquad?.registration_center?.ward}</p>
                      </div>
                    )}

                    {userSquad?.registration_center?.polling_station_name && (
                      <div>
                        <label className="text-xs sm:text-sm font-medium text-gray-700">Polling Station</label>
                        <p className="text-green-600 mt-1 font-medium text-sm sm:text-base">{userSquad?.registration_center?.polling_station_name}</p>
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
              className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-center gap-3 sm:space-x-4"
            >
              <Button
                onClick={() => navigate('/dashboard')}
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm"
              >
                Back to Dashboard
              </Button>

              {isSquadCreator && (
                <Button
                  onClick={() => setIsMessagingOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm"
                  size="sm"
                >
                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Send Announcement
                </Button>
              )}

              <Button
                onClick={() => navigate('/join-squad')}
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm"
              >
                Browse Other Squads
              </Button>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default Squad;