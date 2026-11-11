import api from './axios';

export const authApi = {
  login: (payload) => api.post('/auth/login', payload),
  register: (payload) => api.post('/auth/register', payload),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  pingMahasiswa: () => api.get('/auth/ping/mahasiswa'),
  pingAdmin: () => api.get('/auth/ping/admin')
};
