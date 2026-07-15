import { useState } from 'react';
import {
  Card, Row, Col, Tabs, Table, Tag, Button, Modal, Input, Select,
  Switch, Progress, Space, DatePicker, Typography, message, Tooltip,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, DeleteOutlined, EyeOutlined,
  ThunderboltOutlined, ReloadOutlined, ExportOutlined, GlobalOutlined,
  CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined,
  SyncOutlined, DatabaseOutlined, RadarChartOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

/* ==================== 模拟数据 ==================== */

const sourceData = [
  { key: '1', name: 'AI行业动态', type: '百度新闻', keywords: ['人工智能', '大模型', 'AGI'], enabled: true, frequency: '每小时', lastCollect: '2026-07-15 09:30' },
  { key: '2', name: '智慧城市新闻', type: '搜狗微信', keywords: ['智慧城市', '数字政务', '新型基建'], enabled: true, frequency: '每天', lastCollect: '2026-07-15 08:00' },
  { key: '3', name: '科技财经资讯', type: '百度新闻', keywords: ['芯片', '半导体', '量子计算'], enabled: false, frequency: '每天', lastCollect: '2026-07-14 18:00' },
  { key: '4', name: '高校科研动态', type: 'RSS', keywords: ['西华大学', '科研突破', '产学研'], enabled: true, frequency: '每周', lastCollect: '2026-07-13 10:00' },
  { key: '5', name: '自动驾驶追踪', type: '自定义', keywords: ['自动驾驶', 'L4路测', '智能网联'], enabled: true, frequency: '每小时', lastCollect: '2026-07-15 09:45' },
];

const taskData = [
  { key: '1', name: 'AI行业动态-定时采集', source: 'AI行业动态', status: 'running' as const, progress: 67, count: 34, startTime: '2026-07-15 09:30', duration: '2分12秒' },
  { key: '2', name: '智慧城市-手动采集', source: '智慧城市新闻', status: 'completed' as const, progress: 100, count: 52, startTime: '2026-07-15 08:00', duration: '4分38秒' },
  { key: '3', name: '芯片产业-深度扫描', source: '科技财经资讯', status: 'failed' as const, progress: 45, count: 0, startTime: '2026-07-15 07:15', duration: '1分05秒', error: '目标源连接超时' },
  { key: '4', name: '高校科研-周报汇总', source: '高校科研动态', status: 'completed' as const, progress: 100, count: 28, startTime: '2026-07-14 22:00', duration: '6分21秒' },
  { key: '5', name: '自动驾驶-实时监控', source: '自动驾驶追踪', status: 'queued' as const, progress: 0, count: 0, startTime: '-', duration: '-' },
];

const warehouseData = [
  { key: '1', title: 'OpenAI发布GPT-5：多模态能力全面升级，推理速度提升3倍', source: '百度新闻', summary: 'OpenAI最新发布的GPT-5模型在多模态理解、逻辑推理和代码生成方面均有显著提升，API调用成本降低40%，已有超过200家企业接入测试...', collectTime: '2026-07-15 09:32', deepStatus: 'completed', sentiment: 'positive' },
  { key: '2', title: '某市智慧城市项目被曝数据安全隐患，涉及百万用户信息', source: '搜狗微信', summary: '安全研究人员披露某智慧城市平台存在未授权访问漏洞，大量市民个人信息面临泄露风险，相关部门已介入调查...', collectTime: '2026-07-15 08:15', deepStatus: 'completed', sentiment: 'negative' },
  { key: '3', title: '国产芯片突破7nm工艺节点，良率达到商用标准', source: '百度新闻', summary: '国内半导体企业宣布在7nm制程工艺上取得重大突破，芯片良率已稳定在90%以上，预计明年实现大规模量产...', collectTime: '2026-07-15 07:45', deepStatus: 'collecting', sentiment: 'positive' },
  { key: '4', title: '西华大学联合实验室在具身智能领域发表重要研究成果', source: 'RSS', summary: '西华大学人工智能研究院与中科院联合发表的论文提出新型具身智能框架，在机器人自主导航任务中刷新多项基准记录...', collectTime: '2026-07-14 16:20', deepStatus: 'completed', sentiment: 'positive' },
  { key: '5', title: '自动驾驶L4路测事故率数据首次公开：低于人类驾驶员', source: '百度新闻', summary: '工信部首次公开自动驾驶L4级别路测安全数据，事故率仅为人类驾驶员的1/8，但复杂天气场景仍是主要挑战...', collectTime: '2026-07-14 14:10', deepStatus: 'pending', sentiment: 'neutral' },
  { key: '6', title: '多地出台AI产业扶持政策，人才争夺战加剧', source: '搜狗微信', summary: '继深圳、上海之后，成都、武汉等城市相继发布人工智能产业专项扶持计划，高端AI人才薪酬水涨船高...', collectTime: '2026-07-14 11:30', deepStatus: 'pending', sentiment: 'neutral' },
  { key: '7', title: '量子计算商业化落地提速，金融风控场景率先应用', source: '自定义', summary: '多家金融机构开始部署量子计算解决方案用于风险评估和投资组合优化，计算效率较传统方案提升百倍以上...', collectTime: '2026-07-13 09:00', deepStatus: 'completed', sentiment: 'positive' },
];

/* ==================== 统计卡片 ==================== */
const statCards = [
  { title: '信息源总数', value: '8', icon: <GlobalOutlined />, color: '#6366f1' },
  { title: '今日采集量', value: '247', icon: <RadarChartOutlined />, color: '#10b981' },
  { title: '数据仓库总量', value: '12,847', icon: <DatabaseOutlined />, color: '#3b82f6' },
  { title: '深度采集完成', value: '3,456', icon: <CheckCircleOutlined />, color: '#f59e0b' },
];

/* ==================== 信息源管理标签页 ==================== */
const SourceTab = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [newKeywords, setNewKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');

  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (kw && !newKeywords.includes(kw)) {
      setNewKeywords([...newKeywords, kw]);
      setKeywordInput('');
    }
  };

  const columns: ColumnsType<typeof sourceData[0]> = [
    { title: '源名称', dataIndex: 'name', key: 'name', render: (t: string) => <Text strong style={{ color: '#f1f5f9' }}>{t}</Text> },
    { title: '源类型', dataIndex: 'type', key: 'type', width: 110, render: (t: string) => <Tag color="#6366f1">{t}</Tag> },
    {
      title: '关键词', dataIndex: 'keywords', key: 'keywords',
      render: (kws: string[]) => <Space wrap>{kws.map(k => <Tag key={k} color="blue">{k}</Tag>)}</Space>,
    },
    {
      title: '状态', dataIndex: 'enabled', key: 'enabled', width: 90,
      render: (v: boolean) => <Switch checked={v} checkedChildren="启用" unCheckedChildren="暂停" size="small" />,
    },
    { title: '采集频率', dataIndex: 'frequency', key: 'frequency', width: 100, render: (t: string) => <Tag color="cyan">{t}</Tag> },
    { title: '最后采集', dataIndex: 'lastCollect', key: 'lastCollect', width: 160 },
    {
      title: '操作', key: 'action', width: 200,
      render: () => (
        <Space>
          <Button type="link" size="small" style={{ color: '#6366f1' }}>编辑</Button>
          <Button type="link" size="small" danger>删除</Button>
          <Button type="link" size="small" style={{ color: '#10b981' }}><ThunderboltOutlined /> 采集</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Text style={{ color: '#94a3b8' }}>管理所有信息源配置，设置关键词和采集策略</Text>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>新建信息源</Button>
      </div>
      <Table columns={columns} dataSource={sourceData} pagination={false} size="middle" />

      <Modal title="新建信息源" open={modalOpen} onCancel={() => { setModalOpen(false); setNewKeywords([]); }} onOk={() => { message.success('信息源创建成功'); setModalOpen(false); setNewKeywords([]); }} okText="创建" cancelText="取消">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div><Text style={{ color: '#94a3b8', fontSize: 13 }}>源名称</Text><Input placeholder="如：AI行业动态" style={{ marginTop: 4 }} /></div>
          <div>
            <Text style={{ color: '#94a3b8', fontSize: 13 }}>源类型</Text>
            <Select placeholder="选择源类型" style={{ width: '100%', marginTop: 4 }} options={[{ value: '百度新闻', label: '百度新闻' }, { value: '搜狗微信', label: '搜狗微信' }, { value: 'RSS', label: 'RSS' }, { value: '自定义', label: '自定义' }]} />
          </div>
          <div>
            <Text style={{ color: '#94a3b8', fontSize: 13 }}>关键词</Text>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <Input placeholder="输入关键词后按添加" value={keywordInput} onChange={e => setKeywordInput(e.target.value)} onPressEnter={addKeyword} />
              <Button onClick={addKeyword}>添加</Button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {newKeywords.map(k => <Tag key={k} closable onClose={() => setNewKeywords(newKeywords.filter(x => x !== k))} color="blue">{k}</Tag>)}
            </div>
          </div>
          <div>
            <Text style={{ color: '#94a3b8', fontSize: 13 }}>采集频率</Text>
            <Select placeholder="选择频率" style={{ width: '100%', marginTop: 4 }} options={[{ value: 'hourly', label: '每小时' }, { value: 'daily', label: '每天' }, { value: 'weekly', label: '每周' }]} />
          </div>
          <div><Text style={{ color: '#94a3b8', fontSize: 13 }}>代理设置（可选）</Text><Input placeholder="如：http://proxy:8080" style={{ marginTop: 4 }} /></div>
        </div>
      </Modal>
    </div>
  );
};

/* ==================== 采集任务标签页 ==================== */
const TaskTab = () => {
  const statusMap: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
    running: { color: '#3b82f6', text: '运行中', icon: <SyncOutlined spin /> },
    completed: { color: '#10b981', text: '已完成', icon: <CheckCircleOutlined /> },
    failed: { color: '#ef4444', text: '失败', icon: <CloseCircleOutlined /> },
    queued: { color: '#f59e0b', text: '排队中', icon: <ClockCircleOutlined /> },
  };

  const columns: ColumnsType<typeof taskData[0]> = [
    { title: '任务名称', dataIndex: 'name', key: 'name', render: (t: string, r) => (
      <div><Text strong style={{ color: '#f1f5f9' }}>{t}</Text>{r.error && <div><Text style={{ color: '#ef4444', fontSize: 12 }}>{r.error}</Text></div>}</div>
    )},
    { title: '信息源', dataIndex: 'source', key: 'source', width: 140 },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 110,
      render: (s: string) => { const info = statusMap[s]; return <Tag icon={info.icon} color={info.color}>{info.text}</Tag>; },
    },
    {
      title: '进度', dataIndex: 'progress', key: 'progress', width: 160,
      render: (p: number, r) => (
        <Progress percent={p} size="small" status={r.status === 'failed' ? 'exception' : r.status === 'running' ? 'active' : undefined} strokeColor={r.status === 'failed' ? '#ef4444' : '#6366f1'} />
      ),
    },
    { title: '采集数量', dataIndex: 'count', key: 'count', width: 100, align: 'center', render: (c: number) => <Text style={{ color: '#f1f5f9', fontWeight: 600 }}>{c}</Text> },
    { title: '开始时间', dataIndex: 'startTime', key: 'startTime', width: 160 },
    { title: '耗时', dataIndex: 'duration', key: 'duration', width: 100 },
    {
      title: '操作', key: 'action', width: 130,
      render: (_: unknown, r) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} style={{ color: '#6366f1' }}>详情</Button>
          {(r.status === 'running' || r.status === 'queued') && <Button type="link" size="small" danger>取消</Button>}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {[
          { label: '今日采集量', value: '247', color: '#6366f1' },
          { label: '成功率', value: '89.2%', color: '#10b981' },
          { label: '运行中任务', value: '1', color: '#3b82f6' },
        ].map(s => (
          <Col span={8} key={s.label}>
            <Card size="small" style={{ background: '#0f172a', border: '1px solid #334155' }}>
              <Text style={{ color: '#94a3b8', fontSize: 12 }}>{s.label}</Text>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
            </Card>
          </Col>
        ))}
      </Row>
      <Table columns={columns} dataSource={taskData} pagination={false} size="middle"
        rowClassName={(r) => r.status === 'failed' ? 'row-failed' : ''} />
      <style>{`.row-failed td { background: rgba(239,68,68,0.06) !important; }`}</style>
    </div>
  );
};

