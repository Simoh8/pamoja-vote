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
    <div className="flex justify-between items-center mb-10">
      <div>
        <h1 className="text-5xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Profile
        </h1>
        <p className="text-gray-600 mt-2 text-lg">Manage your personal information</p>
      </div>
      {!isEditing ? (
        <Button
          onClick={() => setIsEditing(true)}
          variant="primary"
          size="lg"
          className="shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300 bg-gradient-to-r from-blue-600 to-purple-600 border-0"
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Profile
          </span>
        </Button>
      ) : (
        <div className="flex items-center gap-4 bg-yellow-50 px-4 py-3 rounded-2xl border border-yellow-200">
          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
          <span className="text-yellow-800 font-semibold text-sm">Editing Mode</span>
          <Button onClick={handleCancel} variant="ghost" size="sm" className="text-yellow-700 hover:bg-yellow-100">
            Cancel
          </Button>
        </div>
      )}
    </div>
  );

  const renderProfileHeader = () => (
    <div className="text-center mb-10 relative">
      <div className="relative inline-block">
        <div className="w-40 h-40 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl ring-4 ring-white/60 relative overflow-hidden">
          <span className="text-5xl font-black text-white">
            {getUserInitials()}
          </span>
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-full"></div>
        </div>
      </div>
      <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
        {formData.first_name} {formData.last_name}
      </h2>
      <div className="flex items-center justify-center gap-2 text-gray-600 text-lg">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
        <span className="font-mono">{user?.phone_number}</span>
      </div>
    </div>
  );

  const renderReadOnlyView = () => (
    <div className="grid grid-cols-1 gap-6">
      <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300">
        <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          First Name
        </label>
        <p className="text-gray-900 text-xl font-semibold">{user?.first_name || 'Not set'}</p>
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300">
        <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Last Name
        </label>
        <p className="text-gray-900 text-xl font-semibold">{user?.last_name || 'Not set'}</p>
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300">
        <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          County
        </label>
        <p className="text-gray-900 text-xl font-semibold">{user?.county || 'Not set'}</p>
      </div>

    </div>
  );

  const renderEditableView = () => (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <Input
          id="first_name"
          label="First Name"
          name="first_name"
          value={formData.first_name}
          onChange={handleInputChange}
          placeholder="Enter your first name"
          className="transform transition-all duration-300 hover:scale-[1.02]"
        />

        <Input
          id="last_name"
          label="Last Name"
          name="last_name"
          value={formData.last_name}
          onChange={handleInputChange}
          placeholder="Enter your last name"
          className="transform transition-all duration-300 hover:scale-[1.02]"
        />

        <div className="space-y-3">
          <label htmlFor="county" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            className="block w-full px-5 py-4 border-2 border-gray-300/80 rounded-2xl bg-white/90 focus:ring-3 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none transition-all duration-300 shadow-sm hover:shadow-md"
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
        className="flex gap-4 pt-8 border-t border-gray-200/60"
      >
        <Button
          onClick={handleSave}
          variant="primary"
          loading={loading}
          className="flex-1 shadow-2xl hover:shadow-3xl transform hover:-translate-y-0.5 transition-all duration-300 bg-gradient-to-r from-green-600 to-emerald-600 border-0 text-lg font-semibold py-4"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
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
          className="flex-1 border-2 border-gray-300/80 text-gray-700 hover:border-gray-400/80 hover:bg-gray-50/80 text-lg font-semibold py-4 transition-all duration-300"
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
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 py-8"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {renderHeader()}

        <div className="max-w-2xl mx-auto">
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-md rounded-3xl overflow-hidden border border-white/20">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5"></div>
            <div className="relative">
              {renderProfileHeader()}

              <div className="px-8 pb-8">
                {error && (
                  <Alert type="error" message={error} className="mb-6 rounded-2xl border-l-4 border-red-500" />
                )}

                {success && (
                  <Alert type="success" message={success} className="mb-6 rounded-2xl border-l-4 border-green-500" />
                )}

                <div className="space-y-8">
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