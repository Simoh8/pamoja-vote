import axios from 'axios';

// Create axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/auth/refresh/`,
            { refresh: refreshToken }
          );

          const { access } = response.data;
          localStorage.setItem('access_token', access);

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// API helper functions
export const authAPI = {
  // Sends OTP to the provided phone number. Uses the same endpoint
  // that previously initiated login + OTP on the backend.
  sendOTP: (phoneNumber) =>
    apiClient.post('/auth/login/', { phone_number: phoneNumber }),

  login: (phoneNumber) =>
    apiClient.post('/auth/login/', { phone_number: phoneNumber }),

  verifyOTP: (phoneNumber, otp) =>
    apiClient.post('/auth/verify-otp/', { phone_number: phoneNumber, otp }),

  refreshToken: (refreshToken) =>
    apiClient.post('/auth/refresh/', { refresh: refreshToken }),

  logout: () =>
    apiClient.post('/auth/logout/', { refresh_token: localStorage.getItem('refresh_token') }),

  getProfile: () =>
    apiClient.get('/auth/profile/'),

  updateProfile: (data) =>
    apiClient.patch('/auth/profile/', data),
};

export const squadAPI = {
  getSquads: (params = {}) =>
    apiClient.get('/squads/', { params }),

  getPublicSquads: () =>
    apiClient.get('/public/squads/'),

  getSquad: (id) =>
    apiClient.get(`/squads/${id}/`),

  createSquad: (data) =>
    apiClient.post('/squads/', data),

  joinSquad: (squadId) =>
    apiClient.post(`/squads/${squadId}/join/`),

  leaveSquad: (squadId) =>
    apiClient.post(`/squads/${squadId}/leave/`),

  getLeaderboard: (county) =>
    apiClient.get('/squads/leaderboard/', { params: { county } }),
};

export const centerAPI = {
  getCenters: (params = {}) =>
    apiClient.get('/centers/', { params }),

  getNearbyCenters: () =>
    apiClient.get('/centers/nearby/'),

  getCenter: (id) =>
    apiClient.get(`/centers/${id}/`),

  getCentersByCounty: (county) =>
    apiClient.get(`/centers/county/${county}/`),
};

export const eventAPI = {
  getEvents: (params = {}) =>
    apiClient.get('/events/', { params }),

  getEvent: (id) =>
    apiClient.get(`/events/${id}/`),

  createEvent: (data) =>
    apiClient.post('/events/', data),

  rsvpToEvent: (eventId, status) =>
    apiClient.post(`/events/${eventId}/rsvp/`, { status }),

  getUpcomingEvents: () =>
    apiClient.get('/events/upcoming/'),
};

export const inviteAPI = {
  sendInvite: (data) =>
    apiClient.post('/invites/', data),

  sendWhatsAppInvite: (data) =>
    apiClient.post('/invites/whatsapp/', data),

  sendBulkInvite: (data) =>
    apiClient.post('/invites/bulk/', data),
};
