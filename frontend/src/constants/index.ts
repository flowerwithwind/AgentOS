export const APP_NAME = 'XHAgentOS';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export const BREADCRUMB_MAP: Record<string, string> = {
  'dashboard': '仪表盘',
  'chat': '对话系统',
  'digital-employee': '数字员工',
  'skills': '技能市场',
  'knowledge': '知识库管理',
  'workflow': '工作流编辑器',
  'lookout': '瞭望采集',
  'sentiment': '舆情分析',
  'monitor': '监控告警',
  'model-engine': '模型引擎',
  'users': '用户管理',
  'roles': '角色权限',
  'sessions': '会话管理',
  'conversations': '对话管理',
  'api-tokens': 'API Token',
  'settings': '系统设置',
  'bigscreen': '数智大屏',
};
