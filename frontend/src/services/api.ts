import axios from 'axios';
import { message } from 'antd';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const rawClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Request interceptor: inject auth token
rawClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('xhagentos_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: unwrap business payload so callers get `data` directly
rawClient.interceptors.response.use(
  (response) => {
    const { code, message: msg, data } = response.data;
    if (code === 200 || code === 0) {
      return data;
    }
    message.error(msg || '请求失败');
    return Promise.reject(new Error(msg));
  },
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          localStorage.removeItem('xhagentos_token');
          window.location.href = '/login';
          break;
        case 403:
          message.error('无权限访问');
          break;
        case 404:
          message.error('请求的资源不存在');
          break;
        case 429:
          message.error('请求过于频繁，请稍后重试');
          break;
        default:
          message.error(`服务器错误 (${error.response.status})`);
      }
    } else {
      message.error('网络连接异常');
    }
    return Promise.reject(error);
  },
);

/** Axios client whose interceptors return unwrapped business data (not AxiosResponse). */
export interface ApiClient {
  get<T = any>(url: string, config?: any): Promise<T>;
  post<T = any>(url: string, data?: any, config?: any): Promise<T>;
  put<T = any>(url: string, data?: any, config?: any): Promise<T>;
  delete<T = any>(url: string, config?: any): Promise<T>;
  patch<T = any>(url: string, data?: any, config?: any): Promise<T>;
}

const apiClient = rawClient as unknown as ApiClient;

export default apiClient;
