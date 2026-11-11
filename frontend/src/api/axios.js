import axios from 'axios';

export const ACCESS_TOKEN_KEY = 'scap_access_token';
export const REFRESH_TOKEN_KEY = 'scap_refresh_token';
export const USER_KEY = 'scap_user';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' }
});

export function setAuthToken(accessToken, refreshToken, user) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
}

export function clearAuthToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  delete api.defaults.headers.common.Authorization;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const isRefreshRequest = originalRequest?.url?.includes('/auth/refresh');

    if (error.response?.status !== 401 || !refreshToken || isRefreshRequest || originalRequest?._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    try {
      const response = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
      const accessToken = response.data.data.accessToken;
      setAuthToken(accessToken, refreshToken);
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      clearAuthToken();
      window.dispatchEvent(new Event('scap:auth-expired'));
      return Promise.reject(refreshError);
    }
  }
);

export default api;
