import { fetchClient } from '../utils/apiClient';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  birthDay: string;
}

const authService = {
  login: (data: LoginData) =>
    fetchClient('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  register: (data: RegisterData) =>
    fetchClient('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export { authService };
