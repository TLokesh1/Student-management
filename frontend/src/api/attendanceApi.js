import api from './axios';

export const attendanceApi = {
  getAll: async (params = {}) => {
    const response = await api.get('/attendance', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/attendance/${id}`);
    return response.data;
  },

  getByStudent: async (studentId) => {
    const response = await api.get(`/attendance/student/${studentId}`);
    return response.data;
  },

  getByCourse: async (courseId) => {
    const response = await api.get(`/attendance/course/${courseId}`);
    return response.data;
  },

  mark: async (attendanceData) => {
    const response = await api.post('/attendance', attendanceData);
    return response.data;
  },

  update: async (id, attendanceData) => {
    const response = await api.put(`/attendance/${id}`, attendanceData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/attendance/${id}`);
    return response.data;
  }
};
