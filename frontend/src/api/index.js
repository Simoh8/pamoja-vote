/**
 * Centralized API Layer for PamojaVote
 * Provides consistent error handling, request/response interceptors, and typed API responses
 */

import axios from 'axios';

// API Response Types (JSDoc for type documentation)
/**
 * @typedef {Object} ApiResponse
 * @property {any} data - The response data
 * @property {string} [message] - Optional message
 * @property {number} status - HTTP status code
 * @property {boolean} success - Success indicator
 */

/**
 * @typedef {Object} ApiError
 * @property {string} message - Error message
 * @property {number} status - HTTP status code
 * @property {Object} [errors] - Field-specific errors
 */

// API Client Configuration
class ApiClient {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

    // Initialize axios client
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    });

    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh and errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 errors (token expired)
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              const response = await axios.post(
                `${this.baseURL}/auth/refresh/`,
                { refresh: refreshToken }
              );

              const { access } = response.data;
              localStorage.setItem('access_token', access);

              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${access}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            this.handleAuthError();
          }
        }

        return Promise.reject(this.transformError(error));
      }
    );
  }

  handleAuthError() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');

    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  transformError(error) {
    if (error.response) {
      // Handle DRF validation errors in non_field_errors format
      const data = error.response.data || {};

      return {
        message: data.non_field_errors?.[0] ||
                data.detail ||
                data.message ||
                data.error ||
                'An error occurred',
        status: error.response.status,
        errors: data.errors || data,
        response: error.response,
      };
    }

    if (error.request) {
      return {
        message: 'Network error - please check your connection',
        status: 0,
        response: error.response,
      };
    }

    return {
      message: error.message || 'Unknown error occurred',
      status: 0,
      response: error.response,
    };
  }

  // Generic request methods
  async get(url, params) {
    const response = await this.client.get(url, { params });
    return response.data;
  }

  async post(url, data) {
    const response = await this.client.post(url, data);
    return response.data;
  }

  async put(url, data) {
    const response = await this.client.put(url, data);
    return response.data;
  }

  async patch(url, data) {
    const response = await this.client.patch(url, data);
    return response.data;
  }

  async delete(url) {
    const response = await this.client.delete(url);
    return response.data;
  }
}

// Create singleton instance
const apiClient = new ApiClient();

// API Modules
export const authAPI = {
  // Send OTP for login
  sendOTP: (phoneNumber) =>
    apiClient.post('/auth/login/', {
      phone_number: phoneNumber,
    }),

  // Verify OTP and get tokens
  verifyOTP: (phoneNumber, otp) =>
    apiClient.post('/auth/verify-otp/', {
      phone_number: phoneNumber,
      otp,
    }),

  // Refresh access token
  refreshToken: (refreshToken) =>
    apiClient.post('/auth/refresh/', {
      refresh: refreshToken,
    }),

  // Logout (blacklist refresh token)
  logout: () =>
    apiClient.post('/auth/logout/', {
      refresh_token: localStorage.getItem('refresh_token'),
    }),

  // Get user profile
  getProfile: () =>
    apiClient.get('/auth/profile/'),

  // Update user profile
  updateProfile: (data) =>
    apiClient.patch('/auth/profile/', data),
};

export const squadAPI = {
  // Get all squads with optional filters
  getSquads: (params) =>
    apiClient.get('/squads/', params),

  // Get public squads
  getPublicSquads: () =>
    apiClient.get('/public/squads/'),

  // Get specific squad
  getSquad: (id) =>
    apiClient.get(`/squads/${id}/`),

  // Create new squad
  createSquad: (data) =>
    apiClient.post('/squads/', data),

  // Join squad
  joinSquad: (squadId) =>
    apiClient.post(`/squads/${squadId}/join/`),

  // Leave squad
  leaveSquad: (squadId) =>
    apiClient.post(`/squads/${squadId}/leave/`),

  // Get user's squads
  getMySquads: () =>
    apiClient.get('/squads/my_squads/'),

  // Get user's membership
  getMyMembership: () =>
    apiClient.get('/squads/my_membership/'),

  // Clear user's membership (for debugging)
  clearMembership: () =>
    apiClient.delete('/squads/clear_membership/'),

  // Get squad members
  getSquadMembers: (squadId) =>
    apiClient.get(`/squads/${squadId}/members/`),

  // Send message to squad members
  sendSquadMessage: (squadId, data) =>
    apiClient.post(`/squads/${squadId}/message/`, data),
};

export const centerAPI = {
  // Get all voting centers
  getCenters: (params) =>
    apiClient.get('/centers/', params),

  // Get nearby centers (requires geolocation)
  // getNearbyCenters: () =>
  //   apiClient.get('/centers/nearby/'),

  // Get specific center
  getCenter: (id) =>
    apiClient.get(`/centers/${id}/`),

  // Get centers by county
  getCentersByCounty: (county) =>
    apiClient.get(`/centers/county/${county}/`),
};

export const eventAPI = {
  // Get events with optional filters
  getEvents: (params) =>
    apiClient.get('/events/', params),

  // Get specific event
  getEvent: (id) =>
    apiClient.get(`/events/${id}/`),

  // Create new event
  createEvent: (data) =>
    apiClient.post('/events/', data),

  // RSVP to event
  rsvpToEvent: (eventId, status) =>
    apiClient.post(`/events/${eventId}/rsvp/`, { status }),

  // Get upcoming events
  getUpcomingEvents: () =>
    apiClient.get('/events/upcoming/'),
};

export const inviteAPI = {
  // Send invite to phone number
  sendInvite: (data) =>
    apiClient.post('/invites/', data),

  // Send WhatsApp invite
  sendWhatsAppInvite: (data) =>
    apiClient.post('/invites/whatsapp/', data),

  // Send bulk invites
  sendBulkInvite: (data) =>
    apiClient.post('/invites/bulk/', data),
};

// Export the configured client for direct use if needed
export { apiClient };

// Utility function to check if user is authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem('access_token');
};

// Utility function to get current user
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

export default apiClient;
