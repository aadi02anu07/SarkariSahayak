import api from './axiosInstance';

export const schemeApi = {
  list: (params) => api.get('/schemes', { params }),
  getBySlug: (slug) => api.get(`/schemes/${slug}`),
  search: (q, limit = 20) => api.get('/schemes/search', { params: { q, limit } }),
  match: (profile) => api.post('/schemes/match', profile),
  trending: (state) => api.get('/schemes/trending', { params: state ? { state } : {} }),
  byLifeEvent: (eventSlug) => api.get(`/schemes/by-event/${eventSlug}`),
};