/* ==================== 数据仓库标签页 ==================== */
const WarehouseTab = () => {
  const [detailModal, setDetailModal] = useState<{ open: boolean; title: string; content: string }>({ open: false, title: '', content: '' });
  const [deepModal, setDeepModal] = useState<{ open: boolean; step: number }>({ open: false, step: 0 });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const sentimentMap: Record<string, { color: string; text: string }> = {
    positive: { color: '#10b981', text: '正面' },
    negative: { color: '#ef4444', text: '负面' },
    neutral: { color: '#64748b', text: '中性' },
  };

  const deepStatusMap: Record<string, { color: string; text: string }> = {
    pending: { color: '#64748b', text: '未采集' },
    collecting: { color: '#3b82f6', text: '采集中' },
    completed: { color: '#10b981', text: '已完成' },
  };

  const fullContents: Record<string, string> = {
    '1': 'OpenAI于今日正式发布GPT-5模型，这是该公司迄今为止最强大的人工智能模型。\n\n新模型在多模态理解方面取得了重大突破，能够同时处理文本、图像、音频和视频输入。在逻辑推理基准测试中，GPT-5的得分比前代模型提升了47%，在复杂数学推理任务中的表现已接近人类专家水平。\n\n值得注意的是，GPT-5的API调用成本相比GPT-4降低了40%，推理速度提升了3倍，这使得大规模商业应用变得更加可行。目前已有超过200家企业接入测试，覆盖金融、医疗、教育、法律等多个行业。\n\nOpenAI CEO表示，GPT-5标志着人工智能从"工具"向"合作伙伴"的转变，未来将重点发展AI Agent的自主决策和多步任务执行能力。',
    '2': '近日，安全研究人员在一次例行审计中发现，某市智慧城市综合管理平台存在严重的数据安全漏洞。\n\n该漏洞属于未授权访问类型（CVE-2026-XXXX），攻击者可以通过构造特定的API请求，绕过身份验证机制，直接访问系统中存储的市民个人信息，包括姓名、身份证号、手机号码、家庭住址等敏感数据。\n\n据初步评估，受影响的用户数量可能超过100万。安全团队已将该漏洞通报给相关主管部门，该平台目前已紧急下线进行修复。\n\n此事件再次引发了公众对智慧城市建设中数据安全保护问题的关注。专家指出，许多政务系统在快速上线过程中，安全审计环节往往被忽视。',
  };

  const columns: ColumnsType<typeof warehouseData[0]> = [
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true, render: (t: string) => <Text strong style={{ color: '#f1f5f9' }}>{t}</Text> },
    { title: '来源', dataIndex: 'source', key: 'source', width: 110 },
    {
      title: '摘要', dataIndex: 'summary', key: 'summary', width: 220, ellipsis: true,
      render: (s: string) => <Tooltip title={s}><Text style={{ color: '#94a3b8' }}>{s.length > 50 ? s.slice(0, 50) + '...' : s}</Text></Tooltip>,
    },
    { title: '采集时间', dataIndex: 'collectTime', key: 'collectTime', width: 160 },
    {
      title: '深度采集', dataIndex: 'deepStatus', key: 'deepStatus', width: 100,
      render: (s: string) => { const info = deepStatusMap[s]; return <Tag color={info.color}>{info.text}</Tag>; },
    },
    {
      title: '情感', dataIndex: 'sentiment', key: 'sentiment', width: 80,
      render: (s: string) => { const info = sentimentMap[s]; return <Tag color={info.color}>{info.text}</Tag>; },
    },
    {
      title: '操作', key: 'action', width: 220,
      render: (_: unknown, r) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} style={{ color: '#6366f1' }}
            onClick={() => setDetailModal({ open: true, title: r.title, content: fullContents[r.key] || r.summary })}>全文</Button>
          <Button type="link" size="small" icon={<ThunderboltOutlined />} style={{ color: '#f59e0b' }}
            onClick={() => { setDeepModal({ open: true, step: 0 }); setTimeout(() => setDeepModal({ open: true, step: 1 }), 1200); setTimeout(() => setDeepModal({ open: true, step: 2 }), 2400); setTimeout(() => { setDeepModal({ open: true, step: 3 }); message.success('深度采集完成'); }, 3600); }}>深度采集</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
        </Space>
      ),
    },
  ];

  const deepSteps = ['获取全文内容', 'AI 智能摘要', '完成'];

  return (
    <div>
      {/* 筛选栏 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <Input prefix={<SearchOutlined />} placeholder="搜索标题/摘要..." style={{ width: 220 }} allowClear />
        <Select placeholder="来源筛选" style={{ width: 140 }} allowClear options={[{ value: '百度新闻', label: '百度新闻' }, { value: '搜狗微信', label: '搜狗微信' }, { value: 'RSS', label: 'RSS' }, { value: '自定义', label: '自定义' }]} />
        <RangePicker style={{ width: 260 }} />
        <Select placeholder="情感筛选" style={{ width: 120 }} allowClear options={[{ value: 'positive', label: '正面' }, { value: 'neutral', label: '中性' }, { value: 'negative', label: '负面' }]} />
      </div>

      {/* 批量操作栏 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <Button size="small" icon={<ThunderboltOutlined />} disabled={selectedRowKeys.length === 0}>批量深度采集</Button>
        <Button size="small" danger icon={<DeleteOutlined />} disabled={selectedRowKeys.length === 0}>批量删除</Button>
        <Button size="small" icon={<ExportOutlined />} disabled={selectedRowKeys.length === 0}>批量导出</Button>
        {selectedRowKeys.length > 0 && <Text style={{ color: '#94a3b8', fontSize: 12, lineHeight: '32px' }}>已选 {selectedRowKeys.length} 条</Text>}
      </div>

      <Table
        rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
        columns={columns} dataSource={warehouseData} pagination={{ pageSize: 10 }} size="middle"
      />

      {/* 查看全文 Modal */}
      <Modal title={detailModal.title} open={detailModal.open} onCancel={() => setDetailModal({ ...detailModal, open: false })} footer={null} width={700}>
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, color: '#cbd5e1', fontSize: 14, maxHeight: 400, overflowY: 'auto' }}>{detailModal.content}</div>
      </Modal>

      {/* 深度采集进度 Modal */}
      <Modal title="深度采集进度" open={deepModal.open} onCancel={() => setDeepModal({ ...deepModal, open: false })} footer={null}>
        <div style={{ padding: '16px 0' }}>
          {deepSteps.map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < deepSteps.length - 1 ? '1px solid #334155' : 'none' }}>
              {deepModal.step > i ? <CheckCircleOutlined style={{ color: '#10b981', fontSize: 18 }} /> : deepModal.step === i ? <SyncOutlined spin style={{ color: '#6366f1', fontSize: 18 }} /> : <ClockCircleOutlined style={{ color: '#64748b', fontSize: 18 }} />}
              <Text style={{ color: deepModal.step >= i ? '#f1f5f9' : '#64748b' }}>{step}</Text>
              {deepModal.step > i && <Tag color="#10b981">完成</Tag>}
              {deepModal.step === i && <Tag color="#3b82f6">进行中...</Tag>}
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

