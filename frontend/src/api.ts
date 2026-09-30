import axios from 'axios';

/**
 * Enterprise Axios client configured with automatic JWT injection,
 * base URL configuration, and standardized error handling.
 */
const api = axios.create({
  baseURL: `${window.location.protocol}//${window.location.hostname}:8080/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach Bearer token to all outgoing requests
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.data && error.response.data.message) {
        error.message = error.response.data.message;
    } else if (error.response && error.response.data && typeof error.response.data === 'string') {
        error.message = error.response.data;
    }
    return Promise.reject(error);
  }
);
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Catch 401 Unauthorized and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// -----------------------------------------------------------------------------
// Domain API Endpoints
// -----------------------------------------------------------------------------
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: { fullName: string; email: string; password?: string }) =>
    api.post('/auth/register', data),
  ping: () => api.get('/auth/ping'),
};

export const transactionApi = {
  getAll: () => api.get('/transactions'),
  initiate: (type: string, amount: number, makerId: string, beneficiaryName: string, destinationAccount: string, ifscOrBic: string) =>
    api.post(`/transactions/initiate?type=${encodeURIComponent(type)}&amount=${amount}&makerId=${encodeURIComponent(makerId)}&beneficiaryName=${encodeURIComponent(beneficiaryName)}&destinationAccount=${encodeURIComponent(destinationAccount)}&ifscOrBic=${encodeURIComponent(ifscOrBic)}`),
};

export const collectionApi = {
  generateQr: (vpa: string, amount: number, note: string) =>
    api.post('/collections/qr/generate', { vpa, amount: String(amount), note }),
  processVirtualAccount: (data: Record<string, unknown>) =>
    api.post('/collections/virtual-account/process', data),
};

export const liquidityApi = {
  executeSweep: (fromAccount: string, toAccount: string, amount: number) =>
    api.post('/liquidity/sweep/execute', {
      fromAccount,
      toAccount,
      amount: String(amount),
    }),
};

export const makerCheckerApi = {
  getPending: () => api.get('/maker-checker/pending'),
  approve: (requestId: string, comments = '') =>
    api.post(`/maker-checker/${encodeURIComponent(requestId)}/approve`, { comments }),
  reject: (requestId: string, rejectionReason: string) =>
    api.post(`/maker-checker/${encodeURIComponent(requestId)}/reject`, { rejectionReason }),
  getMyRequests: () => api.get('/maker-checker/my-requests'),
};

export const userApi = {
  getAll: () => api.get('/users'),
};

export const llmApi = {
  analyze: (text: string) => api.post('/llm/analyze', { transactionDetails: text }),
};

export const upiApi = {
  sendOptimized: (senderId: string, receiverId: string, amount: number, mpin: string) => 
    api.post('/upi/send', { senderId, receiverId, amount, mpin }),
  verifyVpa: (vpa: string) => api.get(`/upi/verify-vpa?vpa=${encodeURIComponent(vpa)}`),
  getOutflows: (senderId: string) => api.get(`/upi/outflows?senderId=${encodeURIComponent(senderId)}`),
  getInflows: (receiverId: string) => api.get(`/upi/inflows?receiverId=${encodeURIComponent(receiverId)}`),
  getUpiProfile: (email: string) => api.get(`/upi/me?email=${encodeURIComponent(email)}`),
  onboard: (email: string, upiId: string, mpin: string) => api.post(`/upi/onboard`, { email, upiId, mpin })
};

export const paymentApi = { initiate: (type: string, payload: any) => api.post('/payments/initiate', { type, ...payload }) };
