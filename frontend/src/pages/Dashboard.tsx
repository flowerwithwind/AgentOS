import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserOutlined, MessageOutlined, ReadOutlined, ApiOutlined,
  ArrowUpOutlined, ArrowDownOutlined, PlusOutlined, SettingOutlined,
  DatabaseOutlined, ThunderboltOutlined,
} from '@ant-design/icons';
import { Spin } from 'antd';
import { getDashboardStats } from '../services/dashboard';

const useCountUp = (target: number, duration = 1500) => {
  const [val, setVal] = useState(0);
  const ref = useRef<number | null>(null);
  useEffect(() => {
    if (target === 0) { setVal(0); return; }
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(ease * target));
      if (p < 1) ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [target, duration]);
  return val;
};

const fmt = (n: number) => n.toLocaleString('en-US');

interface StatCardConfig {
  label: string; value: number; icon: React.ReactNode; color: string; path: string;
}

const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ background: '#1e293b', borderRadius: 12, padding: 24, border: '1px solid #334155' }}>
    <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #334155' }}>{title}</div>
    {children}
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatCardConfig[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentRecords, setRecentRecords] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const data: any = await getDashboardStats();
        setStats([
          { label: '用户数', value: data.userCount || 0, icon: <UserOutlined />, color: '#6366f1', path: '/users' },
          { label: '模型数', value: data.modelCount || 0, icon: <ApiOutlined />, color: '#3b82f6', path: '/model-engine' },
          { label: '源站数', value: data.sourceCount || 0, icon: <ReadOutlined />, color: '#10b981', path: '/lookout' },
          { label: '采集数', value: data.recordCount || 0, icon: <DatabaseOutlined />, color: '#f59e0b', path: '/lookout' },
        ]);
        setRecentUsers(data.recentUsers || []);
        setRecentRecords(data.recentRecords || []);
      } catch (e) {
        console.error('Failed to load dashboard stats:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {stats.map(card => <StatCard key={card.label} card={card} onClick={() => navigate(card.path)} />)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <ChartCard title="最近用户">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentUsers.length === 0 ? (
              <div style={{ color: '#64748b', textAlign: 'center', padding: 20 }}>暂无数据</div>
            ) : recentUsers.map((u: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < recentUsers.length - 1 ? '1px solid #334155' : 'none' }}>
                <span style={{ color: '#f1f5f9' }}><UserOutlined style={{ marginRight: 8, color: '#6366f1' }} />{u.username}</span>
                <span style={{ color: '#64748b', fontSize: 13 }}>{u.role_name || '用户'} {u.create_at?.slice(0, 10)}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="最近采集">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentRecords.length === 0 ? (
              <div style={{ color: '#64748b', textAlign: 'center', padding: 20 }}>暂无数据</div>
            ) : recentRecords.map((r: any, i: number) => (
              <div key={i} style={{ padding: '8px 0', borderBottom: i < recentRecords.length - 1 ? '1px solid #334155' : 'none' }}>
                <div style={{ color: '#f1f5f9', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
                  <span style={{ color: '#10b981' }}>{r.source_name}</span> {r.keyword} {r.collected_at?.slice(0, 16)}
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <ChartCard title="快捷操作">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { title: '创建员工', desc: '配置 AI 数字员工', icon: <PlusOutlined />, color: '#6366f1', path: '/digital-employee' },
            { title: '新建技能', desc: '添加自定义技能插件', icon: <ThunderboltOutlined />, color: '#3b82f6', path: '/skills' },
            { title: '查看采集', desc: '浏览已采集数据', icon: <DatabaseOutlined />, color: '#10b981', path: '/lookout' },
            { title: '系统设置', desc: '平台配置管理', icon: <SettingOutlined />, color: '#f59e0b', path: '/settings' },
          ].map((a, i) => (
            <div key={i} onClick={() => navigate(a.path)} style={{ padding: '14px 12px', borderRadius: 10, cursor: 'pointer', border: '1px solid #334155', background: '#0f172a', transition: 'border-color 0.2s, background 0.2s', display: 'flex', flexDirection: 'column', gap: 8 }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = a.color; (e.currentTarget as HTMLDivElement).style.background = `${a.color}11`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#334155'; (e.currentTarget as HTMLDivElement).style.background = '#0f172a'; }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${a.color}22`, color: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{a.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{a.title}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{a.desc}</div>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
};

const StatCard = ({ card, onClick }: { card: StatCardConfig; onClick: () => void }) => {
  const count = useCountUp(card.value);
  return (
    <div onClick={onClick} style={{
      background: '#1e293b', borderRadius: 12, padding: '20px 24px', border: '1px solid #334155',
      flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 12,
      transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer',
    }}
    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 24px ${card.color}22`; }}
    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>{card.label}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#f1f5f9', letterSpacing: 1 }}>{fmt(count)}</div>
        </div>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: `${card.color}22`, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
          {card.icon}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
