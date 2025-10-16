import { motion } from 'framer-motion';
import { Users, MapPin, Calendar, UserPlus, Clock, Star } from 'lucide-react';
import { Button } from './ui';
import Card from './Card';

const SquadCard = ({
  squad,
  isCurrentUserSquad = false,
  onJoin = () => {},
  onLeave = () => {},
  isJoining = false,
  showJoinButton = true,
  className = ""
}) => {
  // Safely check membership status
  const isUserMember = Boolean(isCurrentUserSquad);

  // Debug logging for membership detection
  // console.log('SquadCard Debug:', {
  //   squadId: squad?.id,
  //   squadName: squad?.name,
  //   isCurrentUserSquad,
  //   isUserMember,
  //   userSquadsLength: squad?.member_count,
  //   canJoinThisSquad,
  //   isRegistrationFuture,
  //   showJoinButton,
  //   componentLocation: 'Dashboard' // Add this to distinguish from JoinSquad
  // });

  // Safely check registration date
  const registrationDate = squad?.voter_registration_date;
  const isRegistrationFuture = registrationDate
    ? (() => {
        try {
          return new Date(registrationDate) > new Date();
        } catch (error) {
          console.warn('Invalid registration date:', registrationDate, error);
          return false;
        }
      })()
    : false;

  // Check if user can join this specific squad
  // Users can join squads even with future registration dates
  const canJoinThisSquad = !isUserMember && showJoinButton;

  // Debug logging for button logic
  console.log('SquadCard Button Logic Debug:', {
    isUserMember,
    isRegistrationFuture,
    showJoinButton,
    canJoinThisSquad,
    registrationDate: squad?.voter_registration_date,
    currentDate: new Date().toISOString(),
    squadId: squad?.id,
    squadName: squad?.name,
    componentLocation: 'Dashboard'
  });
  const getButtonContent = () => {
    if (isUserMember) {
      return {
        text: "Already a Member",
        variant: "secondary",
        icon: Users,
        disabled: true,
        onClick: undefined
      };
    }

    if (isRegistrationFuture) {
      return {
        text: "Join Squad (Registration Pending)",
        variant: "outline",
        icon: UserPlus,
        disabled: false,
        onClick: () => onJoin(squad?.id)
      };
    }

    return {
      text: "Join Squad",
      variant: "default",
      icon: UserPlus,
      disabled: false,
      onClick: () => onJoin(squad?.id)
    };
  };

  const buttonContent = getButtonContent();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={className}
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
            {isUserMember && (
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2.5 rounded-full text-sm font-bold shadow-xl border-2 border-white flex items-center space-x-2 animate-bounce">
                <Star className="w-4 h-4 fill-current" />
                <span>You're a Member</span>
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
              {squad.max_members !== null && squad.max_members > 0
                ? `${squad.remaining_slots} of ${squad.max_members} slots left`
                : ''}
            </span>
          </div>

          {squad.voter_registration_date && (
            <div className={`mb-3 p-2 rounded-lg ${isRegistrationFuture ? 'bg-orange-50' : 'bg-green-50'}`}>
              <div className="flex items-center text-sm text-green-800">
                <Calendar className="h-4 w-4 mr-2" />
                <span className="font-medium">Registration Date:</span>
              </div>
              <div className="text-sm text-green-700 ml-6">
                {new Date(squad.voter_registration_date).toLocaleDateString()}
                {isRegistrationFuture && (
                  <span className="ml-2 text-xs text-orange-600 font-medium">
                    (Upcoming)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {showJoinButton && !isUserMember && (
          <div className="p-6 pt-0">
            <Button
              onClick={buttonContent.onClick}
              loading={isJoining && canJoinThisSquad}
              disabled={isJoining || buttonContent.disabled}
              className="w-full"
              variant={buttonContent.variant}
            >
              <buttonContent.icon className="h-4 w-4 mr-2" />
              {buttonContent.text}
            </Button>

            {/* Show info about registration date for future registrations */}
            {isRegistrationFuture && (
              <p className="text-xs text-orange-600 mt-2 text-center">
                Registration available from {new Date(squad?.voter_registration_date).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default SquadCard;
