import api from './api';

export const authService = {
  async login({ email, password }) {
    const { data } = await api.post('/login', { email, password });
    return data;
  },

  async register(payload) {
    const { data } = await api.post('/register', payload);
    return data;
  },
};