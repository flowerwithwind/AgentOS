import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserOutlined, MessageOutlined, ReadOutlined, ApiOutlined,
  ArrowUpOutlined, ArrowDownOutlined, PlusOutlined, SettingOutlined,
  DatabaseOutlined, ThunderboltOutlined,
} from '@ant-design/icons';

const useCountUp = (target: number, duration = 1500) => {
  const [val, setVal] = useState(0);
  const ref = useRef<number | null>(null);
  useEffect(() => {
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

const statCards = [
  { label: '用户总数', value: 1284, icon: <UserOutlined />, color: '#6366f1', trend: '+12.5%', up: true, sparkline: [40, 55, 60, 48, 70, 75, 85], path: '/users' },
  { label: '今日对话数', value: 356, icon: <MessageOutlined />, color: '#3b82f6', trend: '+8.3%', up: true, sparkline: [20, 30, 25, 40, 38, 45, 52], path: '/conversations' },
  { label: '采集文章数', value: 12847, icon: <ReadOutlined />, color: '#10b981', trend: '-3.2%', up: false, sparkline: [80, 75, 70, 82, 68, 65, 72], path: '/lookout' },
  { label: '模型调用次数', value: 45623, icon: <ApiOutlined />, color: '#f59e0b', trend: '+18.7%', up: true, sparkline: [50, 60, 55, 70, 75, 88, 95], path: '/model-engine' },
];

const weeklyData = [
  { day: '周一', count: 245 },
  { day: '周二', count: 312 },
  { day: '周三', count: 287 },
  { day: '周四', count: 421 },
  { day: '周五', count: 389 },
  { day: '周六', count: 156 },
  { day: '周日', count: 198 },
];

const employeeRanking = [
  { name: '数据瞭望助手', count: 1247, avatar: '🔍' },
  { name: '智能问数专家', count: 986, avatar: '📊' },
  { name: '舆情分析师', count: 754, avatar: '📰' },
  { name: '报告生成器', count: 523, avatar: '📄' },
  { name: '知识管理员', count: 389, avatar: '📚' },
];

const quickActions = [
  { title: '创建数字员工', desc: '配置新的 AI 数字员工', icon: <PlusOutlined />, color: '#6366f1', path: '/digital-employee' },
  { title: '新建技能', desc: '添加自定义技能插件', icon: <ThunderboltOutlined />, color: '#3b82f6', path: '/skills' },
  { title: '查看采集', desc: '浏览已采集的数据', icon: <DatabaseOutlined />, color: '#10b981', path: '/lookout' },
  { title: '系统设置', desc: '管理平台全局配置', icon: <SettingOutlined />, color: '#f59e0b', path: '/settings' },
];

const recentActivities = [
  { time: '14:32', user: 'admin', action: '创建了数字员工「舆情分析师v2」' },
  { time: '13:18', user: 'zhangsan', action: '执行了一次全量数据采集' },
  { time: '11:45', user: 'admin', action: '更新了模型配置（deepseek-chat）' },
  { time: '10:22', user: 'lisi', action: '删除了过期会话 12 条' },
  { time: '09:08', user: 'admin', action: '新增采集源「36氪-科技频道」' },
];

const systemStatus = [
  { label: 'CPU 使用率', value: 42, color: '#6366f1', desc: '4核 / 8线程' },
  { label: '内存使用率', value: 67, color: '#3b82f6', desc: '5.4GB / 8GB' },
  { label: '数据库大小', value: 28, color: '#10b981', desc: '1.8GB / 6.4GB' },
  { label: '运行时间', value: 100, color: '#f59e0b', desc: '12天 8小时 32分' },
];

const Sparkline = ({ data, color }: { data: number[]; color: string }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80, h = 30, pad = 2;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <polyline fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" points={pts} />
    </svg>
  );
};

const StatCard = ({ card, onClick }: { card: typeof statCards[0]; onClick: () => void }) => {
  const count = useCountUp(card.value);
  return (
    <div
      onClick={onClick}
      style={{
        background: '#1e293b', borderRadius: 12, padding: '20px 24px',
        border: '1px solid #334155', flex: 1, minWidth: 200,
        display: 'flex', flexDirection: 'column', gap: 12,
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 24px ${card.color}22`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>{card.label}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#f1f5f9', letterSpacing: 1 }}>{fmt(count)}</div>
        </div>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: `${card.color}22`, color: card.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
        }}>
          {card.icon}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontSize: 12, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
          background: card.up ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
          color: card.up ? '#10b981' : '#ef4444',
          display: 'inline-flex', alignItems: 'center', gap: 2,
        }}>
          {card.up ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
          {card.trend}
        </span>
        <Sparkline data={card.sparkline} color={card.color} />
      </div>
    </div>
  );
};

const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ background: '#1e293b', borderRadius: 12, padding: 24, border: '1px solid #334155' }}>
    <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #334155' }}>
      {title}
    </div>
    {children}
  </div>
);

const maxWeekly = Math.max(...weeklyData.map(d => d.count));

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 顶部统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {statCards.map(c => <StatCard key={c.label} card={c} onClick={() => navigate(c.path)} />)}
      </div>

      {/* 中部双列 */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}>
        {/* 7日对话趋势 */}
        <ChartCard title="📈 7日对话趋势">
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 0, height: 180, paddingTop: 10 }}>
            {weeklyData.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{d.count}</span>
                <div
                  style={{
                    width: '60%',
                    background: 'linear-gradient(180deg, #6366f1 0%, #3b82f6 100%)',
                    borderRadius: '6px 6px 0 0',
                    height: `${(d.count / maxWeekly) * 140}px`,
                    transition: 'height 0.6s cubic-bezier(0.4,0,0.2,1)',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                  title={`${d.day}: ${d.count} 次对话`}
                />
                <span style={{ fontSize: 12, color: '#64748b' }}>{d.day}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* 数字员工活跃排行 */}
        <ChartCard title="🏆 数字员工活跃排行 Top 5">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {employeeRanking.map((emp, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : '#334155',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: i < 3 ? '#fff' : '#94a3b8',
                }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{emp.avatar}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.name}</span>
                    <span style={{ fontSize: 12, color: '#64748b', flexShrink: 0 }}>{emp.count}</span>
                  </div>
                  <div style={{ height: 6, background: '#334155', borderRadius: 3 }}>
                    <div style={{
                      height: '100%', borderRadius: 3,
                      background: i === 0 ? '#f59e0b' : i === 1 ? '#6366f1' : i === 2 ? '#3b82f6' : '#10b981',
                      width: `${(emp.count / employeeRanking[0].count) * 100}%`,
                      transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* 底部三列 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        {/* 快捷操作 */}
        <ChartCard title="⚡ 快捷操作">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {quickActions.map((a, i) => (
              <div
                key={i}
                onClick={() => navigate(a.path)}
                style={{
                  padding: '14px 12px', borderRadius: 10, cursor: 'pointer',
                  border: '1px solid #334155', background: '#0f172a',
                  transition: 'border-color 0.2s, background 0.2s',
                  display: 'flex', flexDirection: 'column', gap: 8,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = a.color; (e.currentTarget as HTMLDivElement).style.background = `${a.color}11`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#334155'; (e.currentTarget as HTMLDivElement).style.background = '#0f172a'; }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 8, background: `${a.color}22`, color: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  {a.icon}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{a.title}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{a.desc}</div>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* 最近活动 */}
        <ChartCard title="🕐 最近活动">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {recentActivities.map((act, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                padding: '10px 0', borderBottom: i < recentActivities.length - 1 ? '1px solid #334155' : 'none',
              }}>
                <span style={{ fontSize: 12, color: '#64748b', flexShrink: 0, marginTop: 2, fontFamily: 'monospace' }}>{act.time}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: '#f1f5f9' }}>
                    <span style={{ color: '#6366f1', fontWeight: 500 }}>{act.user}</span>
                    <span style={{ color: '#94a3b8', marginLeft: 6 }}>{act.action}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* 系统状态 */}
        <ChartCard title="💻 系统状态">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {systemStatus.map((s, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: '#f1f5f9' }}>{s.label}</span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{s.desc}</span>
                </div>
                <div style={{ height: 8, background: '#334155', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 4, background: s.color,
                    width: `${s.value}%`, transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                  }} />
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 3, textAlign: 'right' }}>{s.value}%</div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

export default Dashboard;
