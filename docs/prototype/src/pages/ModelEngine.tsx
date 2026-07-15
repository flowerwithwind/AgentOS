import { useState } from 'react';
import {
  Button, Table, Switch, Tag, Modal, Drawer, Input, Select,
  InputNumber, Slider, message, Tooltip,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, EditOutlined, SendOutlined,
  ThunderboltOutlined, StarOutlined, StarFilled, EyeOutlined,
  EyeInvisibleOutlined, UnorderedListOutlined,
  AppstoreOutlined, CloudServerOutlined, ExperimentOutlined,
} from '@ant-design/icons';

/* ---------- mock data ---------- */
const mockModels = [
  { key: '1', name: 'DeepSeek Chat', provider: 'DeepSeek', url: 'https://api.deepseek.com', enabled: true, isDefault: true, calls: 2134, tokens: '520K' },
  { key: '2', name: 'GPT-4o', provider: 'OpenAI', url: 'https://api.openai.com', enabled: true, isDefault: false, calls: 1245, tokens: '380K' },
  { key: '3', name: 'Qwen-Max', provider: '阿里云', url: 'https://dashscope.aliyuncs.com', enabled: true, isDefault: false, calls: 876, tokens: '210K' },
  { key: '4', name: 'GLM-4', provider: '智谱AI', url: 'https://open.bigmodel.cn', enabled: false, isDefault: false, calls: 0, tokens: '0' },
  { key: '5', name: 'Claude-3.5', provider: 'Anthropic', url: 'https://api.anthropic.com', enabled: true, isDefault: false, calls: 268, tokens: '90K' },
];

const providerIcons: Record<string, string> = {
  DeepSeek: '🔵', OpenAI: '🟢', '阿里云': '🟠', '智谱AI': '🟣', Anthropic: '🟤',
};

const tokenTrend = [
  { day: '7/9', value: 820 }, { day: '7/10', value: 1050 },
  { day: '7/11', value: 960 }, { day: '7/12', value: 1340 },
  { day: '7/13', value: 1180 }, { day: '7/14', value: 1420 },
  { day: '7/15', value: 1200 },
];
const maxTrend = Math.max(...tokenTrend.map(d => d.value));

const modelTokenShare = [
  { name: 'DeepSeek Chat', pct: 43, color: '#6366f1' },
  { name: 'GPT-4o', pct: 28, color: '#10b981' },
  { name: 'Qwen-Max', pct: 17, color: '#f59e0b' },
  { name: 'Claude-3.5', pct: 8, color: '#3b82f6' },
  { name: 'GLM-4', pct: 4, color: '#ef4444' },
];

/* ---------- styles ---------- */
const cardS: React.CSSProperties = {
  background: '#1e293b', borderRadius: 12, border: '1px solid #334155', padding: 20, flex: 1,
};
const statValue: React.CSSProperties = { fontSize: 28, fontWeight: 700, color: '#f1f5f9', marginTop: 8 };
const statLabel: React.CSSProperties = { fontSize: 13, color: '#64748b' };

