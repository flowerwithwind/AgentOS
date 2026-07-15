import { useState } from 'react';
import {
  Button, Modal, Input, Select, Tag, message, Tooltip,
} from 'antd';
import {
  ExportOutlined, EyeOutlined, FileExcelOutlined, SearchOutlined,
  MessageOutlined, TeamOutlined, ClockCircleOutlined, SmileOutlined,
} from '@ant-design/icons';

/* ===== Mock Data ===== */
interface ConvRecord {
  id: string; question: string; answer: string; sessionId: string;
  user: string; employee: string; duration: number;
  rating: 'good' | 'bad' | 'none'; time: string;
}

const mockConvs: ConvRecord[] = [
  { id: 'conv-001', question: '请帮我分析最近7天的对话数据趋势', answer: '根据系统数据统计，最近7天的对话量呈现波动上升趋势，总对话数2,008次...', sessionId: 'sess-a1b2c3d4', user: 'admin', employee: '小智', duration: 1200, rating: 'good', time: '2026-07-15 14:32' },
  { id: 'conv-002', question: '帮我查询用户增长数据和转化率', answer: '已查询完毕。本月新增用户156人，环比增长12.5%。注册页面转化率23.4%...', sessionId: 'sess-e5f6g7h8', user: 'zhangsan', employee: '数据分析师', duration: 890, rating: 'good', time: '2026-07-15 13:48' },
  { id: 'conv-003', question: '解析这份PDF文档的核心内容', answer: '已完成文档解析。这是一份项目计划书，核心内容包括项目目标、技术方案...', sessionId: 'sess-i9j0k1l2', user: 'lisi', employee: '文档助手', duration: 2100, rating: 'none', time: '2026-07-14 16:45' },
  { id: 'conv-004', question: '写一个Python脚本统计日志文件', answer: '已为您生成日志统计脚本，支持按日期分组统计、错误分类和可视化输出...', sessionId: 'sess-m3n4o5p6', user: 'admin', employee: '代码专家', duration: 1560, rating: 'good', time: '2026-07-14 11:22' },
  { id: 'conv-005', question: '生成今日科技领域舆情简报', answer: '本周科技领域热点：AI大模型竞争白热化、数据隐私与合规、芯片供应链动态...', sessionId: 'sess-q7r8s9t0', user: 'zhaoliu', employee: '舆情分析师', duration: 3200, rating: 'bad', time: '2026-07-13 15:10' },
  { id: 'conv-006', question: '今天北京天气怎么样？', answer: '今天北京天气晴，气温22°C~31°C，空气质量良好，适合外出...', sessionId: 'sess-u1v2w3x4', user: 'test_user', employee: '全能助手', duration: 450, rating: 'good', time: '2026-07-15 12:30' },
  { id: 'conv-007', question: '帮我推荐几本数据分析的入门书籍', answer: '推荐以下数据分析入门书籍：《利用Python进行数据分析》《统计学习基础》...', sessionId: 'sess-y5z6a7b8', user: 'zhangsan', employee: '小智', duration: 780, rating: 'none', time: '2026-07-12 09:35' },
  { id: 'conv-008', question: '数据库中有多少条用户记录？', answer: '当前数据库中共有1,284条用户记录，其中活跃用户占比67.3%...', sessionId: 'sess-c9d0e1f2', user: 'lisi', employee: '数据分析师', duration: 620, rating: 'good', time: '2026-07-11 17:50' },
];

const statCards = [
  { label: '今日对话总数', value: '356', icon: <MessageOutlined />, color: '#6366f1' },
  { label: '活跃用户数', value: '23', icon: <TeamOutlined />, color: '#10b981' },
  { label: '平均响应时间', value: '1.8s', icon: <ClockCircleOutlined />, color: '#f59e0b' },
  { label: '用户满意度', value: '87%', icon: <SmileOutlined />, color: '#3b82f6' },
];

const ratingMap: Record<string, { label: string; color: string; bg: string }> = {
  good: { label: '👍 好评', color: '#10b981', bg: '#10b98122' },
  bad: { label: '👎 差评', color: '#ef4444', bg: '#ef444422' },
  none: { label: '未评价', color: '#64748b', bg: '#64748b22' },
};

const PAGE_SIZE = 5;

