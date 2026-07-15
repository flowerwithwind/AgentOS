import apiClient from './api';

export interface LoginParams {
  username: string;
  password: string;
}

export interface RegisterParams {
  username: string;
  password: string;
  confirmPassword: string;
}

export interface UserInfo {
  id: number;
  username: string;
  roleId: number;
  roleName: string;
  permissions: string[];
}

export function login(params: LoginParams): Promise<UserInfo> {
  return apiClient.post('/auth/login', params);
}

export function register(params: RegisterParams): Promise<{ username: string }> {
  return apiClient.post('/auth/register', params);
}

export function getMe(): Promise<UserInfo> {
  return apiClient.get('/auth/me');
}

export function logout(): Promise<void> {
  return apiClient.post('/auth/logout');
}
