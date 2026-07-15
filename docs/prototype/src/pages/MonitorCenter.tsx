import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Row, Col, Tag, Table, Typography, Space, Switch, Progress, Tooltip, Button,
} from 'antd';
import {
  CheckCircleOutlined, SyncOutlined, ClockCircleOutlined,
  ThunderboltOutlined, ApiOutlined, RobotOutlined, AlertOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

// 迷你折线图 SVG
const MiniLine = ({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) => {
  const max = Math.max(...data) * 1.1;
  const min = Math.min(...data) * 0.9;
  const range = max - min || 1;
  const w = 100;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${height - ((v - min) / range) * height}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${height}`} style={{ width: '100%', height }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} />
      <polygon points={`0,${height} ${pts} ${w},${height}`} fill={color} opacity={0.1} />
    </svg>
  );
};

// 水平柱状图
const HBarChart = () => {
  const models = [
    { name: 'deepseek-chat', calls: 4523, pct: 100 },
    { name: 'gpt-4o', calls: 3210, pct: 71 },
    { name: 'claude-3.5', calls: 2456, pct: 54 },
    { name: 'qwen-max', calls: 1890, pct: 42 },
    { name: 'glm-4', calls: 1234, pct: 27 },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {models.map(m => (
        <div key={m.name}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ color: '#f1f5f9', fontSize: 13 }}>{m.name}</Text>
            <Text style={{ color: '#94a3b8', fontSize: 12 }}>{m.calls.toLocaleString()} 次</Text>
          </div>
          <div style={{ height: 8, background: '#334155', borderRadius: 4 }}>
            <div style={{ height: '100%', width: `${m.pct}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: 4, transition: 'width 0.6s' }} />
          </div>
        </div>
      ))}
    </div>
  );
};

