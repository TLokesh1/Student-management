import api from './axios';

export const facultyApi = {
  getAll: async (params = {}) => {
    const response = await api.get('/faculty', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/faculty/${id}`);
    return response.data;
  },

  create: async (facultyData) => {
    const response = await api.post('/faculty', facultyData);
    return response.data;
  },

  update: async (id, facultyData) => {
    const response = await api.put(`/faculty/${id}`, facultyData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/faculty/${id}`);
    return response.data;
  }
};
