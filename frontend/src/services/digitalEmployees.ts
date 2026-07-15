import apiClient from './api';

export interface DigitalEmployee {
  id: number;
  name: string;
  avatarUrl: string;
  welcomeMessage: string;
  systemPrompt: string;
  status: number;
  skillNames: string;
  createAt: string;
}

export function getDigitalEmployees(params: { page?: number; pageSize?: number; keyword?: string }): Promise<{ items: DigitalEmployee[]; total: number }> {
  return apiClient.get('/digital-employees', { params });
}

export function createDigitalEmployee(data: any): Promise<void> {
  return apiClient.post('/digital-employees/create', data);
}

export function updateDigitalEmployee(id: number, data: any): Promise<void> {
  return apiClient.put(`/digital-employees/${id}`, data);
}

export function deleteDigitalEmployee(id: number): Promise<void> {
  return apiClient.delete(`/digital-employees/${id}/delete`);
}

export function getDigitalEmployee(id: number): Promise<any> {
  return apiClient.get(`/digital-employees/${id}/detail`);
}
