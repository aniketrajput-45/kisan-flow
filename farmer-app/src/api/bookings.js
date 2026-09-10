import apiClient from './client';

/**
 * Create a new slot booking
 * Endpoint: POST /api/bookings
 * 
 * CRITICAL RULE:
 * The frontend MUST ONLY send: centre_id, slot_id, crop, quantity_kg.
 * Do NOT send farmer_id, booking_date, token_number, qr_code, officer_id, total_amount.
 * Backend derives user identity from JWT and validates slot availability.
 */
export const createBooking = async ({ centre_id, slot_id, crop, quantity_kg }) => {
  const payload = {
    centre_id: Number(centre_id),
    slot_id: Number(slot_id),
    crop: String(crop),
    quantity_kg: Number(quantity_kg),
  };

  return await apiClient.post('/bookings', payload);
};

/**
 * Fetch all bookings belonging to the currently authenticated Farmer
 * Endpoint: GET /api/bookings/my
 */
export const getMyBookings = async () => {
  return await apiClient.get('/bookings/my');
};

/**
 * Fetch details for a specific booking
 * Endpoint: GET /api/bookings/:id
 */
export const getBookingById = async (bookingId) => {
  return await apiClient.get(`/bookings/${bookingId}`);
};
