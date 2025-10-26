import { useAuth } from '../context/AuthContext';
import { User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  // If user is not authenticated, show minimal navbar
  if (!isAuthenticated) {
    return (
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-12 sm:h-14 md:h-16">
            {/* Logo */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs">🇰🇪</span>
              </div>
              <span className="ml-2 text-lg sm:text-xl font-bold text-gray-900 truncate">
                Pamoja2Vote
              </span>
            </button>

            {/* Login link for non-authenticated users */}
            <button
              onClick={handleLoginClick}
              className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors px-2 py-1 rounded hover:bg-blue-50"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>
    );
  }

  // Authenticated user navbar
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-12 sm:h-14 md:h-16">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center hover:opacity-80 transition-opacity cursor-pointer min-w-0 flex-1 sm:flex-none"
          >
            <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">🇰🇪</span>
            </div>
            <span className="ml-2 text-lg sm:text-xl font-bold text-gray-900 truncate">
              Pamoja2Vote
            </span>
          </button>

          {/* User actions */}
          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 lg:space-x-4">
            {/* Welcome message - hidden on smallest screens */}
            <span className="text-xs text-gray-700 hidden xs:inline sm:text-sm">
              Hey, <span className="hidden sm:inline">{user?.first_name || user?.phone_number}</span> 👋
            </span>

            {/* Profile button with responsive text */}
            <button
              onClick={handleProfileClick}
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 min-w-[44px] min-h-[44px] px-2 sm:px-3 transition-colors"
            >
              <User className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="text-xs sm:text-sm hidden sm:inline">Profile</span>
            </button>

            {/* Logout button with responsive text */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 min-w-[44px] min-h-[44px] px-2 sm:px-3 transition-colors"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="text-xs sm:text-sm hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;