const ModelEngine = () => {
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [models, setModels] = useState(mockModels);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [showApiKey, setShowApiKey] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState('');
  const [testing, setTesting] = useState(false);

  const toggleEnable = (key: string) => {
    setModels(prev => prev.map(m => m.key === key ? { ...m, enabled: !m.enabled } : m));
  };

  const setDefault = (key: string) => {
    setModels(prev => prev.map(m => ({ ...m, isDefault: m.key === key })));
    message.success('已设为默认模型');
  };

  const handleTest = () => {
    if (!testInput.trim()) return;
    setTesting(true);
    setTestOutput('');
    setTimeout(() => {
      setTestOutput('这是一个模拟的模型回复。DeepSeek Chat 已成功接收到您的消息并生成了此响应。\n\nToken 消耗：输入 42 tokens，输出 68 tokens，共 110 tokens。');
      setTesting(false);
    }, 1200);
  };

  const overviewCards = [
    { label: '已配置模型数', value: '5', icon: <CloudServerOutlined />, color: '#6366f1' },
    { label: '默认模型', value: 'DeepSeek', icon: <StarFilled />, color: '#10b981' },
    { label: '今日Token消耗', value: '1.2M', icon: <ThunderboltOutlined />, color: '#f59e0b' },
    { label: '今日调用次数', value: '4,523', icon: <ExperimentOutlined />, color: '#3b82f6' },
  ];

  const columns = [
    {
      title: '模型名称', dataIndex: 'name', key: 'name',
      render: (name: string, r: typeof mockModels[0]) => (
        <span style={{ fontWeight: 500, color: '#f1f5f9' }}>
          {providerIcons[r.provider] || '⚪'} {name}
          {r.isDefault && <Tag color="green" style={{ marginLeft: 8, fontSize: 11 }}>默认</Tag>}
        </span>
      ),
    },
    { title: '供应商', dataIndex: 'provider', key: 'provider', render: (v: string) => <span style={{ color: '#94a3b8' }}>{v}</span> },
    { title: 'API Base URL', dataIndex: 'url', key: 'url', ellipsis: true, render: (v: string) => <span style={{ color: '#64748b', fontSize: 13 }}>{v}</span> },
    {
      title: '状态', dataIndex: 'enabled', key: 'enabled', width: 80,
      render: (_: unknown, r: typeof mockModels[0]) => <Switch checked={r.enabled} size="small" onChange={() => toggleEnable(r.key)} />,
    },
    { title: '今日调用', dataIndex: 'calls', key: 'calls', width: 90, render: (v: number) => <span style={{ color: '#94a3b8' }}>{v.toLocaleString()}</span> },
    { title: 'Token消耗', dataIndex: 'tokens', key: 'tokens', width: 100, render: (v: string) => <span style={{ color: '#94a3b8' }}>{v}</span> },
    {
      title: '操作', key: 'action', width: 180,
      render: (_: unknown, r: typeof mockModels[0]) => (
        <span style={{ display: 'flex', gap: 4 }}>
          {!r.isDefault && r.enabled && (
            <Tooltip title="设为默认"><Button type="link" size="small" icon={<StarOutlined />} onClick={() => setDefault(r.key)} style={{ color: '#f59e0b' }} /></Tooltip>
          )}
          <Tooltip title="测试对话"><Button type="link" size="small" icon={<SendOutlined />} onClick={() => setDrawerOpen(true)} style={{ color: '#6366f1' }} /></Tooltip>
          <Tooltip title="编辑"><Button type="link" size="small" icon={<EditOutlined />} onClick={() => setAddModalOpen(true)} style={{ color: '#94a3b8' }} /></Tooltip>
          <Tooltip title="删除"><Button type="link" size="small" danger icon={<DeleteOutlined />} /></Tooltip>
        </span>
      ),
    },
  ];

  return (
    <div style={{ padding: 0 }}>
      {/* 概览卡片 */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        {overviewCards.map(c => (
          <div key={c.label} style={cardS}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20, color: c.color }}>{c.icon}</span>
              <span style={statLabel}>{c.label}</span>
            </div>
            <div style={statValue}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* 模型列表 */}
      <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#f1f5f9' }}>模型列表</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button.Group size="small">
              <Button type={viewMode === 'table' ? 'primary' : 'default'} icon={<UnorderedListOutlined />} onClick={() => setViewMode('table')}
                style={viewMode === 'table' ? { background: '#6366f1', border: 'none' } : { borderColor: '#334155', color: '#94a3b8' }} />
              <Button type={viewMode === 'card' ? 'primary' : 'default'} icon={<AppstoreOutlined />} onClick={() => setViewMode('card')}
                style={viewMode === 'card' ? { background: '#6366f1', border: 'none' } : { borderColor: '#334155', color: '#94a3b8' }} />
            </Button.Group>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)} style={{ background: '#6366f1', border: 'none', borderRadius: 8 }}>添加模型</Button>
          </div>
        </div>

        {viewMode === 'table' ? (
          <Table
            dataSource={models} columns={columns} pagination={false} size="small"
            rowSelection={{ selectedRowKeys: selectedKeys, onChange: keys => setSelectedKeys(keys as string[]) }}
            style={{ background: 'transparent' }}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {models.map(m => (
              <div key={m.key} style={{ background: '#0f172a', borderRadius: 10, border: '1px solid #334155', padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>{providerIcons[m.provider]} {m.name}</span>
                  <Switch checked={m.enabled} size="small" onChange={() => toggleEnable(m.key)} />
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{m.provider} · {m.url}</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 12, fontSize: 12, color: '#94a3b8' }}>
                  <span>调用 {m.calls.toLocaleString()}</span><span>Token {m.tokens}</span>
                  {m.isDefault && <Tag color="green" style={{ fontSize: 11 }}>默认</Tag>}
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
                  {!m.isDefault && m.enabled && <Button size="small" icon={<StarOutlined />} onClick={() => setDefault(m.key)}>默认</Button>}
                  <Button size="small" icon={<SendOutlined />} onClick={() => setDrawerOpen(true)}>测试</Button>
                  <Button size="small" icon={<EditOutlined />} onClick={() => setAddModalOpen(true)} />
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 批量操作栏 */}
        {selectedKeys.length > 0 && (
          <div style={{ marginTop: 12, padding: '10px 16px', background: '#0f172a', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>已选 {selectedKeys.length} 项</span>
            <Button size="small" onClick={() => message.success('批量启用成功')}>批量启用</Button>
            <Button size="small" onClick={() => message.success('批量禁用成功')}>批量禁用</Button>
            <Button size="small" danger onClick={() => message.success('批量删除成功')}>批量删除</Button>
          </div>
        )}
      </div>

      {/* Token 消耗趋势 */}
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ ...cardS, flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9', marginBottom: 16 }}>7日 Token 消耗趋势</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 140 }}>
            {tokenTrend.map(d => (
              <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>{d.value}K</span>
                <div style={{
                  width: '100%', maxWidth: 40, borderRadius: '6px 6px 0 0',
                  height: `${(d.value / maxTrend) * 100}px`, background: 'linear-gradient(180deg, #6366f1, #818cf8)',
                  transition: 'height 0.3s',
                }} />
                <span style={{ fontSize: 11, color: '#64748b' }}>{d.day}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ ...cardS, flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9', marginBottom: 16 }}>模型消耗占比</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {modelTokenShare.map(m => (
              <div key={m.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>
                  <span>{m.name}</span><span>{m.pct}%</span>
                </div>
                <div style={{ height: 8, background: '#0f172a', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${m.pct}%`, height: '100%', background: m.color, borderRadius: 4, transition: 'width 0.3s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 添加/编辑模型 Modal */}
      <Modal
        title={<span style={{ color: '#f1f5f9' }}>添加模型</span>}
        open={addModalOpen} onCancel={() => setAddModalOpen(false)}
        onOk={() => { setAddModalOpen(false); message.success('模型已保存'); }}
        okText="保存" cancelText="取消"
        styles={{ body: { padding: '20px 24px' } }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div><div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>模型名称</div><Input placeholder="如 DeepSeek Chat" /></div>
          <div><div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>供应商</div>
            <Select placeholder="选择供应商" style={{ width: '100%' }} options={[
              { value: 'OpenAI', label: 'OpenAI' }, { value: 'DeepSeek', label: 'DeepSeek' },
              { value: '阿里云', label: '阿里云' }, { value: '智谱AI', label: '智谱AI' }, { value: 'Anthropic', label: 'Anthropic' },
            ]} />
          </div>
          <div><div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>API Base URL</div><Input placeholder="https://api.example.com" /></div>
          <div><div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>API Key</div>
            <Input type={showApiKey ? 'text' : 'password'} placeholder="sk-..." suffix={
              <span onClick={() => setShowApiKey(!showApiKey)} style={{ cursor: 'pointer', color: '#64748b' }}>
                {showApiKey ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              </span>
            } />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}><div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>最大Token数</div><InputNumber style={{ width: '100%' }} defaultValue={4096} min={256} /></div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>超时(ms)</div><InputNumber style={{ width: '100%' }} defaultValue={60000} min={1000} step={1000} /></div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>并发数</div><InputNumber style={{ width: '100%' }} defaultValue={5} min={1} max={50} /></div>
          </div>
        </div>
      </Modal>

      {/* 模型对话测试 Drawer */}
      <Drawer
        title={<span style={{ color: '#f1f5f9' }}>模型对话测试</span>}
        open={drawerOpen} onClose={() => { setDrawerOpen(false); setTestOutput(''); setTestInput(''); }}
        width={480}
        styles={{ body: { padding: 20 } }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div><div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>选择模型</div>
            <Select defaultValue="1" style={{ width: '100%' }} options={models.filter(m => m.enabled).map(m => ({ value: m.key, label: m.name }))} />
          </div>
          <div><div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>系统提示词</div>
            <Input.TextArea rows={2} placeholder="你是一个有用的AI助手..." defaultValue="你是一个有用的AI助手。" />
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>温度 (Temperature): {temperature}</div>
            <Slider min={0} max={2} step={0.1} value={temperature} onChange={setTemperature} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>对话区域</div>
            <div style={{ background: '#0f172a', borderRadius: 8, border: '1px solid #334155', padding: 16, minHeight: 200, marginBottom: 12 }}>
              {testInput && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ background: '#6366f1', color: '#fff', padding: '8px 12px', borderRadius: '12px 12px 12px 4px', display: 'inline-block', maxWidth: '80%', fontSize: 13 }}>{testInput}</div>
                </div>
              )}
              {testOutput && (
                <div>
                  <div style={{ background: '#334155', color: '#f1f5f9', padding: '8px 12px', borderRadius: '12px 12px 4px 12px', display: 'inline-block', maxWidth: '85%', fontSize: 13, whiteSpace: 'pre-wrap' }}>{testOutput}</div>
                  <div style={{ marginTop: 8, fontSize: 11, color: '#64748b' }}>Token 消耗：输入 42 · 输出 68 · 共 110 tokens</div>
                </div>
              )}
              {!testInput && !testOutput && <div style={{ color: '#64748b', textAlign: 'center', paddingTop: 60 }}>发送一条消息开始测试...</div>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Input placeholder="输入测试消息..." value={testInput} onChange={e => setTestInput(e.target.value)} onPressEnter={handleTest} />
              <Button type="primary" icon={<SendOutlined />} loading={testing} onClick={handleTest} style={{ background: '#6366f1', border: 'none' }}>发送</Button>
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default ModelEngine;
