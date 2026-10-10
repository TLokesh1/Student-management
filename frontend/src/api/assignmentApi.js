import api from './axios';

export const assignmentApi = {
  getAll: async () => {
    const response = await api.get('/assignments');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/assignments/${id}`);
    return response.data;
  },

  getByCourse: async (courseId) => {
    const response = await api.get(`/assignments/course/${courseId}`);
    return response.data;
  },

  getByFaculty: async (facultyId) => {
    const response = await api.get(`/assignments/faculty/${facultyId}`);
    return response.data;
  },

  create: async (assignmentData) => {
    const response = await api.post('/assignments', assignmentData);
    return response.data;
  },

  update: async (id, assignmentData) => {
    const response = await api.put(`/assignments/${id}`, assignmentData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/assignments/${id}`);
    return response.data;
  }
};
