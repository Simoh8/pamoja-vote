import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ArrowLeft, Users, MapPin, Search, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, Card } from '../components/ui';
import Navbar from '../components/Navbar';

const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Analyze the URL to provide contextual suggestions
  const getContextualMessage = () => {
    const path = location.pathname.toLowerCase();

    if (path.includes('/squads/') || path.includes('/squad')) {
      return {
        title: "Squad Not Found",
        message: "This squad doesn't exist or you don't have permission to view it. Check the squad ID or browse available squads.",
        suggestions: [
          { icon: Users, text: "Browse Squads", action: () => navigate('/join-squad') },
          { icon: MapPin, text: "Find Centers", action: () => navigate('/find-centers') },
        ]
      };
    }

    if (path.includes('/centers/') || path.includes('/center')) {
      return {
        title: "Registration Center Not Found",
        message: "This registration center doesn't exist. Try browsing all available centers in your area.",
        suggestions: [
          { icon: MapPin, text: "Find Centers", action: () => navigate('/find-centers') },
          { icon: Search, text: "Search Centers", action: () => navigate('/centers') },
        ]
      };
    }

    if (path.includes('/events/') || path.includes('/event')) {
      return {
        title: "Event Not Found",
        message: "This event doesn't exist or has been cancelled. Check out upcoming events in your area.",
        suggestions: [
          { icon: Users, text: "View Events", action: () => navigate('/events') },
          { icon: MapPin, text: "Find Centers", action: () => navigate('/find-centers') },
        ]
      };
    }

    return {
      title: "Page Not Found",
      message: "The page you're looking for doesn't exist or has been moved. Let's get you back on track!",
      suggestions: [
        { icon: Users, text: "Join Squad", action: () => navigate('/join-squad') },
        { icon: MapPin, text: "Find Centers", action: () => navigate('/find-centers') },
      ]
    };
  };

  const contextual = getContextualMessage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Show navbar if user is authenticated */}
      {user && <Navbar />}

      <div className="flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-lg"
        >
          {/* 404 Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-32 h-32 bg-gradient-to-br from-red-400 to-red-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl"
          >
            <AlertTriangle className="w-16 h-16 text-white" />
          </motion.div>

          {/* Contextual Title */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold text-gray-900 mb-2"
          >
            404
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-2xl font-semibold text-gray-700 mb-4"
          >
            {contextual.title}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-gray-600 mb-8 leading-relaxed"
          >
            {contextual.message}
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-4"
          >
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate(user ? '/' : '/login')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <Home className="w-5 h-5 mr-2" />
                {user ? 'Go to Dashboard' : 'Go Home'}
              </Button>

              {user && (
                <Button
                  onClick={() => navigate(-1)}
                  variant="outline"
                  className="px-8 py-3 rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Go Back
                </Button>
              )}
            </div>

            {/* Contextual Navigation */}
            {user && contextual.suggestions && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="pt-6"
              >
                <p className="text-sm text-gray-500 mb-4">Try these instead:</p>
                <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                  {contextual.suggestions.map((suggestion, index) => (
                    <Card
                      key={index}
                      className="p-4 text-center cursor-pointer hover:shadow-lg transition-all duration-200 hover:bg-blue-50"
                      onClick={suggestion.action}
                    >
                      <suggestion.icon className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700">{suggestion.text}</p>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-8 p-4 bg-gray-100 rounded-lg text-left text-xs text-gray-500"
            >
              <p className="font-mono">Path: {location.pathname}</p>
              <p className="font-mono">Search: {location.search}</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;


