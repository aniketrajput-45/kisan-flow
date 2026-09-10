import apiClient from './client';

/**
 * Fetch available slots for a selected Procurement Centre and Date
 * Endpoint: GET /api/slots?centreId=<centreId>&date=<YYYY-MM-DD>
 */
export const getSlots = async (centreId, date) => {
  return await apiClient.get('/slots', {
    params: {
      centreId,
      date,
    },
  });
};
