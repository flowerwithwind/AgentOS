import apiClient from './api';

export interface ModelItem {
  id: number;
  name: string;
  provider: string;
  modelName: string;
  isDefault: boolean;
  status: number;
  totalTokens: number;
  totalCalls: number;
  createAt: string;
}

export function getModels(params: { page?: number; pageSize?: number }): Promise<{ items: ModelItem[]; total: number; page: number; pageSize: number }> {
  return apiClient.get('/models', { params });
}

export function createModel(data: any): Promise<void> {
  return apiClient.post('/models/create', data);
}

export function updateModel(id: number, data: any): Promise<void> {
  return apiClient.put(`/models/${id}`, data);
}

export function deleteModel(id: number): Promise<void> {
  return apiClient.delete(`/models/${id}/delete`);
}

export function setDefaultModel(id: number): Promise<void> {
  return apiClient.post(`/models/${id}/default`);
}

export function testModel(data: { modelId: number; message: string }): Promise<{ reply: string }> {
  return apiClient.post('/models/test', data);
}
