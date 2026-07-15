import { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Breadcrumb } from 'antd';
import {
  DashboardOutlined,
  PieChartOutlined,
  MessageOutlined,
  RobotOutlined,
  ToolOutlined,
  BookOutlined,
  ApartmentOutlined,
  RadarChartOutlined,
  LineChartOutlined,
  AlertOutlined,
  ApiOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  CommentOutlined,
  FileTextOutlined,
  KeyOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = Layout;

const menuItems: MenuProps['items'] = [
  {
    type: 'group',
    label: '数据总览',
    children: [
      { key: '/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
      { key: '/bigscreen', icon: <PieChartOutlined />, label: '数智大屏' },
    ],
  },
  {
    type: 'group',
    label: 'AI 能力',
    children: [
      { key: '/chat', icon: <MessageOutlined />, label: '对话系统' },
      { key: '/digital-employee', icon: <RobotOutlined />, label: '数字员工' },
      { key: '/skills', icon: <ToolOutlined />, label: '技能市场' },
      { key: '/knowledge', icon: <BookOutlined />, label: '知识库' },
      { key: '/workflow', icon: <ApartmentOutlined />, label: '工作流' },
    ],
  },
  {
    type: 'group',
    label: '数据分析',
    children: [
      { key: '/lookout', icon: <RadarChartOutlined />, label: '瞭望采集' },
      { key: '/sentiment', icon: <LineChartOutlined />, label: '舆情分析' },
    ],
  },
  {
    type: 'group',
    label: '运维管理',
    children: [
      { key: '/monitor', icon: <AlertOutlined />, label: '监控告警' },
      { key: '/model-engine', icon: <ApiOutlined />, label: '模型引擎' },
    ],
  },
  {
    type: 'group',
    label: '系统管理',
    children: [
      { key: '/users', icon: <UserOutlined />, label: '用户管理' },
      { key: '/roles', icon: <SafetyCertificateOutlined />, label: '角色权限' },
      { key: '/sessions', icon: <CommentOutlined />, label: '会话管理' },
      { key: '/conversations', icon: <FileTextOutlined />, label: '对话管理' },
      { key: '/api-tokens', icon: <KeyOutlined />, label: 'API Token' },
      { key: '/settings', icon: <SettingOutlined />, label: '系统设置' },
    ],
  },
];

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const onMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === '/bigscreen') {
      // 数智大屏尚未开发，仅提示
      return;
    }
    navigate(key);
  };

  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', icon: <UserOutlined />, label: '个人中心' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录' },
  ];

  const selectedKey = '/' + location.pathname.split('/')[1];

  const breadcrumbMap: Record<string, string> = {
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

  const currentLabel = breadcrumbMap[selectedKey.slice(1)] || selectedKey.slice(1);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{
          background: '#0f172a',
          borderRight: '1px solid #334155',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #334155',
          }}
        >
          <span
            style={{
              color: '#f1f5f9',
              fontSize: collapsed ? 16 : 20,
              fontWeight: 700,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            {collapsed ? 'XH' : 'XHAgentOS'}
          </span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={onMenuClick}
          style={{ background: '#0f172a', borderRight: 'none' }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #334155',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span
              onClick={() => setCollapsed(!collapsed)}
              style={{ cursor: 'pointer', color: '#f1f5f9', fontSize: 18 }}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </span>
            <Breadcrumb
              items={[{ title: '首页' }, { title: currentLabel }]}
              style={{ color: '#94a3b8' }}
            />
          </div>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Avatar icon={<UserOutlined />} style={{ cursor: 'pointer', background: '#6366f1' }} />
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: 24,
            padding: 24,
            background: '#1e293b',
            borderRadius: 12,
            minHeight: 280,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