/* ===== Component ===== */
const ConversationManagement = () => {
  const [convs] = useState<ConvRecord[]>(mockConvs);
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeConv, setActiveConv] = useState<ConvRecord | null>(null);

  // Filter state
  const [keyword, setKeyword] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('all');
  const [filterTime, setFilterTime] = useState('all');
  const [filterRating, setFilterRating] = useState('all');

  const filtered = convs.filter(c => {
    const matchKeyword = !keyword || c.question.includes(keyword) || c.answer.includes(keyword);
    const matchUser = !filterUser || c.user.includes(filterUser);
    const matchEmp = filterEmployee === 'all' || c.employee === filterEmployee;
    const matchRating = filterRating === 'all' || c.rating === filterRating;
    return matchKeyword && matchUser && matchEmp && matchRating;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const viewDetail = (conv: ConvRecord) => {
    setActiveConv(conv);
    setDetailOpen(true);
  };

  const handleExport = (format: string) => {
    message.success(`正在导出 ${format} 文件，请稍候...`);
    setExportOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {statCards.map(c => (
          <div key={c.label} style={{
            background: '#1e293b', borderRadius: 12, padding: '20px 24px',
            border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>{c.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#f1f5f9' }}>{c.value}</div>
            </div>
            <div style={{
              width: 48, height: 48, borderRadius: 12, background: `${c.color}22`,
              color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
            }}>{c.icon}</div>
          </div>
        ))}
      </div>

      {/* 工具栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <Button
          onClick={() => setFilterOpen(!filterOpen)}
          style={{
            borderRadius: 8, borderColor: filterOpen ? '#6366f1' : '#334155',
            color: filterOpen ? '#6366f1' : '#94a3b8',
            background: filterOpen ? '#6366f122' : 'transparent',
          }}
        >
          <SearchOutlined style={{ marginRight: 6 }} />
          {filterOpen ? '收起筛选' : '高级筛选'}
        </Button>
        <Button type="primary" icon={<ExportOutlined />} style={{ borderRadius: 8, background: '#6366f1', border: 'none' }} onClick={() => setExportOpen(true)}>
          导出数据
        </Button>
      </div>

      {/* 高级筛选面板 */}
      {filterOpen && (
        <div style={{
          background: '#0f172a', borderRadius: 12, border: '1px solid #334155',
          padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end',
        }}>
          <div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>关键词搜索</div>
            <Input
              value={keyword} onChange={e => { setKeyword(e.target.value); setPage(1); }}
              placeholder="搜索对话内容..." style={{ width: 200, borderRadius: 8, background: '#1e293b', border: '1px solid #334155' }}
              allowClear
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>用户名</div>
            <Input
              value={filterUser} onChange={e => { setFilterUser(e.target.value); setPage(1); }}
              placeholder="筛选用户" style={{ width: 140, borderRadius: 8, background: '#1e293b', border: '1px solid #334155' }}
              allowClear
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>数字员工</div>
            <Select
              value={filterEmployee} onChange={v => { setFilterEmployee(v); setPage(1); }}
              style={{ width: 140 }}
              options={[
                { label: '全部', value: 'all' },
                { label: '小智', value: '小智' },
                { label: '数据分析师', value: '数据分析师' },
                { label: '文档助手', value: '文档助手' },
                { label: '代码专家', value: '代码专家' },
                { label: '舆情分析师', value: '舆情分析师' },
                { label: '全能助手', value: '全能助手' },
              ]}
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>时间范围</div>
            <Select
              value={filterTime} onChange={setFilterTime}
              style={{ width: 120 }}
              options={[
                { label: '全部', value: 'all' },
                { label: '今日', value: 'today' },
                { label: '近7天', value: '7d' },
                { label: '近30天', value: '30d' },
              ]}
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>评价筛选</div>
            <Select
              value={filterRating} onChange={v => { setFilterRating(v); setPage(1); }}
              style={{ width: 120 }}
              options={[
                { label: '全部', value: 'all' },
                { label: '👍 好评', value: 'good' },
                { label: '👎 差评', value: 'bad' },
                { label: '未评价', value: 'none' },
              ]}
            />
          </div>
        </div>
      )}

      {/* 表格 */}
      <div style={{ background: '#0f172a', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', color: '#f1f5f9', fontSize: 13, minWidth: 900 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                {['对话ID', '用户提问', '数字员工回复', '所属会话', '用户', '数字员工', '耗时', '评价', '时间', '操作'].map(h => (
                  <th key={h} style={{ padding: '12px 10px', textAlign: 'left', color: '#94a3b8', fontWeight: 500, fontSize: 12, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #334155' }}>
                  <td style={{ padding: '12px 10px', fontFamily: 'monospace', fontSize: 12, color: '#94a3b8' }}>
                    <Tooltip title={c.id}>{c.id.slice(0, 10)}...</Tooltip>
                  </td>
                  <td style={{ padding: '12px 10px', maxWidth: 180 }}>
                    <Tooltip title={c.question}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.question}</div>
                    </Tooltip>
                  </td>
                  <td style={{ padding: '12px 10px', maxWidth: 180 }}>
                    <Tooltip title={c.answer}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#94a3b8' }}>{c.answer}</div>
                    </Tooltip>
                  </td>
                  <td style={{ padding: '12px 10px', fontFamily: 'monospace', fontSize: 11, color: '#64748b' }}>
                    <Tooltip title={c.sessionId}>{c.sessionId.slice(0, 12)}...</Tooltip>
                  </td>
                  <td style={{ padding: '12px 10px' }}>{c.user}</td>
                  <td style={{ padding: '12px 10px' }}>
                    <Tag style={{ background: '#6366f122', color: '#6366f1', border: 'none', borderRadius: 4, fontSize: 11 }}>{c.employee}</Tag>
                  </td>
                  <td style={{ padding: '12px 10px', fontSize: 12, color: '#94a3b8' }}>{c.duration}ms</td>
                  <td style={{ padding: '12px 10px' }}>
                    <Tag style={{
                      background: ratingMap[c.rating]?.bg, color: ratingMap[c.rating]?.color,
                      border: 'none', borderRadius: 4, fontSize: 11,
                    }}>{ratingMap[c.rating]?.label}</Tag>
                  </td>
                  <td style={{ padding: '12px 10px', fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>{c.time}</td>
                  <td style={{ padding: '12px 10px' }}>
                    <Tooltip title="查看详情">
                      <Button size="small" icon={<EyeOutlined />} style={{ borderRadius: 6, borderColor: '#334155', color: '#6366f1' }} onClick={() => viewDetail(c)} />
                    </Tooltip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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

      {/* 导出 Modal */}
      <Modal
        title="导出数据" open={exportOpen} onCancel={() => setExportOpen(false)}
        footer={null}
        width={400}
        styles={{ body: { background: '#1e293b' }, header: { background: '#1e293b', borderBottom: '1px solid #334155' } }}
      >
        <div style={{ padding: '8px 0' }}>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>选择导出格式：</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div
              onClick={() => handleExport('CSV')}
              style={{
                flex: 1, padding: '20px 16px', borderRadius: 10, cursor: 'pointer',
                border: '1px solid #334155', background: '#0f172a', textAlign: 'center',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#6366f1'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#334155'; }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>CSV</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>通用格式，兼容性好</div>
            </div>
            <div
              onClick={() => handleExport('Excel')}
              style={{
                flex: 1, padding: '20px 16px', borderRadius: 10, cursor: 'pointer',
                border: '1px solid #334155', background: '#0f172a', textAlign: 'center',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#6366f1'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#334155'; }}
            >
              <FileExcelOutlined style={{ fontSize: 28, color: '#10b981', marginBottom: 8, display: 'block' }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>Excel</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>支持多工作表</div>
            </div>
          </div>
        </div>
      </Modal>

      {/* 详情 Modal */}
      <Modal
        title="对话详情" open={detailOpen} onCancel={() => setDetailOpen(false)}
        footer={null} width={640}
        styles={{ body: { background: '#1e293b', maxHeight: '60vh', overflowY: 'auto' }, header: { background: '#1e293b', borderBottom: '1px solid #334155' } }}
      >
        {activeConv && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* 元信息 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: 16, background: '#0f172a', borderRadius: 10 }}>
              <div><span style={{ fontSize: 12, color: '#64748b' }}>用户：</span><span style={{ fontSize: 13, color: '#f1f5f9' }}>{activeConv.user}</span></div>
              <div><span style={{ fontSize: 12, color: '#64748b' }}>数字员工：</span><span style={{ fontSize: 13, color: '#f1f5f9' }}>{activeConv.employee}</span></div>
              <div><span style={{ fontSize: 12, color: '#64748b' }}>耗时：</span><span style={{ fontSize: 13, color: '#f1f5f9' }}>{activeConv.duration}ms</span></div>
              <div><span style={{ fontSize: 12, color: '#64748b' }}>时间：</span><span style={{ fontSize: 13, color: '#f1f5f9' }}>{activeConv.time}</span></div>
            </div>

            {/* 上下文消息 */}
            <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', paddingBottom: 4, borderBottom: '1px solid #334155' }}>对话上下文</div>

            {/* 前一条（上下文） */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: 12, background: '#6366f1', color: '#fff', fontSize: 13, lineHeight: 1.6, borderBottomRightRadius: 4 }}>
                {activeConv.question.includes('数据') ? '请帮我查看一下系统数据情况' : '你好，我需要帮助'}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: -8, textAlign: 'right' }}>上文 · 前1分钟</div>
            </div>

            {/* 当前用户提问 */}
            <div style={{ fontSize: 12, color: '#6366f1', fontWeight: 500 }}>— 当前对话 —</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: 12, background: '#6366f1', color: '#fff', fontSize: 13, lineHeight: 1.6, borderBottomRightRadius: 4 }}>
                {activeConv.question}
              </div>
            </div>

            {/* AI 回复 */}
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: 12, background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0', fontSize: 13, lineHeight: 1.6, borderBottomLeftRadius: 4 }}>
                {activeConv.answer}
              </div>
            </div>

            {/* 评价 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>用户评价：</span>
              <Tag style={{
                background: ratingMap[activeConv.rating]?.bg,
                color: ratingMap[activeConv.rating]?.color,
                border: 'none', borderRadius: 4,
              }}>
                {ratingMap[activeConv.rating]?.label}
              </Tag>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ConversationManagement;
