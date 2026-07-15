import apiClient from './api';

export interface DashboardStats {
  userCount: number;
  modelCount: number;
  sourceCount: number;
  recordCount: number;
  apiTokenCount: number;
  recentUsers: Array<{ id: number; username: string; role_name: string; create_at: string }>;
  recentRecords: Array<{ id: number; title: string; source_name: string; keyword: string; collected_at: string }>;
}

export function getDashboardStats(): Promise<DashboardStats> {
  return apiClient.get('/dashboard/stats');
}

export function getMenus(): Promise<any[]> {
  return apiClient.get('/menus');
}
