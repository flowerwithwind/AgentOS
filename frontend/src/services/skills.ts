import apiClient from './api';
export function getSkills(params?: any) { return apiClient.get('/skills', { params }); }
export function getAllSkills() { return apiClient.get('/skills/all'); }
export function createSkill(data: any) { return apiClient.post('/skills/create', data); }
export function updateSkill(id: number, data: any) { return apiClient.put(`/skills/${id}`, data); }
export function deleteSkill(id: number) { return apiClient.delete(`/skills/${id}/delete`); }
