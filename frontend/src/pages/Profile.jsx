import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Alert from '../components/ui/Alert';

// Constants
const KENYA_COUNTIES = [
  'BOMET', 'BUNGOMA', 'BUSIA', 'ELGEYO-MARAKWET', 'EMBU', 'GARISSA',
  'HOMA BAY', 'ISIOLO', 'KAJIADO', 'KAKAMEGA', 'KERICHO', 'KIAMBU',
  'KILIFI', 'KIRINYAGA', 'KISII', 'KISUMU', 'KITUI', 'KWALE',
  'LAIKIPIA', 'LAMU', 'MACHAKOS', 'MAKUENI', 'MANDERA', 'MARSABIT',
  'MERU', 'MIGORI', 'MOMBASA', 'MURANGA', 'NAIROBI', 'NAKURU',
  'NANDI', 'NAROK', 'NYAMIRA', 'NYANDARUA', 'NYERI', 'SAMBURU',
  'SIAYA', 'TAITA TAVETA', 'TANA RIVER', 'THARAKA - NITHI',
  'TRANS NZOIA', 'TURKANA', 'UASIN GISHU', 'VIHIGA', 'WAJIR',
  'WEST POKOT'
];

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    county: user?.county || '',
  });

  // Effects
  useEffect(() => {
    setFormData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      county: user?.county || '',
    });
  }, [user]);

  // Event Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleCancel = () => {
    setFormData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      county: user?.county || '',
    });
    setIsEditing(false);
    setError('');
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authAPI.updateProfile(formData);

      if (response.data) {
        updateUser(response.data);
      } else if (response.user) {
        updateUser(response.user);
      } else {
        try {
          const profileResponse = await authAPI.getProfile();
          updateUser(profileResponse);
        } catch (profileErr) {
          console.error('Failed to fetch updated profile:', profileErr);
        }
      }

      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Profile update error:', err);

      if (err.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else {
        setError(err.message || 'Failed to update profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getUserInitials = () => {
    return formData.first_name?.[0] || user?.phone_number?.[0] || 'U';
  };

  // Render Components
  const renderHeader = () => (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Profile
        </h1>
        <p className="text-gray-600 mt-1 text-base">Manage your personal information</p>
      </div>
      {!isEditing ? (
        <Button
          onClick={() => setIsEditing(true)}
          variant="primary"
          size="lg"
          className="shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 bg-gradient-to-r from-blue-600 to-purple-600 border-0"
        >
          <span className="flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Profile
          </span>
        </Button>
      ) : (
        <div className="flex items-center gap-3 bg-yellow-50 px-3 py-2 rounded-xl border border-yellow-200">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
          <span className="text-yellow-800 font-medium text-sm">Editing Mode</span>
          <Button onClick={handleCancel} variant="ghost" size="sm" className="text-yellow-700 hover:bg-yellow-100 text-xs">
            Cancel
          </Button>
        </div>
      )}
    </div>
  );

  const renderProfileHeader = () => (
    <div className="text-center mb-8 relative">
      <div className="relative inline-block">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl ring-4 ring-white/60 relative overflow-hidden">
          <span className="text-2xl font-bold text-white">
            {getUserInitials()}
          </span>
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-full"></div>
        </div>
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-1">
        {formData.first_name} {formData.last_name}
      </h2>
      <div className="flex items-center justify-center gap-2 text-gray-600 text-sm">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
        <span className="font-mono">{user?.phone_number}</span>
      </div>
    </div>
  );

  const renderReadOnlyView = () => (
    <div className="grid grid-cols-1 gap-4">
      <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300">
        <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2 uppercase tracking-wide">
          <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          First Name
        </label>
        <p className="text-gray-900 text-base font-medium">{user?.first_name || 'Not set'}</p>
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300">
        <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2 uppercase tracking-wide">
          <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Last Name
        </label>
        <p className="text-gray-900 text-base font-medium">{user?.last_name || 'Not set'}</p>
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300">
        <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2 uppercase tracking-wide">
          <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          County
        </label>
        <p className="text-gray-900 text-base font-medium">{user?.county || 'Not set'}</p>
      </div>
    </div>
  );

  const renderEditableView = () => (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <Input
          id="first_name"
          label="First Name"
          name="first_name"
          value={formData.first_name}
          onChange={handleInputChange}
          placeholder="Enter your first name"
          className="transform transition-all duration-300 hover:scale-[1.01]"
        />

        <Input
          id="last_name"
          label="Last Name"
          name="last_name"
          value={formData.last_name}
          onChange={handleInputChange}
          placeholder="Enter your last name"
          className="transform transition-all duration-300 hover:scale-[1.01]"
        />

        <div className="space-y-2">
          <label htmlFor="county" className="block text-sm font-medium text-gray-700 flex items-center gap-2">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            County
          </label>
          <select
            id="county"
            name="county"
            value={formData.county}
            onChange={handleInputChange}
            className="block w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none transition-all duration-300 shadow-sm hover:shadow-md text-sm"
          >
            <option value="">Select your county</option>
            {KENYA_COUNTIES.map(county => (
              <option key={county} value={county}>{county}</option>
            ))}
          </select>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex gap-3 pt-6 border-t border-gray-200/60"
      >
        <Button
          onClick={handleSave}
          variant="primary"
          loading={loading}
          className="flex-1 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 bg-gradient-to-r from-green-600 to-emerald-600 border-0 text-base font-medium py-3"
        >
          {loading ? (
            <span className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          ) : (
            'Save Changes'
          )}
        </Button>
        <Button
          onClick={handleCancel}
          variant="secondary"
          disabled={loading}
          className="flex-1 border border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 text-base font-medium py-3 transition-all duration-300"
        >
          Cancel
        </Button>
      </motion.div>
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 py-6 relative overflow-hidden"
    >
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-purple-100/20"></div>
      <div className="absolute top-0 left-0 w-72 h-72 bg-blue-300/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-300/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-green-300/5 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {renderHeader()}

        <div className="max-w-md mx-auto">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/20 relative">
            {/* Card Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 via-transparent to-purple-500/3"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
            
            <div className="relative">
              {renderProfileHeader()}

              <div className="px-6 pb-6">
                {error && (
                  <Alert type="error" message={error} className="mb-4 rounded-xl border-l-4 border-red-500 text-sm" />
                )}

                {success && (
                  <Alert type="success" message={success} className="mb-4 rounded-xl border-l-4 border-green-500 text-sm" />
                )}

                <div className="space-y-6">
                  {!isEditing ? renderReadOnlyView() : renderEditableView()}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default Profile;