// 24小时 Token 消耗趋势
const TokenTrend = () => {
  const data = [30, 25, 20, 15, 12, 10, 8, 15, 35, 55, 70, 80, 85, 90, 88, 82, 75, 68, 72, 78, 65, 50, 40, 35];
  const max = Math.max(...data);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80 }}>
        {data.map((v, i) => (
          <Tooltip key={i} title={`${i}:00 - ${v}k tokens`}>
            <div style={{
              flex: 1, height: `${(v / max) * 100}%`, borderRadius: '3px 3px 0 0',
              background: v > 80 ? '#ef4444' : v > 60 ? '#f59e0b' : '#6366f1',
              transition: 'height 0.3s', minWidth: 4,
            }} />
          </Tooltip>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <Text style={{ color: '#64748b', fontSize: 11 }}>00:00</Text>
        <Text style={{ color: '#64748b', fontSize: 11 }}>12:00</Text>
        <Text style={{ color: '#64748b', fontSize: 11 }}>23:00</Text>
      </div>
    </div>
  );
};

const tasksData = [
  { key: '1', name: '科技新闻采集', source: '36氪/虎嗅', status: 'running', lastRun: '2026-07-14 10:30', successRate: 98.5, todayCount: 47 },
  { key: '2', name: '社交媒体监控', source: '微博/Twitter', status: 'running', lastRun: '2026-07-14 10:28', successRate: 96.2, todayCount: 128 },
  { key: '3', name: '竞品动态追踪', source: '官网/App Store', status: 'paused', lastRun: '2026-07-14 08:00', successRate: 100, todayCount: 12 },
  { key: '4', name: '政策法规采集', source: '政府网站', status: 'running', lastRun: '2026-07-14 10:15', successRate: 99.1, todayCount: 23 },
  { key: '5', name: '论坛舆情监控', source: '知乎/贴吧', status: 'failed', lastRun: '2026-07-14 09:45', successRate: 45.3, todayCount: 37 },
];

const statusTagMap: Record<string, { color: string; text: string; pulse?: boolean }> = {
  running: { color: '#10b981', text: '运行中', pulse: true },
  paused: { color: '#f59e0b', text: '暂停' },
  failed: { color: '#ef4444', text: '失败' },
};

const alertsData = [
  { key: '1', icon: <ApiOutlined />, title: '模型 deepseek-chat 响应超时', level: 'warning', desc: '最近5分钟内 deepseek-chat 模型平均响应时间超过10秒，触发超时告警阈值。', time: '5分钟前', actionLabel: '查看模型', actionPath: '/model-engine' },
  { key: '2', icon: <SyncOutlined />, title: "采集任务'科技新闻'连续失败3次", level: 'critical', desc: '科技新闻采集任务在连续3次执行中均返回网络错误，任务已自动暂停。', time: '12分钟前', actionLabel: '查看任务', actionPath: '/lookout' },
  { key: '3', icon: <ThunderboltOutlined />, title: 'Token 消耗达到日配额的80%', level: 'warning', desc: '当前已消耗约960K tokens，预计将在3小时内达到日配额上限(1.2M)。', time: '1小时前', actionLabel: '查看详情', actionPath: '/model-engine' },
  { key: '4', icon: <InfoCircleOutlined />, title: '数据库连接池使用率超过90%', level: 'info', desc: 'MySQL连接池当前活跃连接数45/50，建议检查慢查询或考虑扩容。', time: '2小时前', actionLabel: '系统设置', actionPath: '/settings' },
];

const alertLevelMap: Record<string, { color: string; tag: string; bg: string }> = {
  critical: { color: '#ef4444', tag: '紧急', bg: '#ef444411' },
  warning: { color: '#f59e0b', tag: '警告', bg: '#f59e0b11' },
  info: { color: '#3b82f6', tag: '信息', bg: '#3b82f611' },
};

const MonitorCenter = () => {
  const navigate = useNavigate();
  const [autoRefresh, setAutoRefresh] = useState(true);

  const taskColumns: ColumnsType<typeof tasksData[0]> = [
    {
      title: '任务名称', dataIndex: 'name', key: 'name',
      render: (text: string, record) => (
        <Space>
          {record.status === 'running' && <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }} />}
          <Text style={{ color: '#f1f5f9' }}>{text}</Text>
        </Space>
      ),
    },
    { title: '采集源', dataIndex: 'source', key: 'source', width: 140 },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (s: string) => {
        const info = statusTagMap[s];
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    { title: '上次运行', dataIndex: 'lastRun', key: 'lastRun', width: 160 },
    {
      title: '成功率', dataIndex: 'successRate', key: 'successRate', width: 90,
      render: (v: number) => <Text style={{ color: v >= 95 ? '#10b981' : v >= 80 ? '#f59e0b' : '#ef4444' }}>{v}%</Text>,
    },
    { title: '今日采集量', dataIndex: 'todayCount', key: 'todayCount', width: 110 },
  ];

  return (
    <div>
      {/* 顶部状态条 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, padding: '12px 16px', background: '#0f172a', borderRadius: 8, border: '1px solid #334155' }}>
        <Space>
          <CheckCircleOutlined style={{ color: '#10b981', fontSize: 18 }} />
          <Text strong style={{ color: '#10b981', fontSize: 15 }}>系统运行正常</Text>
          <Text style={{ color: '#64748b', fontSize: 13 }}>|</Text>
          <Text style={{ color: '#94a3b8', fontSize: 13 }}><ClockCircleOutlined /> 最后更新：2026-07-14 10:32:15</Text>
        </Space>
        <Space>
          <Text style={{ color: '#94a3b8', fontSize: 13 }}>自动刷新</Text>
          <Switch checked={autoRefresh} onChange={setAutoRefresh} size="small" />
        </Space>
      </div>

      {/* 核心指标卡片 */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        {[
          { title: '模型 API 成功率', value: '99.2%', color: '#10b981', chart: <MiniLine data={[98.5, 99.1, 98.8, 99.5, 99.2, 99.0, 99.2]} color="#10b981" /> },
          { title: '平均响应延迟', value: '1.2s', color: '#f59e0b', chart: <MiniLine data={[1.5, 1.3, 1.1, 1.4, 1.2, 1.0, 1.2]} color="#f59e0b" /> },
          { title: '今日 Token 消耗', value: '1.2M', color: '#3b82f6', chart: <Progress percent={60} strokeColor="#3b82f6" trailColor="#334155" size="small" format={() => '60%'} /> },
          { title: '活跃采集任务', value: '8/12', color: '#10b981', chart: <Progress percent={66} strokeColor="#10b981" trailColor="#334155" size="small" format={() => '8/12'} /> },
        ].map(c => (
          <Col span={6} key={c.title}>
            <Card style={{ background: '#0f172a', border: '1px solid #334155' }}>
              <Text style={{ color: '#94a3b8', fontSize: 13 }}>{c.title}</Text>
              <div style={{ fontSize: 28, fontWeight: 700, color: c.color, margin: '4px 0 8px' }}>{c.value}</div>
              {c.chart}
            </Card>
          </Col>
        ))}
      </Row>

      {/* 模型监控区 */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={12}>
          <Card title={<Space><RobotOutlined /> 模型调用量排行</Space>} style={{ background: '#0f172a', border: '1px solid #334155' }}>
            <HBarChart />
          </Card>
        </Col>
        <Col span={12}>
          <Card title={<Space><ThunderboltOutlined /> Token 消耗趋势（24h）</Space>} style={{ background: '#0f172a', border: '1px solid #334155' }}>
            <TokenTrend />
          </Card>
        </Col>
      </Row>

      {/* 采集任务监控 */}
      <Card title={<Space><SyncOutlined /> 采集任务监控</Space>} style={{ background: '#0f172a', border: '1px solid #334155', marginBottom: 20 }}>
        <Table columns={taskColumns} dataSource={tasksData} pagination={false} size="middle" />
      </Card>

      {/* 告警列表 */}
      <Card title={<Space><AlertOutlined /> 告警列表</Space>} style={{ background: '#0f172a', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {alertsData.map(a => {
            const levelInfo = alertLevelMap[a.level];
            return (
              <div key={a.key} style={{
                display: 'flex', gap: 12, padding: 16, borderRadius: 8,
                background: levelInfo.bg, border: '1px solid #334155',
                borderLeft: `4px solid ${levelInfo.color}`,
              }}>
                <div style={{ fontSize: 22, color: levelInfo.color, flexShrink: 0, marginTop: 2, animation: a.level === 'critical' ? 'blink 1s infinite' : undefined }}>
                  {a.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Space>
                      <Text strong style={{ color: '#f1f5f9', fontSize: 14 }}>{a.title}</Text>
                      <Tag color={levelInfo.color}>{levelInfo.tag}</Tag>
                    </Space>
                    <Text style={{ color: '#64748b', fontSize: 12 }}><ClockCircleOutlined /> {a.time}</Text>
                  </div>
                  <Text style={{ color: '#94a3b8', fontSize: 13 }}>{a.desc}</Text>
                </div>
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => navigate(a.actionPath)}
                    style={{ borderRadius: 6, background: levelInfo.color, border: 'none', fontSize: 12 }}
                  >
                    {a.actionLabel}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </div>
  );
};

export default MonitorCenter;
