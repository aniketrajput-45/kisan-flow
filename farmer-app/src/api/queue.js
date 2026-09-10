import apiClient from './client';

/**
 * Mark farmer arrival at procurement centre
 * Endpoint: POST /api/queue/arrive
 */
export const markArrival = async (bookingId) => {
  return await apiClient.post('/queue/arrive', {
    booking_id: Number(bookingId),
  });
};

/**
 * Fetch Live Queue Status & ETA for a specific booking
 * Endpoint: GET /api/queue/:bookingId
 * 
 * Expected backend fields:
 * - booking_id
 * - token / your_token
 * - centre_id
 * - status (BOOKED | ARRIVED | IN_QUEUE | PROCESSING | COMPLETED)
 * - queue_position
 * - people_ahead
 * - estimated_wait_minutes
 * - currently_processing
 */
export const getQueueStatus = async (bookingId) => {
  try {
    const response = await apiClient.get(`/queue/${bookingId}`);
    return response;
  } catch (error) {
    // If backend queue endpoint is still being wired, throw formatted error to caller
    throw error;
  }
};
