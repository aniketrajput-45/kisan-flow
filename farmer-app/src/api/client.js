import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

const TOKEN_KEY = 'kisanflow_farmer_token';
const USER_KEY = 'kisanflow_farmer_user';

// In-memory token cache for fast synchronous reads after first load
let authToken = null;
let onUnauthorizedCallback = null;

/**
 * Register a listener to be called on 401 Unauthorized errors (e.g. to log out user in AuthContext)
 */
export const setOnUnauthorizedCallback = (cb) => {
  onUnauthorizedCallback = cb;
};

/**
 * Save token to both memory and persistent AsyncStorage
 */
export const setAuthToken = async (token) => {
  authToken = token;
  try {
    if (token) {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } else {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
  } catch (e) {
    console.warn('AsyncStorage setAuthToken error:', e);
  }
};

/**
 * Save user object to persistent AsyncStorage
 */
export const setAuthUser = async (user) => {
  try {
    if (user) {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem(USER_KEY);
    }
  } catch (e) {
    console.warn('AsyncStorage setAuthUser error:', e);
  }
};

/**
 * Read token — from memory first, then AsyncStorage (async)
 */
export const getAuthToken = () => authToken;

/**
 * Load persisted token from AsyncStorage on app boot.
 */
export const loadStoredToken = async () => {
  try {
    const stored = await AsyncStorage.getItem(TOKEN_KEY);
    if (stored) {
      authToken = stored;
    }
    return stored;
  } catch (e) {
    console.warn('AsyncStorage loadStoredToken error:', e);
    return null;
  }
};

/**
 * Load persisted user from AsyncStorage on app boot.
 */
export const loadStoredUser = async () => {
  try {
    const stored = await AsyncStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.warn('AsyncStorage loadStoredUser error:', e);
    return null;
  }
};

// Create Axios Instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: attach Bearer token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: centralized HTTP error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let formattedError = {
      status: 0,
      message: 'Network error or server unavailable. Please try again.',
      data: null,
    };

    if (error.response) {
      const { status, data } = error.response;
      formattedError.status = status;
      formattedError.message =
        data?.error || data?.message || getErrorMessageByStatus(status);
      formattedError.data = data;

      const isAuthError =
        status === 401 ||
        (formattedError.message &&
          (formattedError.message.includes('foreign key constraint') ||
           formattedError.message.includes('bookings_user_id_fkey') ||
           formattedError.message.includes('User session invalid')));

      if (isAuthError) {
        // Token expired/invalid — clear token & user from memory & AsyncStorage and notify AuthContext
        setAuthToken(null);
        setAuthUser(null);
        if (onUnauthorizedCallback) {
          onUnauthorizedCallback();
        }
      }
    }

    return Promise.reject(formattedError);
  }
);

function getErrorMessageByStatus(status) {
  switch (status) {
    case 400: return 'Invalid request. Please check your details.';
    case 401: return 'Session expired. Please log in again.';
    case 403: return 'You do not have permission to perform this action.';
    case 404: return 'Requested resource not found.';
    case 409: return 'Slot capacity reached or duplicate booking conflict.';
    case 500: return 'Internal server error. Please try again later.';
    default:  return 'An unexpected error occurred.';
  }
}

export default apiClient;
