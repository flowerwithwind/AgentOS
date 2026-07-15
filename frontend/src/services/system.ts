import apiClient from './api';
export function getUsers(params?: any) { return apiClient.get('/users', { params }); }
export function createUser(data: any) { return apiClient.post('/users/create', data); }
export function updateUser(id: number, data: any) { return apiClient.put(`/users/${id}`, data); }
export function deleteUser(id: number) { return apiClient.delete(`/users/${id}/delete`); }
export function getRoles() { return apiClient.get('/roles'); }
export function createRole(data: any) { return apiClient.post('/roles/create', data); }
export function deleteRole(id: number) { return apiClient.delete(`/roles/${id}/delete`); }
export function getPermissionRoles() { return apiClient.get('/permissions/roles'); }
export function getPermissionFunctions(roleId: number) { return apiClient.get('/permissions/functions', { params: { roleId } }); }
export function savePermission(data: any) { return apiClient.post('/permissions/save', data); }
export function getConversations(params?: any) { return apiClient.get('/conversations', { params }); }
export function exportConversations(params?: any) { window.open(`/api/conversations/export?${new URLSearchParams(params)}`); }
export function getSessions(params?: any) { return apiClient.get('/sessions', { params }); }
export function getSessionMessages(id: number) { return apiClient.get(`/sessions/${id}/messages`); }
export function deleteSession(id: number) { return apiClient.delete(`/sessions/${id}/delete`); }
export function getApiTokens(params?: any) { return apiClient.get('/tokens', { params }); }
export function createApiToken(data: any) { return apiClient.post('/tokens/create', data); }
export function deleteApiToken(id: number) { return apiClient.delete(`/tokens/${id}/delete`); }
export function getSettings() { return apiClient.get('/settings'); }
export function updateSettings(data: any) { return apiClient.put('/settings/update', data); }
export function uploadLogo(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post('/settings/logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
}
