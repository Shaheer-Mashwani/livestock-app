import axios from 'axios';

// The base URL of our backend server
// All requests will start with this prefix
const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// ── REQUEST INTERCEPTOR ───────────────────────────────────────
// This runs automatically before EVERY request we send
// It attaches the JWT token from localStorage to the headers
API.interceptors.request.use((config) => {
  // Get the token we saved when the user logged in
  const token = localStorage.getItem('token');

  if (token) {
    // Add it to the Authorization header
    // The backend's protect middleware reads this header
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── RESPONSE INTERCEPTOR ─────────────────────────────────────
// Runs after every response — if we get a 401 (Unauthorized),
// it means the token expired. Log the user out automatically.
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── AUTH API CALLS ────────────────────────────────────────────
export const loginUser  = (data) => API.post('/auth/login', data);
export const getMe      = ()     => API.get('/auth/me');
export const seedUsers  = ()     => API.post('/auth/seed');

// ── FARMER API CALLS ─────────────────────────────────────────
// params is an object like { district: 'Peshawar', solar: true }
export const getFarmers       = (params) => API.get('/farmers', { params });
export const getFarmerById    = (id)     => API.get(`/farmers/${id}`);
export const createFarmer     = (data)   => API.post('/farmers', data);
export const updateFarmer     = (id, data) => API.put(`/farmers/${id}`, data);
export const deleteFarmer     = (id)     => API.delete(`/farmers/${id}`);
export const getDashboardStats= ()       => API.get('/farmers/stats');

export default API;
