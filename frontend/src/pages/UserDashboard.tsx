import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Avatar, Typography, Space, Spin, Button } from 'antd';
import {
  RobotOutlined, MessageOutlined, PlusOutlined,
  RightOutlined, ThunderboltOutlined, TeamOutlined,
} from '@ant-design/icons';
import { getDashboardStats } from '../services/dashboard';

const { Text, Title } = Typography;

const agents = [
  { name: '数据分析师', desc: 'SQL 查询与数据可视化', avatar: 'DA', color: '#6366f1', msgCount: 128 },
  { name: '新闻监控', desc: '实时新闻采集与告警', avatar: 'NM', color: '#10b981', msgCount: 89 },
  { name: '舆情专家', desc: '社交媒体情感分析', avatar: 'SE', color: '#f59e0b', msgCount: 56 },
  { name: '报告撰写', desc: '自动生成分析报告', avatar: 'RW', color: '#ec4899', msgCount: 34 },
];

const UserDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ userCount: 0, modelCount: 0, recordCount: 0, sourceCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data: any = await getDashboardStats();
        setStats(data);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;

  return (
    <div>
      {/* Welcome */}
      <div style={{ marginBottom: 32 }}>
        <Title level={3} style={{ margin: 0, color: '#0f172a', fontWeight: 700 }}>欢迎使用 XHAgentOS</Title>
        <Text style={{ color: '#64748b', fontSize: 15, marginTop: 6, display: 'block' }}>AI 驱动的数据瞭望与智能分析平台</Text>
      </div>

      {/* Stats row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        {[
          { label: '模型', value: stats.modelCount, icon: <RobotOutlined />, color: '#6366f1' },
          { label: '采集', value: stats.recordCount, icon: <ThunderboltOutlined />, color: '#10b981' },
          { label: '源站', value: stats.sourceCount, icon: <TeamOutlined />, color: '#f59e0b' },
        ].map((s, i) => (
          <Col span={8} key={i}>
            <Card style={{ borderRadius: 12, border: '1px solid #e5e7eb' }} bodyStyle={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Text style={{ color: '#94a3b8', fontSize: 13 }}>{s.label}</Text>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>{s.value}</div>
                </div>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, fontSize: 20 }}>{s.icon}</div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* My Agents */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0, color: '#0f172a' }}>My Agents</Title>
        <Button type="primary" icon={<PlusOutlined />} style={{ borderRadius: 8, background: '#6366f1', border: 'none' }}>New Agent</Button>
      </div>
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        {agents.map((a, i) => (
          <Col xs={24} sm={12} lg={6} key={i}>
            <Card hoverable style={{ borderRadius: 12, border: '1px solid #e5e7eb', height: '100%' }} bodyStyle={{ padding: 24 }}
              onClick={() => navigate('/user/chat')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <Avatar style={{ background: a.color, verticalAlign: 'middle', fontWeight: 600 }} size={44}>{a.avatar}</Avatar>
                <div>
                  <Text strong style={{ color: '#0f172a', fontSize: 15, display: 'block' }}>{a.name}</Text>
                  <Text style={{ color: '#94a3b8', fontSize: 12 }}>{a.desc}</Text>
                </div>
                <div style={{ marginLeft: 'auto' }}><RightOutlined style={{ color: '#94a3b8' }} /></div>
              </div>
              <div style={{ display: 'flex', gap: 16, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                <Space><MessageOutlined style={{ color: '#94a3b8', fontSize: 12 }} /><Text style={{ color: '#64748b', fontSize: 12 }}>{a.msgCount} conversations</Text></Space>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Quick actions */}
      <Title level={4} style={{ color: '#0f172a', marginBottom: 16 }}>快捷操作</Title>
      <Row gutter={[16, 16]}>
        {[
          { title: '开始对话', desc: '与 AI 助手交流', icon: <MessageOutlined />, color: '#6366f1', path: '/user/chat' },
          { title: '查看采集', desc: '浏览已采集数据', icon: <ThunderboltOutlined />, color: '#10b981', path: '/user/collections' },
          { title: '管理智能体', desc: '配置数字员工', icon: <RobotOutlined />, color: '#f59e0b', path: '/user/agents' },
        ].map((a, i) => (
          <Col span={8} key={i}>
            <Card hoverable style={{ borderRadius: 12, border: '1px solid #e5e7eb' }} bodyStyle={{ padding: 20 }} onClick={() => a.path && navigate(a.path)}>
              <Space size={12}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${a.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.color, fontSize: 18 }}>{a.icon}</div>
                <div>
                  <Text strong style={{ color: '#0f172a', display: 'block' }}>{a.title}</Text>
                  <Text style={{ color: '#94a3b8', fontSize: 13 }}>{a.desc}</Text>
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default UserDashboard;
