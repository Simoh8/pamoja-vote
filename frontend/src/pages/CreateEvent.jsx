import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, ArrowLeft } from 'lucide-react';
import { eventAPI } from '../api';
import { Button, Input, Card, Alert } from '../components/ui';

const CreateEvent = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    squad_id: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const createEventMutation = useMutation({
    mutationFn: (data) => eventAPI.createEvent(data),
    onSuccess: (data) => {
      setError('');
      // Navigate back to events list or dashboard
      navigate('/');
    },
    onError: (error) => {
      setError(error.response?.data?.message || 'Failed to create event');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim() || !formData.date.trim() || !formData.location.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    const submitData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      date: formData.date.trim(),
      location: formData.location.trim(),
      ...(formData.squad_id && { squad_id: formData.squad_id.trim() }),
    };

    createEventMutation.mutate(submitData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Event</h1>
          <p className="text-gray-600">Organize voter registration drives and awareness events</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6">
            {error && (
              <Alert
                type="error"
                message={error}
                onDismiss={() => setError('')}
                dismissible
                className="mb-6"
              />
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Input
                  id="title"
                  label="Event Title *"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Enter event title"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Describe your event..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  required
                />
              </div>

              <div>
                <Input
                  id="date"
                  label="Event Date & Time *"
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  required
                />
              </div>

              <div>
                <Input
                  id="location"
                  label="Location *"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="Enter event location"
                  required
                />
              </div>

              <div>
                <Input
                  id="squad_id"
                  label="Squad (Optional)"
                  value={formData.squad_id}
                  onChange={(e) => handleChange('squad_id', e.target.value)}
                  placeholder="Link to a specific squad"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to make this a public event, or enter squad ID to associate with a squad.
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate('/')}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  type="submit"
                  loading={createEventMutation.isPending}
                  disabled={createEventMutation.isPending}
                  className="flex-1"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-2">Tips for Creating Great Events</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Choose a clear, engaging title that attracts participants</li>
              <li>• Provide detailed information about the event purpose and activities</li>
              <li>• Set a convenient date and time for your target audience</li>
              <li>• Choose an accessible location for maximum participation</li>
            </ul>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateEvent;
