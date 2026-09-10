import apiClient, { setAuthToken } from './client';

/**
 * Register a new Farmer
 * CRITICAL RULE: Public registration MUST NOT send a role.
 * Backend defaults role to FARMER.
 */
export const registerFarmer = async ({ name, phone, password }) => {
  const response = await apiClient.post('/auth/register', {
    name,
    phone,
    password,
  });

  if (response?.token) {
    await setAuthToken(response.token);
  } else if (response?.data?.token) {
    await setAuthToken(response.data.token);
  }
  return response;
};

/**
 * Login Farmer
 */
export const loginFarmer = async ({ phone, password }) => {
  const response = await apiClient.post('/auth/login', {
    phone,
    password,
  });

  if (response?.token) {
    await setAuthToken(response.token);
  } else if (response?.data?.token) {
    await setAuthToken(response.data.token);
  }
  return response;
};

/**
 * Logout Farmer (clears in-memory token; AsyncStorage cleared via AuthContext)
 */
export const logoutFarmer = () => {
  // Token cleared in AuthContext via setAuthToken(null)
};
