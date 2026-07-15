import { useState } from 'react';
import { Layout, Avatar, Dropdown, message, Input, Badge, Space } from 'antd';
import {
  UserOutlined, BellOutlined, SearchOutlined, SettingOutlined,
  LogoutOutlined, RobotOutlined, MessageOutlined, AppstoreOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import type { MenuProps } from 'antd';
import useAuthStore from '../stores/useAuthStore';

const { Header, Content } = Layout;

const navItems = [
  { key: '/user/dashboard', icon: <AppstoreOutlined />, label: '工作台' },
  { key: '/user/chat', icon: <MessageOutlined />, label: '智能问数' },
  { key: '/user/agents', icon: <RobotOutlined />, label: '智能体' },
];

const UserLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const handleLogout = () => {
    localStorage.clear();
    message.success('已退出');
    navigate('/');
  };

  const userMenu: MenuProps['items'] = [
    { key: 'settings', icon: <SettingOutlined />, label: '设置' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录' },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {/* Top Navigation */}
      <Header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', height: 64, position: 'sticky', top: 0, zIndex: 100 }}>
        {/* Left: Logo + Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/user/dashboard')}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 700 }}>XH</div>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', letterSpacing: -0.5 }}>XHAgentOS</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {navItems.map(item => (
              <div key={item.key} onClick={() => navigate(item.key)} style={{ padding: '8px 16px', borderRadius: 8, cursor: 'pointer', background: location.pathname === item.key ? '#f1f5f9' : 'transparent', color: location.pathname === item.key ? '#6366f1' : '#64748b', fontWeight: 500, fontSize: 14, transition: 'all 0.2s' }}>
                <Space size={6}>{item.icon}{item.label}</Space>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Search + Notifications + User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Input prefix={<SearchOutlined style={{ color: '#94a3b8' }} />} placeholder="Search..." style={{ width: 240, borderRadius: 8, border: '1px solid #e5e7eb', background: '#f8fafc' }} />
          <Badge count={3} size="small"><BellOutlined style={{ fontSize: 20, color: '#64748b', cursor: 'pointer' }} /></Badge>
          <Dropdown menu={{ items: userMenu, onClick: ({ key }) => key === 'logout' && handleLogout() }} placement="bottomRight">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 8px', borderRadius: 8, transition: 'background 0.2s' }}>
              <Avatar icon={<UserOutlined />} style={{ background: '#6366f1' }} />
              <span style={{ color: '#0f172a', fontWeight: 500, fontSize: 14 }}>{user?.username || 'User'}</span>
            </div>
          </Dropdown>
        </div>
      </Header>

      <Content style={{ padding: 24, maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <Outlet />
      </Content>
    </Layout>
  );
};

export default UserLayout;
