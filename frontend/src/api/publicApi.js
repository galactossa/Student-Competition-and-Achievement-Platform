import api from './axios';

export const publicApi = {
  listPublicCompetitions: (params) => api.get('/public/competitions', { params }),
  getPublicCompetitionDetail: (slug) => api.get(`/public/competitions/${encodeURIComponent(slug)}`),
  getPublicCategories: () => api.get('/public/competition-categories'),
  listPublicAchievements: (params) => api.get('/public/achievements', { params }),
  getPublicStats: () => api.get('/public/stats')
};
