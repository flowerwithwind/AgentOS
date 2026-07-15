import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import UserLayout from './components/UserLayout';
import AuthGuard from './components/layout/AuthGuard';
import HomePage from './pages/HomePage';
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
import UserDashboard from './pages/UserDashboard';
import BigScreen from './pages/BigScreen';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home / Landing */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Navigate to="/" replace />} />

        {/* Admin routes - requires roleId === 1 */}
        <Route path="/admin" element={<AuthGuard requiredRole={1}><AdminLayout /></AuthGuard>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
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
          <Route path="bigscreen" element={<BigScreen />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* User routes - any authenticated user */}
        <Route path="/user" element={<AuthGuard><UserLayout /></AuthGuard>}>
          <Route index element={<Navigate to="/user/dashboard" replace />} />
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="chat" element={<Chat />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
