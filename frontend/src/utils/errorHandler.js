import { toast } from 'react-toastify';

/**
 * Handle API errors with appropriate user feedback
 * @param {Error} error - The error object from API calls
 * @param {Object} options - Configuration options
 */
export const handleApiError = (error, options = {}) => {
  const {
    showToast = true,
    toastType = 'error',
    fallbackMessage = 'An unexpected error occurred',
    redirectOn404 = false,
  } = options;

  console.error('API Error:', error);

  let message = fallbackMessage;
  let shouldRedirect = false;

  if (error?.status === 404 || error?.isNotFound) {
    message = error.message || 'The requested resource was not found';
    shouldRedirect = redirectOn404;
  } else if (error?.status === 403 || error?.isForbidden) {
    message = error.message || 'You do not have permission to access this resource';
  } else if (error?.status === 422 || error?.isValidationError) {
    message = error.message || 'Please check your input and try again';
  } else if (error?.status === 401) {
    message = 'Your session has expired. Please log in again.';
    // Auth errors are handled by the interceptor
    return;
  } else if (error?.isNetworkError) {
    message = 'Network error - please check your connection';
  } else if (error?.message) {
    message = error.message;
  }

  if (showToast) {
    toast[toastType](message, {
      position: "top-center",
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "light",
    });
  }

  if (shouldRedirect && typeof window !== 'undefined') {
    // Could redirect to 404 page or handle appropriately
    return;
  }

  return message;
};

/**
 * Check if an error is a 404 error
 * @param {Error} error - The error object
 * @returns {boolean} - True if it's a 404 error
 */
export const is404Error = (error) => {
  return error?.status === 404 || error?.isNotFound === true;
};

/**
 * Check if an error is a network error
 * @param {Error} error - The error object
 * @returns {boolean} - True if it's a network error
 */
export const isNetworkError = (error) => {
  return error?.isNetworkError === true || error?.status === 0;
};
