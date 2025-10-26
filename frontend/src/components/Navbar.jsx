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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">🇰🇪</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">Pamoja2Vote</span>
            </button>

            {/* Login link for non-authenticated users */}
            <button
              onClick={handleLoginClick}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center hover:opacity-80 transition-opacity cursor-pointer"
          >
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center overflow-hidden">
            <img
              src="./images/Githinji.png"
              alt="Kenyan flag"
              className="w-full h-full object-cover"
            />
          </div>

            <span className="ml-2 text-xl font-bold text-gray-900">Pamoja2Vote</span>
          </button>

          {/* User actions */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">
              Hey, {user?.first_name || user?.phone_number} 👋
            </span>

            <button
              onClick={handleProfileClick}
              className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
            >
              <User className="w-5 h-5" />
            </button>

            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
