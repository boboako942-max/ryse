import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle errors better
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error
      console.error('API Error Response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      // Request made but no response
      console.error('API No Response:', error.request);
    } else {
      // Error in request setup
      console.error('API Request Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  googleLogin: (data) => api.post('/auth/google-login', data),
  facebookLogin: (data) => api.post('/auth/facebook-login', data),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/update-profile', data),
  logout: () => api.post('/auth/logout'),
};

// Products API
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  addReview: (id, data) => api.post(`/products/${id}/review`, data),
};

// Categories API
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// Cart API
export const cartAPI = {
  getCart: () => api.get('/cart'),
  addToCart: (data) => api.post('/cart/add', data),
  updateItem: (data) => api.put('/cart/update', data),
  removeFromCart: (data) => api.post('/cart/remove', data),
  clearCart: () => api.delete('/cart/clear'),
};

// Orders API
export const ordersAPI = {
  getAll: () => api.get('/orders'),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  updateStatus: (id, data) => api.put(`/orders/${id}`, data),
  cancel: (id) => api.delete(`/orders/${id}`),
  getAllAdmin: (params) => api.get('/orders/admin/all', { params }),
};

// Payments API
export const paymentsAPI = {
  createCheckoutSession: (data) => api.post('/payments/create-checkout-session', data),
  verifyPayment: (data) => api.post('/payments/verify', data),
  getHistory: () => api.get('/payments/history'),
  refund: (data) => api.post('/payments/refund', data),
  // GCash Payment Methods
  createGCashPayment: (data) => api.post('/payments/gcash/create', data),
  createGCashCheckoutSession: (data) => api.post('/payments/gcash/checkout-session', data),
  verifyGCashPayment: (data) => api.post('/payments/gcash/verify', data),
  getGCashStatus: (referenceId) => api.get(`/payments/gcash/status/${referenceId}`),
  cancelGCashPayment: (data) => api.post('/payments/gcash/cancel', data),
  // PayMongo Payment Intent Methods
  createPayMongoPaymentIntent: (data) => api.post('/payments/paymongo/create-payment-intent', data),
  verifyPayMongoPayment: (data) => api.post('/payments/paymongo/verify-payment', data),
  // Exchange Rate
  getExchangeRate: () => api.get('/payments/exchange-rate'),
};

export default api;
