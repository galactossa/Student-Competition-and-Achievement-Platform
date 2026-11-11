import api from './axios';

export const competitionApi = {
  list: (params) => api.get('/competitions', { params }),
  stats: () => api.get('/competitions/stats'),
  getById: (id) => api.get(`/competitions/${id}`),
  create: (formData) => api.post('/competitions', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => api.put(`/competitions/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  changeStatus: (id, status) => api.patch(`/competitions/${id}/status`, { status }),
  remove: (id) => api.delete(`/competitions/${id}`),
  listCategories: () => api.get('/competition-categories'),
  createCategory: (data) => api.post('/competition-categories', data),
  updateCategory: (id, data) => api.put(`/competition-categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/competition-categories/${id}`)
};

export function getApiErrorMessage(error, fallback = 'Permintaan gagal.') {
  return error.response?.data?.message || fallback;
}

export function mapApiFieldErrors(error, setError) {
  const fieldErrors = error.response?.data?.errors || [];
  fieldErrors.forEach((item) => {
    const path = Array.isArray(item.path) ? item.path.join('.') : item.field || item.path;
    if (path) setError(path, { type: 'server', message: item.message });
  });
  return fieldErrors.length > 0;
}
