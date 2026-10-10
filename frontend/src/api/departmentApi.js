import api from './axios';

export const departmentApi = {
  getAll: async () => {
    const response = await api.get('/departments');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/departments/${id}`);
    return response.data;
  },

  create: async (departmentData) => {
    const response = await api.post('/departments', departmentData);
    return response.data;
  },

  update: async (id, departmentData) => {
    const response = await api.put(`/departments/${id}`, departmentData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/departments/${id}`);
    return response.data;
  }
};
