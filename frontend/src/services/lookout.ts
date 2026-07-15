import apiClient from './api';

export function getSources(params: any) {
  return apiClient.get('/lookout/sources', { params });
}
export function createSource(data: any) {
  return apiClient.post('/lookout/sources/create', data);
}
export function updateSource(id: number, data: any) {
  return apiClient.put(`/lookout/sources/${id}`, data);
}
export function deleteSource(id: number) {
  return apiClient.delete(`/lookout/sources/${id}/delete`);
}
export function collect(data: any) {
  return apiClient.post('/lookout/collect', data);
}
export function getWarehouse(params: any) {
  return apiClient.get('/lookout/warehouse', { params });
}
export function deleteWarehouseRecord(id: number) {
  return apiClient.delete(`/lookout/warehouse/${id}/delete`);
}
