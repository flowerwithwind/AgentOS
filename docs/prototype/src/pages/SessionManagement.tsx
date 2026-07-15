import { useState } from 'react';
import {
  Avatar, Button, Input, Select, Drawer, Tag, message, Tooltip,
} from 'antd';
import {
  SearchOutlined, EyeOutlined, DeleteOutlined, RobotOutlined, UserOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';

/* ===== Mock Data ===== */
interface Session {
  id: string; user: string; employee: string; employeeAvatar: string;
  messageCount: number; firstTime: string; lastTime: string;
  status: '活跃' | '已结束';
}

interface ChatMsg {
  role: 'user' | 'assistant'; content: string; time: string;
}

const mockSessions: Session[] = [
  { id: 'sess-a1b2c3d4', user: 'admin', employee: '小智', employeeAvatar: '智', messageCount: 24, firstTime: '2026-07-15 09:12', lastTime: '2026-07-15 14:32', status: '活跃' },
  { id: 'sess-e5f6g7h8', user: 'zhangsan', employee: '数据分析师', employeeAvatar: '数', messageCount: 18, firstTime: '2026-07-15 10:05', lastTime: '2026-07-15 13:48', status: '活跃' },
  { id: 'sess-i9j0k1l2', user: 'lisi', employee: '文档助手', employeeAvatar: '文', messageCount: 12, firstTime: '2026-07-14 15:20', lastTime: '2026-07-14 16:45', status: '已结束' },
  { id: 'sess-m3n4o5p6', user: 'admin', employee: '代码专家', employeeAvatar: '代', messageCount: 31, firstTime: '2026-07-14 08:30', lastTime: '2026-07-14 11:22', status: '已结束' },
  { id: 'sess-q7r8s9t0', user: 'zhaoliu', employee: '舆情分析师', employeeAvatar: '舆', messageCount: 8, firstTime: '2026-07-13 14:00', lastTime: '2026-07-13 15:10', status: '已结束' },
  { id: 'sess-u1v2w3x4', user: 'test_user', employee: '全能助手', employeeAvatar: '全', messageCount: 15, firstTime: '2026-07-15 07:45', lastTime: '2026-07-15 12:30', status: '活跃' },
  { id: 'sess-y5z6a7b8', user: 'zhangsan', employee: '小智', employeeAvatar: '智', messageCount: 6, firstTime: '2026-07-12 09:00', lastTime: '2026-07-12 09:35', status: '已结束' },
  { id: 'sess-c9d0e1f2', user: 'lisi', employee: '数据分析师', employeeAvatar: '数', messageCount: 22, firstTime: '2026-07-11 16:00', lastTime: '2026-07-11 17:50', status: '已结束' },
];

const mockMessagesMap: Record<string, ChatMsg[]> = {
  'sess-a1b2c3d4': [
    { role: 'user', content: '帮我查一下最近7天的系统对话数据', time: '09:12' },
    { role: 'assistant', content: '好的，已为您查询最近7天的系统对话数据。总共 2,008 次对话，日均 286 次，峰值出现在周四（421次）。', time: '09:12' },
    { role: 'user', content: '能分析一下趋势吗？', time: '09:15' },
    { role: 'assistant', content: '从趋势来看，工作日对话量明显高于周末，周三到周五是高峰期。建议在工作日高峰前增加服务器资源预留。', time: '09:15' },
  ],
  'sess-e5f6g7h8': [
    { role: 'user', content: '请帮我查询用户增长数据', time: '10:05' },
    { role: 'assistant', content: '已查询完毕。本月新增用户 156 人，环比增长 12.5%。主要来源渠道：注册页面 68%、邀请注册 32%。', time: '10:06' },
    { role: 'user', content: '各渠道的转化率如何？', time: '10:08' },
    { role: 'assistant', content: '注册页面转化率为 23.4%，邀请注册转化率为 41.2%。建议加大邀请注册的推广力度。', time: '10:08' },
  ],
  'sess-i9j0k1l2': [
    { role: 'user', content: '帮我解析这份PDF文档的核心内容', time: '15:20' },
    { role: 'assistant', content: '已完成文档解析。这是一份项目计划书，核心内容包括：项目目标、技术方案、时间规划和预算分析。需要我详细展开哪个部分？', time: '15:21' },
    { role: 'user', content: '展开技术方案部分', time: '15:23' },
    { role: 'assistant', content: '技术方案概述：采用微服务架构，前端使用 React + TypeScript，后端使用 Python + FastAPI，数据库采用 MySQL + Redis。部署方案为 Kubernetes 集群。', time: '15:23' },
  ],
  'sess-m3n4o5p6': [
    { role: 'user', content: '帮我写一个 Python 脚本统计日志文件', time: '08:30' },
    { role: 'assistant', content: '好的，已为您生成日志统计脚本。该脚本支持按日期分组统计、错误分类和可视化输出。需要我调整任何部分吗？', time: '08:31' },
    { role: 'user', content: '增加对 JSON 格式日志的支持', time: '08:35' },
    { role: 'assistant', content: '已更新脚本，新增 JSON 格式日志解析功能。支持自动检测日志格式，并统一输出结构。', time: '08:36' },
  ],
};

const defaultMessages: ChatMsg[] = [
  { role: 'user', content: '你好，请介绍一下你的功能', time: '14:00' },
  { role: 'assistant', content: '你好！我是 AI 助手，可以帮您完成多种任务，包括数据查询、信息检索、文档处理等。请问有什么可以帮您的？', time: '14:00' },
  { role: 'user', content: '好的，谢谢', time: '14:01' },
  { role: 'assistant', content: '不客气！随时为您服务。', time: '14:01' },
];

const statusColor: Record<string, { bg: string; color: string }> = {
  '活跃': { bg: '#10b98122', color: '#10b981' },
  '已结束': { bg: '#64748b22', color: '#64748b' },
};

const PAGE_SIZE = 5;

const employees = ['全部', '小智', '数据分析师', '文档助手', '代码专家', '舆情分析师', '全能助手'];

/* ===== Component ===== */
const SessionManagement = () => {
  const [sessions] = useState<Session[]>(mockSessions);
  const [userSearch, setUserSearch] = useState('');
  const [timeRange, setTimeRange] = useState('all');
  const [empFilter, setEmpFilter] = useState('全部');
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeMessages, setActiveMessages] = useState<ChatMsg[]>(defaultMessages);
  const [activeSession, setActiveSession] = useState<Session | null>(null);

  const filtered = sessions.filter(s => {
    const matchUser = !userSearch || s.user.includes(userSearch);
    const matchEmp = empFilter === '全部' || s.employee === empFilter;
    return matchUser && matchEmp;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const viewMessages = (session: Session) => {
    setActiveSession(session);
    setActiveMessages(mockMessagesMap[session.id] || defaultMessages);
    setDrawerOpen(true);
  };

  const handleDelete = (id: string) => {
    message.success('会话已删除');
    void id;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 筛选栏 */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <Input
          prefix={<SearchOutlined style={{ color: '#64748b' }} />}
          placeholder="搜索用户名..." value={userSearch}
          onChange={e => { setUserSearch(e.target.value); setPage(1); }}
          style={{ width: 200, borderRadius: 8, background: '#0f172a', border: '1px solid #334155' }}
          allowClear
        />
        <Select
          value={timeRange} onChange={v => setTimeRange(v)}
          style={{ width: 140 }}
          options={[
            { label: '全部时间', value: 'all' },
            { label: '今日', value: 'today' },
            { label: '近7天', value: '7d' },
            { label: '近30天', value: '30d' },
          ]}
        />
        <Select
          value={empFilter} onChange={v => { setEmpFilter(v); setPage(1); }}
          style={{ width: 150 }}
          options={employees.map(e => ({ label: e === '全部' ? '全部员工' : e, value: e }))}
        />
      </div>

      {/* 表格 */}
      <div style={{ background: '#0f172a', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#f1f5f9', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155' }}>
              {['会话ID', '用户', '数字员工', '消息数', '首条消息', '最后消息', '状态', '操作'].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: '#94a3b8', fontWeight: 500, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 12, color: '#94a3b8' }}>
                  <Tooltip title={s.id}>
                    {s.id.slice(0, 10)}...
                  </Tooltip>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Avatar style={{ background: '#3b82f6' }} size={24}><UserOutlined /></Avatar>
                    <span>{s.user}</span>
                  </div>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Avatar style={{ background: '#6366f1' }} size={24}>{s.employeeAvatar}</Avatar>
                    <span>{s.employee}</span>
                  </div>
                </td>
                <td style={{ padding: '12px 14px', color: '#94a3b8' }}>{s.messageCount}</td>
                <td style={{ padding: '12px 14px', color: '#94a3b8', fontSize: 12 }}>
                  <ClockCircleOutlined style={{ marginRight: 4, color: '#64748b' }} />{s.firstTime}
                </td>
                <td style={{ padding: '12px 14px', color: '#94a3b8', fontSize: 12 }}>
                  <ClockCircleOutlined style={{ marginRight: 4, color: '#64748b' }} />{s.lastTime}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <Tag style={{
                    background: statusColor[s.status]?.bg, color: statusColor[s.status]?.color,
                    border: 'none', borderRadius: 4, fontSize: 12,
                  }}>{s.status}</Tag>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Tooltip title="查看消息">
                      <Button size="small" icon={<EyeOutlined />} style={{ borderRadius: 6, borderColor: '#334155', color: '#6366f1' }} onClick={() => viewMessages(s)} />
                    </Tooltip>
                    <Tooltip title="删除">
                      <Button size="small" icon={<DeleteOutlined />} style={{ borderRadius: 6, borderColor: '#334155', color: '#ef4444' }} onClick={() => handleDelete(s.id)} />
                    </Tooltip>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 分页 */}
        <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #334155' }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>共 {filtered.length} 条记录</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <Button size="small" disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ borderRadius: 6, borderColor: '#334155', color: '#94a3b8' }}>上一页</Button>
            {Array.from({ length: totalPages }, (_, i) => (
              <Button
                key={i + 1} size="small"
                style={{
                  borderRadius: 6, minWidth: 32,
                  borderColor: page === i + 1 ? '#6366f1' : '#334155',
                  color: page === i + 1 ? '#6366f1' : '#94a3b8',
                  background: page === i + 1 ? '#6366f122' : 'transparent',
                }}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </Button>
            ))}
            <Button size="small" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ borderRadius: 6, borderColor: '#334155', color: '#94a3b8' }}>下一页</Button>
          </div>
        </div>
      </div>

      {/* 消息详情 Drawer */}
      <Drawer
        title={activeSession ? `会话消息 - ${activeSession.user} ↔ ${activeSession.employee}` : '会话消息'}
        open={drawerOpen} onClose={() => setDrawerOpen(false)}
        width={480}
        styles={{ body: { background: '#0f172a', padding: 0 }, header: { background: '#1e293b', borderBottom: '1px solid #334155' } }}
      >
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16, height: '100%', overflowY: 'auto' }}>
          {activeMessages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {msg.role === 'assistant' && (
                <Avatar style={{ background: '#6366f1', marginRight: 8, flexShrink: 0, marginTop: 4 }} icon={<RobotOutlined />} size={32} />
              )}
              <div style={{ maxWidth: '75%' }}>
                <div style={{
                  padding: '10px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.6,
                  background: msg.role === 'user' ? '#6366f1' : '#1e293b',
                  border: msg.role === 'assistant' ? '1px solid #334155' : 'none',
                  color: msg.role === 'user' ? '#fff' : '#e2e8f0',
                  borderBottomRightRadius: msg.role === 'user' ? 4 : 12,
                  borderBottomLeftRadius: msg.role === 'assistant' ? 4 : 12,
                }}>
                  {msg.content}
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                  {msg.time}
                </div>
              </div>
              {msg.role === 'user' && (
                <Avatar style={{ background: '#3b82f6', marginLeft: 8, flexShrink: 0, marginTop: 4 }} size={32}><UserOutlined /></Avatar>
              )}
            </div>
          ))}
        </div>
      </Drawer>
    </div>
  );
};

export default SessionManagement;
