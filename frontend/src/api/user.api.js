import api from './axiosInstance';

export const userApi = {
  getMe: () => api.get('/users/me'),
  updateMe: (data) => api.patch('/users/me', data),
  deleteMe: () => api.delete('/users/me'),

  getProfile: () => api.get('/users/me/profile'),
  updateProfile: (data) => api.put('/users/me/profile', data),

  getSavedSchemes: () => api.get('/users/me/saved-schemes'),
  saveScheme: (schemeId) => api.post(`/users/me/saved-schemes/${schemeId}`),
  updateSavedScheme: (schemeId, data) => api.patch(`/users/me/saved-schemes/${schemeId}`, data),
  removeSavedScheme: (schemeId) => api.delete(`/users/me/saved-schemes/${schemeId}`),

  getDocuments: () => api.get('/users/me/documents'),
  uploadDocument: (formData) => api.post('/users/me/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteDocument: (id) => api.delete(`/users/me/documents/${id}`),
};
