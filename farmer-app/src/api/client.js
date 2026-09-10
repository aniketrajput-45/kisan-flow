import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

const TOKEN_KEY = 'kisanflow_farmer_token';

// In-memory token cache for fast synchronous reads after first load
let authToken = null;

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
    // AsyncStorage errors are non-fatal; in-memory token still works for the session
    console.warn('AsyncStorage setAuthToken error:', e);
  }
};

/**
 * Read token — from memory first, then AsyncStorage (async)
 */
export const getAuthToken = () => authToken;

/**
 * Load persisted token from AsyncStorage on app boot.
 * Call this once from AuthContext useEffect.
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

      if (status === 401) {
        // Token expired/invalid — clear it
        setAuthToken(null);
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
