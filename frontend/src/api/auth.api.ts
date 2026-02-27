import client from './client';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const authApi = {
  login: (data: LoginRequest) => client.post('/auth/login', data),
  logout: () => client.post('/auth/logout'),
  refresh: (refreshToken: string) => client.post('/auth/refresh', { refreshToken }),
  changePassword: (data: ChangePasswordRequest) => client.put('/auth/password', data),
};
