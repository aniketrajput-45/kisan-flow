import Constants from 'expo-constants';

/**
 * Centralized API & App Configuration for KisanFlow Farmer App
 *
 * Backend host IP: 10.237.111.4
 * Backend port: 5000
 * API Base URL: http://10.237.111.4:5000/api
 */

const getApiBaseUrl = () => {
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
    if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
  }

  // Target backend laptop on local network
  return 'http://10.237.111.4:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();

export const DEMO_FARMER_CREDENTIALS = {
  name: 'Ramesh Kumar',
  phone: '9876543210',
  password: 'password123'
};

