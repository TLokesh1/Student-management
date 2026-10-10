import api from './axios';

export const studentApi = {
  getAll: async (params = {}) => {
    const response = await api.get('/students', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },

  create: async (studentData) => {
    const response = await api.post('/students', studentData);
    return response.data;
  },

  update: async (id, studentData) => {
    const response = await api.put(`/students/${id}`, studentData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/students/${id}`);
    return response.data;
  },

  enrollInCourse: async (studentId, courseId) => {
    const response = await api.post(`/students/${studentId}/courses/${courseId}`);
    return response.data;
  },

  removeFromCourse: async (studentId, courseId) => {
    const response = await api.delete(`/students/${studentId}/courses/${courseId}`);
    return response.data;
  },

  getCourses: async (studentId) => {
    const response = await api.get(`/students/${studentId}/courses`);
    return response.data;
  }
};
