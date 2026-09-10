import apiClient from './client';

/**
 * Fetch all active Procurement Centres
 * Endpoint: GET /api/centres
 */
export const getCentres = async () => {
  return await apiClient.get('/centres');
};
