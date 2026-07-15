import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Spin, Table, Tag } from 'antd';
import { UserOutlined, ApiOutlined, DatabaseOutlined, GlobalOutlined } from '@ant-design/icons';
import { getDashboardStats } from '../services/dashboard';

const { Title } = Typography;

const BigScreen = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res: any = await getDashboardStats();
        setData(res);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;

  const stats = [
    { label: 'Users', value: data?.userCount || 0, icon: <UserOutlined />, color: '#6366f1' },
    { label: 'Models', value: data?.modelCount || 0, icon: <ApiOutlined />, color: '#3b82f6' },
    { label: 'Sources', value: data?.sourceCount || 0, icon: <GlobalOutlined />, color: '#10b981' },
    { label: 'Records', value: data?.recordCount || 0, icon: <DatabaseOutlined />, color: '#f59e0b' },
  ];

  return (
    <div>
      <Title level={4} style={{ color: '#f1f5f9', marginBottom: 24 }}>Data Overview</Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {stats.map((s, i) => (
          <Col span={6} key={i}>
            <Card style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12 }}>
              <Statistic title={<span style={{ color: '#94a3b8' }}>{s.label}</span>} value={s.value} prefix={s.icon} valueStyle={{ color: s.color }} />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title={<span style={{ color: '#f1f5f9' }}>Source Stats</span>} style={{ background: '#0f172a', border: '1px solid #334155' }}>
            {data?.sourceStats?.length > 0 ? (
              data.sourceStats.map((s: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #334155' }}>
                  <span style={{ color: '#f1f5f9' }}>{s.name}</span>
                  <Tag color="blue">{s.value} records</Tag>
                </div>
              ))
            ) : <div style={{ color: '#64748b' }}>No data</div>}
          </Card>
        </Col>
        <Col span={12}>
          <Card title={<span style={{ color: '#f1f5f9' }}>Model Stats</span>} style={{ background: '#0f172a', border: '1px solid #334155' }}>
            {data?.modelStats?.length > 0 ? (
              data.modelStats.map((s: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #334155' }}>
                  <span style={{ color: '#f1f5f9' }}>{s.name}</span>
                  <span style={{ color: '#94a3b8' }}>{s.tokens} tokens / {s.calls} calls</span>
                </div>
              ))
            ) : <div style={{ color: '#64748b' }}>No data</div>}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default BigScreen;
