import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Typography } from 'antd';
import { ToolOutlined } from '@ant-design/icons';
import AdminLayout from './components/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import KnowledgeBase from './pages/KnowledgeBase';
import SkillMarket from './pages/SkillMarket';
import Workflow from './pages/Workflow';
import LookoutManagement from './pages/LookoutManagement';
import SentimentAnalysis from './pages/SentimentAnalysis';
import MonitorCenter from './pages/MonitorCenter';
import Settings from './pages/Settings';
import DigitalEmployee from './pages/DigitalEmployee';
import UserManagement from './pages/UserManagement';
import SessionManagement from './pages/SessionManagement';
import ConversationManagement from './pages/ConversationManagement';
import ModelEngine from './pages/ModelEngine';
import RolePermission from './pages/RolePermission';
import ApiTokenManagement from './pages/ApiTokenManagement';

const BigScreenPlaceholder = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
    <ToolOutlined style={{ fontSize: 64, color: '#6366f1' }} />
    <Typography.Title level={3} style={{ color: '#f1f5f9', margin: 0 }}>数智大屏</Typography.Title>
    <Typography.Text style={{ color: '#94a3b8', fontSize: 16 }}>页面开发中，敬请期待...</Typography.Text>
  </div>
);

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="bigscreen" element={<BigScreenPlaceholder />} />
          <Route path="chat" element={<Chat />} />
          <Route path="digital-employee" element={<DigitalEmployee />} />
          <Route path="knowledge" element={<KnowledgeBase />} />
          <Route path="skills" element={<SkillMarket />} />
          <Route path="workflow" element={<Workflow />} />
          <Route path="lookout" element={<LookoutManagement />} />
          <Route path="sentiment" element={<SentimentAnalysis />} />
          <Route path="monitor" element={<MonitorCenter />} />
          <Route path="model-engine" element={<ModelEngine />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="roles" element={<RolePermission />} />
          <Route path="sessions" element={<SessionManagement />} />
          <Route path="conversations" element={<ConversationManagement />} />
          <Route path="api-tokens" element={<ApiTokenManagement />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
