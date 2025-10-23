import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from './context/AuthContext';
import { AnimatePresence } from 'framer-motion';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Squad from './pages/Squad';
import JoinSquad from './pages/JoinSquad';
import CreateSquad from './pages/CreateSquad';
import Centers from './pages/Centers';
import FindCenters from './pages/FindCenters';
import CreateEvent from './pages/CreateEvent';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Components
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import PrivateRoute from './components/PrivateRoute';
import Loading from './components/Loading';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <AnimatePresence mode="wait">
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />

                {/* Dashboard redirect for /dashboard URL */}
                <Route path="/dashboard" element={<Navigate to="/" replace />} />

                {/* Protected routes */}
                <Route
                  path="/"
                  element={
                    <PrivateRoute>
                      <div className="pb-16">
                        <Navbar />
                        <Dashboard />
                      </div>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/squad"
                  element={
                    <PrivateRoute>
                      <div className="pb-16">
                        <Navbar />
                        <Squad />
                      </div>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/join-squad"
                  element={
                    <PrivateRoute>
                      <div className="pb-16">
                        <Navbar />
                        <JoinSquad />
                      </div>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/squad/create"
                  element={
                    <PrivateRoute>
                      <div className="pb-16">
                        <Navbar />
                        <CreateSquad />
                      </div>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/centers"
                  element={
                    <PrivateRoute>
                      <div className="pb-16">
                        <Navbar />
                        <Centers />
                      </div>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/find-centers"
                  element={
                    <div className="pb-16">
                      <Navbar />
                      <FindCenters />
                    </div>
                  }
                />

                <Route
                  path="/event/create"
                  element={
                    <PrivateRoute>
                      <div className="pb-16">
                        <Navbar />
                        <CreateEvent />
                      </div>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/leaderboard"
                  element={
                    <PrivateRoute>
                      <div className="pb-16">
                        <Navbar />
                        <Leaderboard />
                      </div>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/profile"
                  element={
                    <PrivateRoute>
                      <div className="pb-16">
                        <Navbar />
                        <Profile />
                      </div>
                    </PrivateRoute>
                  }
                />

                {/* 404 page */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AnimatePresence>

            {/* Bottom navigation for mobile */}
            <BottomNav />

            {/* Toast Container */}
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
              style={{
                zIndex: 9999,
              }}
            />
          </div>
        </Router>

        {/* React Query DevTools (only in development) */}
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;