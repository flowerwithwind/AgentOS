import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Row, Col, Tag, Button, Table, Typography, Space, message, Badge, Statistic,
} from 'antd';
import {
  CheckCircleOutlined, CloseCircleOutlined, AlertOutlined,
  DashboardOutlined, WarningOutlined, InfoCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Text, Title } = Typography;

interface HealthItem {
  name: string; status: 'healthy' | 'unhealthy'; latency: string;
}
interface AlertItem {
  id: string; name: string; level: 'critical' | 'warning' | 'info';
  time: string; status: 'unresolved' | 'resolved';
}

const healthData: HealthItem[] = [
  { name: 'SQLite 数据库', status: 'healthy', latency: '2ms' },
  { name: 'AI 模型服务', status: 'healthy', latency: '45ms' },
  { name: 'API 服务', status: 'healthy', latency: '1ms' },
  { name: '定时任务', status: 'unhealthy', latency: '超时' },
];

const statsCards = [
  { label: 'CPU 使用率', value: '42%', color: '#6366f1' },
  { label: '内存使用率', value: '67%', color: '#3b82f6' },
  { label: '活跃连接', value: '12', color: '#10b981' },
  { label: '运行时间', value: '12d 8h', color: '#f59e0b' },
];

const mockAlerts: AlertItem[] = [
  { id: '1', name: '模型调用超时 (DeepSeek Chat)', level: 'critical', time: '2026-07-15 14:22', status: 'unresolved' },
  { id: '2', name: '采集任务执行失败', level: 'warning', time: '2026-07-15 13:10', status: 'unresolved' },
  { id: '3', name: '数据库连接池耗尽', level: 'critical', time: '2026-07-15 11:45', status: 'resolved' },
  { id: '4', name: '磁盘使用率超过 80%', level: 'warning', time: '2026-07-14 09:30', status: 'resolved' },
  { id: '5', name: '用户登录失败次数过多', level: 'info', time: '2026-07-14 08:15', status: 'unresolved' },
];

const MonitorCenter = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState(mockAlerts);
  const [health, setHealth] = useState(healthData);

  const refreshHealth = () => {
    message.success('健康检查已刷新');
  };

  const acknowledgeAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'resolved' as const } : a));
    message.success('告警已确认');
  };

  const alertColumns: ColumnsType<AlertItem> = [
    { title: '告警名称', dataIndex: 'name', key: 'name', render: (t: string) => <span style={{ color: '#f1f5f9' }}>{t}</span> },
    { title: '级别', dataIndex: 'level', key: 'level', render: (v: string) => {
      const m: Record<string, { color: string; label: string }> = { critical: { color: '#ef4444', label: '紧急' }, warning: { color: '#f59e0b', label: '警告' }, info: { color: '#3b82f6', label: '提示' } };
      return <Tag color={m[v]?.color}>{m[v]?.label || v}</Tag>;
    }},
    { title: '时间', dataIndex: 'time', key: 'time', render: (t: string) => <span style={{ color: '#64748b' }}>{t}</span> },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => (
      <Badge status={s === 'unresolved' ? 'error' : 'success'} text={s === 'unresolved' ? '未解决' : '已解决'} />
    )},
    { title: '操作', key: 'action', render: (_: unknown, r: AlertItem) => (
      r.status === 'unresolved' ? <Button size="small" type="primary" ghost onClick={() => acknowledgeAlert(r.id)}>确认</Button> : <span style={{ color: '#64748b' }}>-</span>
    )},
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0, color: '#f1f5f9' }}><DashboardOutlined style={{ marginRight: 8 }} />监控告警</Title>
        <Button icon={<ReloadOutlined />} onClick={refreshHealth}>刷新状态</Button>
      </div>

      {/* Health Check */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        {health.map(h => (
          <Col span={6} key={h.name}>
            <Card style={{ background: '#0f172a', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text style={{ color: '#94a3b8', fontSize: 13 }}>{h.name}</Text>
                  <div style={{ marginTop: 4 }}>
                    <Badge status={h.status === 'healthy' ? 'success' : 'error'} text={<span style={{ color: h.status === 'healthy' ? '#10b981' : '#ef4444', fontWeight: 600 }}>{h.status === 'healthy' ? '正常' : '异常'}</span>} />
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 28, color: h.status === 'healthy' ? '#10b981' : '#ef4444' }}>
                    {h.status === 'healthy' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                  </div>
                  <Text style={{ color: '#64748b', fontSize: 11 }}>{h.latency}</Text>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* System Metrics */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        {statsCards.map(s => (
          <Col span={6} key={s.label}>
            <Card style={{ background: '#0f172a', border: '1px solid #334155' }}>
              <Statistic title={<span style={{ color: '#94a3b8' }}>{s.label}</span>} value={s.value} valueStyle={{ color: s.color }} />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Alerts */}
      <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={5} style={{ margin: 0, color: '#f1f5f9' }}><AlertOutlined style={{ marginRight: 8 }} />告警列表</Title>
          <Text style={{ color: '#64748b' }}>共 {alerts.length} 条</Text>
        </div>
        <Table columns={alertColumns} dataSource={alerts} rowKey="id" pagination={false} />
      </div>
    </div>
  );
};

export default MonitorCenter;