/* ==================== 主页面 ==================== */
const LookoutManagement = () => {
  const tabItems = [
    { key: 'sources', label: '信息源管理', children: <SourceTab /> },
    { key: 'tasks', label: '采集任务', children: <TaskTab /> },
    { key: 'warehouse', label: '数据仓库', children: <WarehouseTab /> },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0, color: '#f1f5f9' }}>
          <RadarChartOutlined style={{ marginRight: 8 }} />瞭望采集
        </Title>
        <Button icon={<ReloadOutlined />} style={{ color: '#94a3b8', borderColor: '#334155' }}>刷新数据</Button>
      </div>

      {/* 概览统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        {statCards.map(c => (
          <Col span={6} key={c.title}>
            <Card style={{ background: '#0f172a', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Text style={{ color: '#94a3b8', fontSize: 13 }}>{c.title}</Text>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#f1f5f9', lineHeight: 1.3 }}>{c.value}</div>
                </div>
                <div style={{ fontSize: 28, color: c.color, opacity: 0.6 }}>{c.icon}</div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 三标签页 */}
      <Card style={{ background: '#0f172a', border: '1px solid #334155' }}>
        <Tabs items={tabItems} defaultActiveKey="sources" />
      </Card>
    </div>
  );
};

export default LookoutManagement;
