import { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Breadcrumb, message } from 'antd';
import {
  DashboardOutlined, PieChartOutlined, MessageOutlined, RobotOutlined,
  ToolOutlined, BookOutlined, ApartmentOutlined, RadarChartOutlined,
  LineChartOutlined, AlertOutlined, ApiOutlined, UserOutlined,
  SafetyCertificateOutlined, CommentOutlined, FileTextOutlined,
  KeyOutlined, SettingOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import type { MenuProps } from 'antd';
import useAuthStore from '../stores/useAuthStore';

const { Header, Sider, Content } = Layout;

// Key-to-group mapping for auto-opening groups based on current route
const routeToGroupKey: Record<string, string> = {
  dashboard: 'overview',
  bigscreen: 'overview',
  chat: 'ai',
  'digital-employee': 'ai',
  skills: 'ai',
  knowledge: 'ai',
  workflow: 'ai',
  lookout: 'data',
  sentiment: 'data',
  monitor: 'ops',
  'model-engine': 'ops',
  users: 'system',
  roles: 'system',
  sessions: 'system',
  conversations: 'system',
  'api-tokens': 'system',
  settings: 'system',
};

const menuItems: MenuProps['items'] = [
  {
    key: 'overview',
    icon: <PieChartOutlined />,
    label: '数据总览',
    children: [
      { key: '/admin/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
      { key: '/admin/bigscreen', icon: <PieChartOutlined />, label: '数智大屏' },
    ],
  },
  {
    key: 'ai',
    icon: <RobotOutlined />,
    label: 'AI 能力',
    children: [
      { key: '/admin/chat', icon: <MessageOutlined />, label: '对话系统' },
      { key: '/admin/digital-employee', icon: <RobotOutlined />, label: '数字员工' },
      { key: '/admin/skills', icon: <ToolOutlined />, label: '技能市场' },
      { key: '/admin/knowledge', icon: <BookOutlined />, label: '知识库' },
      { key: '/admin/workflow', icon: <ApartmentOutlined />, label: '工作流' },
    ],
  },
  {
    key: 'data',
    icon: <RadarChartOutlined />,
    label: '数据分析',
    children: [
      { key: '/admin/lookout', icon: <RadarChartOutlined />, label: '瞭望采集' },
      { key: '/admin/sentiment', icon: <LineChartOutlined />, label: '舆情分析' },
    ],
  },
  {
    key: 'ops',
    icon: <AlertOutlined />,
    label: '运维管理',
    children: [
      { key: '/admin/monitor', icon: <AlertOutlined />, label: '监控告警' },
      { key: '/admin/model-engine', icon: <ApiOutlined />, label: '模型引擎' },
    ],
  },
  {
    key: 'system',
    icon: <SettingOutlined />,
    label: '系统管理',
    children: [
      { key: '/admin/users', icon: <UserOutlined />, label: '用户管理' },
      { key: '/admin/roles', icon: <SafetyCertificateOutlined />, label: '角色权限' },
      { key: '/admin/sessions', icon: <CommentOutlined />, label: '会话管理' },
      { key: '/admin/conversations', icon: <FileTextOutlined />, label: '对话管理' },
      { key: '/admin/api-tokens', icon: <KeyOutlined />, label: 'API Token' },
      { key: '/admin/settings', icon: <SettingOutlined />, label: '系统设置' },
    ],
  },
];

const breadcrumbMap: Record<string, string> = {
  dashboard: '仪表盘', chat: '对话系统', 'digital-employee': '数字员工',
  skills: '技能市场', knowledge: '知识库管理', workflow: '工作流编辑器',
  lookout: '瞭望采集', sentiment: '舆情分析', monitor: '监控告警',
  'model-engine': '模型引擎', users: '用户管理', roles: '角色权限',
  sessions: '会话管理', conversations: '对话管理', 'api-tokens': 'API Token',
  settings: '系统设置', bigscreen: '数智大屏',
};

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout: clearAuth } = useAuthStore();

  const savedCollapsed = localStorage.getItem('xhagentos_sider_collapsed') === 'true';
  const [collapsed, setCollapsed] = useState(savedCollapsed);

  useEffect(() => {
    localStorage.setItem('xhagentos_sider_collapsed', String(collapsed));
  }, [collapsed]);

  const selectedKey = location.pathname;

  // Auto-open the group matching current route
  const routeBase = location.pathname.split('/')[2] || '';
  const defaultOpenKey = routeToGroupKey[routeBase] || 'overview';

  const handleLogout = async () => {
    clearAuth();
    localStorage.removeItem('xhagentos_token');
    message.success('已退出登录');
    navigate('/login');
  };

  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', icon: <UserOutlined />, label: '个人中心' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录' },
  ];

  const currentLabel = breadcrumbMap[selectedKey.split('/')[2]] || selectedKey.split('/')[2] || '';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={240}
        collapsedWidth={80}
        style={{ background: '#0f172a', borderRight: '1px solid #334155' }}
      >
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #334155' }}>
          <span style={{ color: '#f1f5f9', fontSize: collapsed ? 16 : 20, fontWeight: 700, whiteSpace: 'nowrap' }}>
            {collapsed ? 'XH' : 'XHAgentOS'}
          </span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={[defaultOpenKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ background: '#0f172a', borderRight: 'none' }}
          className="admin-menu"
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #334155', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span onClick={() => { const next = !collapsed; setCollapsed(next); localStorage.setItem('xhagentos_sider_collapsed', String(next)); }} style={{ cursor: 'pointer', color: '#f1f5f9', fontSize: 18, transition: 'color 0.2s' }} onMouseEnter={e => (e.currentTarget.style.color = '#818cf8')} onMouseLeave={e => (e.currentTarget.style.color = '#f1f5f9')}>
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </span>
            <Breadcrumb items={[{ title: '首页' }, { title: currentLabel }]} style={{ color: '#94a3b8' }} />
          </div>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <span style={{ color: '#94a3b8', fontSize: 14 }}>{user?.username || '用户'}</span>
              <Avatar icon={<UserOutlined />} style={{ background: '#6366f1' }} />
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24, padding: 24, background: '#1e293b', borderRadius: 12, minHeight: 280 }} className="page-content-animate">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
