import { useState } from 'react';
import {
  Button, Table, Switch, Tag, Modal, Input, Select, message, Tooltip,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, CopyOutlined, KeyOutlined,
  FileTextOutlined, CheckCircleFilled, ApiOutlined,
  ThunderboltOutlined, CalendarOutlined,
} from '@ant-design/icons';

/* ---------- mock data ---------- */
interface TokenRow {
  key: string; name: string; tokenPrefix: string; creator: string;
  enabled: boolean; createdAt: string; lastUsed: string; calls: number;
}

const mockTokens: TokenRow[] = [
  { key: '1', name: '生产环境Token', tokenPrefix: 'xhsk_a8f2', creator: 'admin', enabled: true, createdAt: '2026-03-12', lastUsed: '2026-07-15', calls: 12345 },
  { key: '2', name: '测试环境Token', tokenPrefix: 'xhsk_3b71', creator: 'admin', enabled: true, createdAt: '2026-04-20', lastUsed: '2026-07-14', calls: 3456 },
  { key: '3', name: '第三方集成', tokenPrefix: 'xhsk_c4e9', creator: 'zhangsan', enabled: true, createdAt: '2026-05-08', lastUsed: '2026-07-15', calls: 1234 },
  { key: '4', name: '旧版Token', tokenPrefix: 'xhsk_d1a6', creator: 'admin', enabled: false, createdAt: '2025-11-01', lastUsed: '2026-06-30', calls: 567 },
];

const apiEndpoints = [
  { method: 'POST', path: '/api/v1/chat/completions', desc: '发送对话请求', scope: '对话API' },
  { method: 'GET', path: '/api/v1/chat/sessions', desc: '获取会话列表', scope: '对话API' },
  { method: 'POST', path: '/api/v1/lookout/collect', desc: '启动采集任务', scope: '采集API' },
  { method: 'GET', path: '/api/v1/lookout/tasks', desc: '查询采集任务列表', scope: '采集API' },
  { method: 'GET', path: '/api/v1/data/query', desc: '查询知识库数据', scope: '数据API' },
  { method: 'POST', path: '/api/v1/data/import', desc: '导入数据到知识库', scope: '数据API' },
  { method: 'GET', path: '/api/v1/admin/users', desc: '获取用户列表', scope: '管理API' },
  { method: 'PUT', path: '/api/v1/admin/settings', desc: '更新系统设置', scope: '管理API' },
];

const methodColors: Record<string, string> = {
  GET: '#10b981', POST: '#3b82f6', PUT: '#f59e0b', DELETE: '#ef4444',
};

/* ---------- styles ---------- */
const statCard: React.CSSProperties = {
  background: '#1e293b', borderRadius: 12, border: '1px solid #334155', padding: 20, flex: 1,
};
const statValue: React.CSSProperties = { fontSize: 28, fontWeight: 700, color: '#f1f5f9', marginTop: 8 };
const statLabel: React.CSSProperties = { fontSize: 13, color: '#64748b' };

