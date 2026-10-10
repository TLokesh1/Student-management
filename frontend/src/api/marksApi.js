import api from './axios';

export const marksApi = {
  getAll: async () => {
    const response = await api.get('/marks');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/marks/${id}`);
    return response.data;
  },

  getByStudent: async (studentId) => {
    const response = await api.get(`/marks/student/${studentId}`);
    return response.data;
  },

  getByCourse: async (courseId) => {
    const response = await api.get(`/marks/course/${courseId}`);
    return response.data;
  },

  create: async (marksData) => {
    const response = await api.post('/marks', marksData);
    return response.data;
  },

  update: async (id, marksData) => {
    const response = await api.put(`/marks/${id}`, marksData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/marks/${id}`);
    return response.data;
  }
};
