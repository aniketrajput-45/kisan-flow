import apiClient from './client';

/**
 * Fetch Payment Status for a booking
 * Endpoint: GET /api/payments/:bookingId
 * 
 * CRITICAL RULE:
 * The frontend MUST NEVER calculate final payment amount independently.
 * Amount, status, reference_number MUST come strictly from the backend response.
 */
export const getPaymentStatus = async (bookingId) => {
  return await apiClient.get(`/payments/${bookingId}`);
};