const ApiTokenManagement = () => {
  const [tokens, setTokens] = useState<TokenRow[]>(mockTokens);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [showNewToken, setShowNewToken] = useState(false);
  const [apiDocsOpen, setApiDocsOpen] = useState(false);
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);

  const toggleEnable = (key: string) => {
    setTokens(prev => prev.map(t => t.key === key ? { ...t, enabled: !t.enabled } : t));
    message.success('状态已更新');
  };

  const deleteToken = (key: string) => {
    setTokens(prev => prev.filter(t => t.key !== key));
    message.success('Token 已删除');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => message.success('已复制到剪贴板'));
  };

  const handleCreate = () => {
    setShowNewToken(true);
  };

  const handleConfirmSaved = () => {
    setShowNewToken(false);
    setCreateModalOpen(false);
    const newToken: TokenRow = {
      key: String(Date.now()), name: '新建Token', tokenPrefix: 'xhsk_e7c3',
      creator: 'admin', enabled: true, createdAt: '2026-07-15', lastUsed: '-', calls: 0,
    };
    setTokens(prev => [...prev, newToken]);
    message.success('Token 已创建');
  };

  const columns = [
    {
      title: 'Token名称', dataIndex: 'name', key: 'name',
      render: (v: string) => <span style={{ fontWeight: 500, color: '#f1f5f9' }}>{v}</span>,
    },
    {
      title: 'Token值', dataIndex: 'tokenPrefix', key: 'tokenPrefix',
      render: (v: string) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <code style={{ background: '#0f172a', padding: '2px 8px', borderRadius: 4, color: '#94a3b8', fontSize: 12, fontFamily: 'monospace' }}>
            {v}********
          </code>
          <Tooltip title="复制">
            <Button type="text" size="small" icon={<CopyOutlined />}
              onClick={() => copyToClipboard(v + 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')}
              style={{ color: '#64748b' }} />
          </Tooltip>
        </span>
      ),
    },
    {
      title: '创建者', dataIndex: 'creator', key: 'creator',
      render: (v: string) => <span style={{ color: '#94a3b8' }}>{v}</span>,
    },
    {
      title: '状态', dataIndex: 'enabled', key: 'enabled', width: 80,
      render: (_: unknown, r: TokenRow) => <Switch checked={r.enabled} size="small" onChange={() => toggleEnable(r.key)} />,
    },
    {
      title: '创建时间', dataIndex: 'createdAt', key: 'createdAt',
      render: (v: string) => <span style={{ color: '#64748b', fontSize: 13 }}>{v}</span>,
    },
    {
      title: '最后使用', dataIndex: 'lastUsed', key: 'lastUsed',
      render: (v: string) => <span style={{ color: '#64748b', fontSize: 13 }}>{v}</span>,
    },
    {
      title: '调用次数', dataIndex: 'calls', key: 'calls',
      render: (v: number) => <span style={{ color: '#94a3b8' }}>{v.toLocaleString()}</span>,
    },
    {
      title: '操作', key: 'action', width: 100,
      render: (_: unknown, r: TokenRow) => (
        <span style={{ display: 'flex', gap: 4 }}>
          <Tooltip title={r.enabled ? '禁用' : '启用'}>
            <Button type="link" size="small" onClick={() => toggleEnable(r.key)}
              style={{ color: r.enabled ? '#f59e0b' : '#10b981' }}>
              {r.enabled ? '禁用' : '启用'}
            </Button>
          </Tooltip>
          <Tooltip title="删除">
            <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => deleteToken(r.key)} />
          </Tooltip>
        </span>
      ),
    },
  ];

  const overviewCards = [
    { label: '活跃Token数', value: '4', icon: <KeyOutlined />, color: '#6366f1' },
    { label: '今日API调用', value: '1,247', icon: <ThunderboltOutlined />, color: '#10b981' },
    { label: '本月API调用', value: '38,456', icon: <CalendarOutlined />, color: '#3b82f6' },
  ];

  return (
    <div>
      {/* 顶部操作栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div />
        <div style={{ display: 'flex', gap: 8 }}>
          <Button icon={<FileTextOutlined />} onClick={() => setApiDocsOpen(true)}
            style={{ borderColor: '#334155', color: '#94a3b8', borderRadius: 8 }}>查看 API 文档</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setCreateModalOpen(true); setShowNewToken(false); }}
            style={{ background: '#6366f1', border: 'none', borderRadius: 8 }}>创建Token</Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        {overviewCards.map(c => (
          <div key={c.label} style={statCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20, color: c.color }}>{c.icon}</span>
              <span style={statLabel}>{c.label}</span>
            </div>
            <div style={statValue}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Token 列表 */}
      <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', padding: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#f1f5f9', marginBottom: 16 }}>Token 列表</div>
        <Table dataSource={tokens} columns={columns} pagination={false} size="small" />
      </div>

      {/* 创建 Token Modal */}
      <Modal
        title={<span style={{ color: '#f1f5f9' }}>创建 API Token</span>}
        open={createModalOpen}
        onCancel={() => { setCreateModalOpen(false); setShowNewToken(false); }}
        footer={showNewToken ? (
          <Button type="primary" icon={<CheckCircleFilled />} onClick={handleConfirmSaved}
            style={{ background: '#6366f1', border: 'none', borderRadius: 8 }}>我已安全保存，关闭</Button>
        ) : (
          <>
            <Button onClick={() => setCreateModalOpen(false)} style={{ borderColor: '#334155', color: '#94a3b8' }}>取消</Button>
            <Button type="primary" onClick={handleCreate} style={{ background: '#6366f1', border: 'none' }}>创建</Button>
          </>
        )}
      >
        {!showNewToken ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>Token 名称</div>
              <Input placeholder="如 生产环境Token" />
            </div>
            <div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>权限范围（可多选）</div>
              <Select
                mode="multiple" placeholder="选择权限范围" style={{ width: '100%' }}
                value={selectedScopes} onChange={setSelectedScopes}
                options={[
                  { value: 'chat', label: '对话API' }, { value: 'collect', label: '采集API' },
                  { value: 'data', label: '数据API' }, { value: 'admin', label: '管理API' },
                ]}
              />
            </div>
            <div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>过期时间</div>
              <Select placeholder="选择过期时间" style={{ width: '100%' }} options={[
                { value: '30', label: '30 天' }, { value: '90', label: '90 天' }, { value: 'never', label: '永不过期' },
              ]} />
            </div>
          </div>
        ) : (
          <div>
            <div style={{ background: '#0f172a', borderRadius: 8, border: '1px solid #334155', padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <CheckCircleFilled style={{ color: '#10b981', fontSize: 18 }} />
                <span style={{ color: '#10b981', fontWeight: 600 }}>Token 创建成功！</span>
              </div>
              <div style={{ fontSize: 13, color: '#f59e0b', marginBottom: 12 }}>
                ⚠️ 请立即复制并安全保存此 Token，关闭后将无法再次查看！
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <code style={{
                  flex: 1, background: '#1e293b', padding: '8px 12px', borderRadius: 6,
                  color: '#f1f5f9', fontFamily: 'monospace', fontSize: 13, wordBreak: 'break-all',
                  border: '1px solid #334155',
                }}>
                  xhsk_e7c3f9a2b4d6e8f1a3c5b7d9e2f4a6c8b1d3e5f7a9c2b4d6
                </code>
                <Tooltip title="复制完整 Token">
                  <Button icon={<CopyOutlined />} onClick={() => copyToClipboard('xhsk_e7c3f9a2b4d6e8f1a3c5b7d9e2f4a6c8b1d3e5f7a9c2b4d6')}
                    style={{ borderColor: '#334155', color: '#94a3b8', flexShrink: 0 }}>复制</Button>
                </Tooltip>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* API 文档 Modal */}
      <Modal
        title={<span style={{ color: '#f1f5f9' }}><ApiOutlined style={{ marginRight: 8 }} />API 文档</span>}
        open={apiDocsOpen} onCancel={() => setApiDocsOpen(false)} footer={null} width={680}
      >
        <div style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>以下是系统提供的开放 API 接口列表，所有请求需在 Header 中携带 <code style={{ color: '#f59e0b' }}>Authorization: Bearer &lt;token&gt;</code></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {apiEndpoints.map((ep, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: '#0f172a', borderRadius: 8, border: '1px solid #334155', padding: '10px 14px',
            }}>
              <Tag style={{
                background: methodColors[ep.method] || '#334155', border: 'none',
                color: '#fff', borderRadius: 4, minWidth: 52, textAlign: 'center', fontWeight: 600, fontSize: 11,
              }}>{ep.method}</Tag>
              <code style={{ flex: 1, color: '#f1f5f9', fontFamily: 'monospace', fontSize: 13 }}>{ep.path}</code>
              <span style={{ fontSize: 12, color: '#64748b', flexShrink: 0 }}>{ep.desc}</span>
              <Tag style={{ background: '#334155', border: 'none', color: '#94a3b8', borderRadius: 4, fontSize: 11, flexShrink: 0 }}>{ep.scope}</Tag>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default ApiTokenManagement;
