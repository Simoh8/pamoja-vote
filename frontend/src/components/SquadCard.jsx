import { motion } from 'framer-motion';
import { Users, MapPin, Calendar, UserPlus, Clock, Star, Crown, Eye } from 'lucide-react';
import { Button } from './ui';
import Card from './Card';

const SquadCard = ({
  squad,
  isCurrentUserSquad = false,
  onJoin = () => {},
  onLeave = () => {},
  onClick = null,
  isJoining = false,
  showJoinButton = true,
  className = "",
  currentUser = null
}) => {
  // Safely check membership status
  const isUserMember = Boolean(isCurrentUserSquad);

  // Check if current user is the owner of this squad
  const isOwner = currentUser && squad.owner_id === currentUser.id;

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
  const canJoinThisSquad = !isUserMember && showJoinButton;

  const getButtonContent = () => {
    if (isUserMember) {
      return {
        text: isOwner ? "Manage Squad" : "View Squad",
        variant: isOwner ? "default" : "outline",
        icon: isOwner ? Users : Users,
        disabled: false,
        onClick: onClick ? () => onClick(squad) : undefined
      };
    }

    if (isRegistrationFuture) {
      return {
        text: "Join Squad (Pending)",
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

  // Check if this card should be clickable
  const isClickable = onClick && (isOwner || isUserMember);
  const cardClassName = `${isClickable ? 'cursor-pointer' : ''} ${className}`;

  const handleCardClick = (e) => {
    // Don't trigger if clicking on buttons or other interactive elements
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
      return;
    }
    if (isClickable && onClick) {
      onClick(squad);
    }
  };

  const buttonContent = getButtonContent();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: isClickable ? 1.02 : 1.01 }}
      transition={{ duration: 0.2 }}
      className={cardClassName}
      onClick={handleCardClick}
    >
      <Card className={`h-full flex flex-col ${isClickable ? 'ring-2 ring-blue-200 hover:ring-blue-300' : ''} transition-all duration-200`}>
        <div className="p-4 sm:p-6 flex-1">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3">
            <div className="flex items-start space-x-2 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{squad.name}</h3>
                <div className="flex items-center text-xs sm:text-sm text-gray-600 mt-1">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                  <span className="truncate">{squad.county}</span>
                </div>
              </div>
            </div>
            
            {/* Badges Section - Won't shrink */}
            <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end sm:space-y-2">
              {isOwner && (
                <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-bold shadow-xl border-2 border-white flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                  <Crown className="w-3 h-3 sm:w-4 sm:h-4 fill-current flex-shrink-0" />
                  <span className="whitespace-nowrap">Owner</span>
                </div>
              )}
              {isUserMember && !isOwner && (
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-full text-xs font-bold shadow-xl border-2 border-white flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current flex-shrink-0" />
                  <span className="whitespace-nowrap">Member</span>
                </div>
              )}
              {/* Click indicator for clickable cards */}
              {isClickable && (
                <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 opacity-75 flex-shrink-0">
                  <Eye className="w-3 h-3 flex-shrink-0" />
                  <span className="whitespace-nowrap">{isOwner ? 'Manage' : 'View'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-600 text-xs sm:text-sm mb-4 line-clamp-3">
            {squad.description}
          </p>

          {/* Registration Center */}
          {squad.registration_center && (
            <div className="mb-3 p-2 bg-blue-50 rounded-lg">
              <div className="flex items-center text-xs sm:text-sm text-blue-800">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                <span className="font-medium">Registration Center:</span>
              </div>
              <div className="text-xs sm:text-sm text-blue-700 ml-5 sm:ml-6">
                <div className="font-medium truncate">{squad.registration_center.name}</div>
                <div className="truncate">{squad.registration_center.location || squad.registration_center.address}, {squad.registration_center.county}</div>
                {squad.registration_center.constituency && (
                  <div className="text-blue-600 truncate">Constituency: {squad.registration_center.constituency}</div>
                )}
                {squad.registration_center.ward && (
                  <div className="text-blue-600 truncate">Ward: {squad.registration_center.ward}</div>
                )}
                {squad.registration_center.polling_station_name && (
                  <div className="text-green-600 truncate">Polling Station: {squad.registration_center.polling_station_name}</div>
                )}
              </div>
            </div>
          )}

          {/* Member Count */}
          <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 mb-4">
            <span>{squad.member_count || 0} members</span>
            <span className="text-right">
              {squad.max_members !== null && squad.max_members > 0
                ? `${squad.remaining_slots} of ${squad.max_members} slots left`
                : ''}
            </span>
          </div>

          {/* Registration Date */}
          {squad.voter_registration_date && (
            <div className={`mb-3 p-2 rounded-lg ${isRegistrationFuture ? 'bg-orange-50' : 'bg-green-50'}`}>
              <div className="flex items-center text-xs sm:text-sm text-green-800">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                <span className="font-medium">Registration Date:</span>
              </div>
              <div className="text-xs sm:text-sm text-green-700 ml-5 sm:ml-6">
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

        {/* Buttons Section */}
        {showJoinButton && !isUserMember && (
          <div className="p-4 sm:p-6 pt-0">
            <Button
              onClick={buttonContent.onClick}
              loading={isJoining && canJoinThisSquad}
              disabled={isJoining || buttonContent.disabled}
              className="w-full"
              variant={buttonContent.variant}
              size="sm"
            >
              <buttonContent.icon className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
              <span className="text-xs sm:text-sm">{buttonContent.text}</span>
            </Button>

            {/* Show info about registration date for future registrations */}
            {isRegistrationFuture && (
              <p className="text-xs text-orange-600 mt-2 text-center">
                Registration available from {new Date(squad?.voter_registration_date).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {/* Show management/view button for members when card is clickable */}
        {isUserMember && isClickable && (
          <div className="p-4 sm:p-6 pt-0">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                buttonContent.onClick();
              }}
              className="w-full"
              variant={buttonContent.variant}
              size="sm"
            >
              <buttonContent.icon className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
              <span className="text-xs sm:text-sm">{buttonContent.text}</span>
            </Button>
          </div>
        )}

        {/* Show disabled state message for owners with future registration */}
        {!showJoinButton && !isUserMember && isOwner && (
          <div className="p-4 sm:p-6 pt-0">
            <div className="w-full p-3 bg-orange-50 border border-orange-200 rounded-lg text-center">
              <p className="text-xs text-orange-700">
                You are the owner of a squad with a future registration date.
                You cannot join other squads until the registration date passes.
              </p>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default SquadCard;