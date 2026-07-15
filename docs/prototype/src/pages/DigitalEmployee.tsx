import { useState } from 'react';
import {
  Avatar, Button, Modal, Input, Select, Slider, Switch, Tag, Drawer,
  message, Tooltip,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, MessageOutlined,
  RobotOutlined, UserOutlined, SearchOutlined, AppstoreOutlined,
  UnorderedListOutlined, TeamOutlined, ThunderboltOutlined,
} from '@ant-design/icons';

const { TextArea } = Input;

/* ===== Mock Data ===== */
interface Employee {
  id: string; name: string; avatar: string; status: boolean;
  skills: { label: string; color: string }[];
  todayChats: number; createdAt: string; desc: string;
}

const mockEmployees: Employee[] = [
  { id: '1', name: '小智', avatar: '智', status: true, skills: [{ label: '天气查询', color: '#10b981' }, { label: '网页搜索', color: '#3b82f6' }], todayChats: 87, createdAt: '2026-03-15', desc: '智能客服' },
  { id: '2', name: '数据分析师', avatar: '数', status: true, skills: [{ label: '数据库查询', color: '#f59e0b' }, { label: '数据分析', color: '#6366f1' }], todayChats: 64, createdAt: '2026-04-02', desc: '数据分析' },
  { id: '3', name: '文档助手', avatar: '文', status: true, skills: [{ label: '文档解析', color: '#3b82f6' }, { label: '知识库检索', color: '#10b981' }], todayChats: 53, createdAt: '2026-04-10', desc: '文档处理' },
  { id: '4', name: '代码专家', avatar: '代', status: true, skills: [{ label: '代码执行', color: '#ef4444' }, { label: '网页搜索', color: '#3b82f6' }], todayChats: 42, createdAt: '2026-05-01', desc: '编程辅助' },
  { id: '5', name: '舆情分析师', avatar: '舆', status: false, skills: [{ label: '网页搜索', color: '#3b82f6' }, { label: '数据分析', color: '#6366f1' }], todayChats: 38, createdAt: '2026-05-18', desc: '舆情监控' },
  { id: '6', name: '全能助手', avatar: '全', status: true, skills: [{ label: '天气查询', color: '#10b981' }, { label: '网页搜索', color: '#3b82f6' }, { label: '代码执行', color: '#ef4444' }], todayChats: 72, createdAt: '2026-06-01', desc: '通用' },
];

const allSkills = [
  { label: '天气查询', value: 'weather', color: '#10b981' },
  { label: '网页搜索', value: 'search', color: '#3b82f6' },
  { label: '数据库查询', value: 'database', color: '#f59e0b' },
  { label: '数据分析', value: 'analysis', color: '#6366f1' },
  { label: '文档解析', value: 'doc_parse', color: '#3b82f6' },
  { label: '知识库检索', value: 'knowledge', color: '#10b981' },
  { label: '代码执行', value: 'code', color: '#ef4444' },
];

const models = [
  { label: 'DeepSeek Chat', value: 'deepseek-chat' },
  { label: 'GPT-4o', value: 'gpt-4o' },
  { label: 'Qwen-Max', value: 'qwen-max' },
];

const statCards = [
  { label: '数字员工总数', value: 12, icon: <TeamOutlined />, color: '#6366f1' },
  { label: '启用中', value: 8, icon: <ThunderboltOutlined />, color: '#10b981' },
  { label: '今日对话数', value: 356, icon: <MessageOutlined />, color: '#3b82f6' },
];

const chatColors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

const mockTestMessages = [
  { role: 'user' as const, content: '你好，请介绍一下你自己', time: '14:30' },
  { role: 'assistant' as const, content: '你好！我是小智，一个智能客服助手。我可以帮您查询天气、搜索网页信息等。请问有什么可以帮您的？', time: '14:30' },
  { role: 'user' as const, content: '帮我查一下今天北京的天气', time: '14:31' },
  { role: 'assistant' as const, content: '今天北京天气晴，气温 22°C ~ 31°C，空气质量良好，适合外出。建议您注意防晒。', time: '14:31' },
];

/* ===== Component ===== */
const DigitalEmployee = () => {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [testInput, setTestInput] = useState('');
  const [testMessages, setTestMessages] = useState(mockTestMessages);

  // Form state
  const [formName, setFormName] = useState('');
  const [formAvatar, setFormAvatar] = useState('');
  const [formPrompt, setFormPrompt] = useState('');
  const [formSkills, setFormSkills] = useState<string[]>([]);
  const [formWelcome, setFormWelcome] = useState('');
  const [formModel, setFormModel] = useState('deepseek-chat');
  const [formTemp, setFormTemp] = useState(0.7);

  const filtered = employees.filter(e =>
    !searchText || e.name.includes(searchText) || e.desc.includes(searchText)
  );

  const openCreate = () => {
    setEditingId(null);
    setFormName(''); setFormAvatar(''); setFormPrompt(''); setFormSkills([]);
    setFormWelcome(''); setFormModel('deepseek-chat'); setFormTemp(0.7);
    setModalOpen(true);
  };

  const openEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setFormName(emp.name); setFormAvatar(emp.avatar);
    setFormPrompt('你是一个专业的AI助手，请为用户提供优质的服务。');
    setFormSkills(emp.skills.map(s => {
      const found = allSkills.find(sk => sk.label === s.label);
      return found ? found.value : '';
    }));
    setFormWelcome('你好！我是' + emp.name + '，请问有什么可以帮您的？');
    setFormModel('deepseek-chat'); setFormTemp(0.7);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!formName.trim()) { message.warning('请输入名称'); return; }
    if (editingId) {
      setEmployees(prev => prev.map(e => e.id === editingId ? {
        ...e, name: formName, avatar: formAvatar || formName[0],
        skills: formSkills.map(v => { const s = allSkills.find(sk => sk.value === v); return { label: s?.label || '', color: s?.color || '#6366f1' }; }),
      } : e));
      message.success('编辑成功');
    } else {
      const newEmp: Employee = {
        id: String(Date.now()), name: formName, avatar: formAvatar || formName[0],
        status: true,
        skills: formSkills.map(v => { const s = allSkills.find(sk => sk.value === v); return { label: s?.label || '', color: s?.color || '#6366f1' }; }),
        todayChats: 0, createdAt: '2026-07-15', desc: '新建',
      };
      setEmployees(prev => [...prev, newEmp]);
      message.success('创建成功');
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除', content: '删除后无法恢复，确定要删除该数字员工吗？',
      okText: '删除', okType: 'danger', cancelText: '取消',
      onOk: () => { setEmployees(prev => prev.filter(e => e.id !== id)); message.success('已删除'); },
    });
  };

  const toggleStatus = (id: string, checked: boolean) => {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, status: checked } : e));
    message.success(checked ? '已启用' : '已禁用');
  };

  const openTestDrawer = (emp: Employee) => {
    setTestMessages(mockTestMessages.map(m =>
      m.role === 'assistant' ? { ...m, content: m.content.replace('小智', emp.name) } : m
    ));
    setDrawerOpen(true);
  };

  const handleTestSend = () => {
    if (!testInput.trim()) return;
    const userMsg = { role: 'user' as const, content: testInput, time: '14:32' };
    const aiMsg = { role: 'assistant' as const, content: '收到您的消息，我正在为您处理，请稍候...', time: '14:32' };
    setTestMessages(prev => [...prev, userMsg, aiMsg]);
    setTestInput('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
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
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Input
            prefix={<SearchOutlined style={{ color: '#64748b' }} />}
            placeholder="搜索数字员工..." value={searchText} onChange={e => setSearchText(e.target.value)}
            style={{ width: 240, borderRadius: 8, background: '#0f172a', border: '1px solid #334155' }}
            allowClear
          />
          <Tooltip title="网格视图">
            <Button
              icon={<AppstoreOutlined />}
              style={{ borderRadius: 8, borderColor: viewMode === 'grid' ? '#6366f1' : '#334155', color: viewMode === 'grid' ? '#6366f1' : '#94a3b8', background: viewMode === 'grid' ? '#6366f122' : 'transparent' }}
              onClick={() => setViewMode('grid')}
            />
          </Tooltip>
          <Tooltip title="列表视图">
            <Button
              icon={<UnorderedListOutlined />}
              style={{ borderRadius: 8, borderColor: viewMode === 'table' ? '#6366f1' : '#334155', color: viewMode === 'table' ? '#6366f1' : '#94a3b8', background: viewMode === 'table' ? '#6366f122' : 'transparent' }}
              onClick={() => setViewMode('table')}
            />
          </Tooltip>
        </div>
        <Button type="primary" icon={<PlusOutlined />} style={{ borderRadius: 8, background: '#6366f1', border: 'none' }} onClick={openCreate}>
          创建数字员工
        </Button>
      </div>

      {/* 网格视图 */}
      {viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {filtered.map(emp => (
            <div key={emp.id} style={{
              background: '#0f172a', borderRadius: 12, padding: 20, border: '1px solid #334155',
              transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(99,102,241,0.15)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <Avatar style={{ background: chatColors[parseInt(emp.id) % chatColors.length], fontSize: 18 }} size={44}>
                  {emp.avatar}
                </Avatar>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>{emp.name}</span>
                    <Tag style={{ background: '#334155', border: 'none', color: '#94a3b8', borderRadius: 4, fontSize: 11 }}>{emp.desc}</Tag>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>创建于 {emp.createdAt}</div>
                </div>
                <Switch
                  checked={emp.status} onChange={v => toggleStatus(emp.id, v)}
                  style={{ background: emp.status ? '#10b981' : '#334155' }}
                />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {emp.skills.map((s, i) => (
                  <Tag key={i} style={{ background: `${s.color}22`, color: s.color, border: 'none', borderRadius: 4, fontSize: 12 }}>{s.label}</Tag>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#94a3b8' }}>
                  <span><MessageOutlined style={{ marginRight: 4 }} />今日 {emp.todayChats} 对话</span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <Tooltip title="测试对话">
                    <Button size="small" icon={<MessageOutlined />} style={{ borderRadius: 6, borderColor: '#334155', color: '#94a3b8' }} onClick={() => openTestDrawer(emp)} />
                  </Tooltip>
                  <Tooltip title="编辑">
                    <Button size="small" icon={<EditOutlined />} style={{ borderRadius: 6, borderColor: '#334155', color: '#94a3b8' }} onClick={() => openEdit(emp)} />
                  </Tooltip>
                  <Tooltip title="删除">
                    <Button size="small" icon={<DeleteOutlined />} style={{ borderRadius: 6, borderColor: '#334155', color: '#ef4444' }} onClick={() => handleDelete(emp.id)} />
                  </Tooltip>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* 列表视图 */
        <div style={{ background: '#0f172a', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', color: '#f1f5f9', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                {['员工', '状态', '技能', '今日对话', '创建时间', '操作'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#94a3b8', fontWeight: 500, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(emp => (
                <tr key={emp.id} style={{ borderBottom: '1px solid #334155' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar style={{ background: chatColors[parseInt(emp.id) % chatColors.length] }} size={32}>{emp.avatar}</Avatar>
                      <div>
                        <div style={{ fontWeight: 500 }}>{emp.name}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{emp.desc}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <Switch checked={emp.status} size="small" onChange={v => toggleStatus(emp.id, v)} style={{ background: emp.status ? '#10b981' : '#334155' }} />
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {emp.skills.map((s, i) => <Tag key={i} style={{ background: `${s.color}22`, color: s.color, border: 'none', borderRadius: 4, fontSize: 11 }}>{s.label}</Tag>)}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{emp.todayChats}</td>
                  <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{emp.createdAt}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Button size="small" icon={<MessageOutlined />} style={{ borderRadius: 6, borderColor: '#334155', color: '#94a3b8' }} onClick={() => openTestDrawer(emp)} />
                      <Button size="small" icon={<EditOutlined />} style={{ borderRadius: 6, borderColor: '#334155', color: '#94a3b8' }} onClick={() => openEdit(emp)} />
                      <Button size="small" icon={<DeleteOutlined />} style={{ borderRadius: 6, borderColor: '#334155', color: '#ef4444' }} onClick={() => handleDelete(emp.id)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 创建/编辑 Modal */}
      <Modal
        title={editingId ? '编辑数字员工' : '创建数字员工'}
        open={modalOpen} onCancel={() => setModalOpen(false)}
        onOk={handleSave} okText="保存" cancelText="取消"
        width={560}
        styles={{ body: { background: '#1e293b' }, header: { background: '#1e293b', borderBottom: '1px solid #334155' }, footer: { borderTop: '1px solid #334155', background: '#1e293b' } }}
        style={{ color: '#f1f5f9' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
          <div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>名称 *</div>
            <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="请输入名称" style={{ borderRadius: 8, background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9' }} />
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>头像预览</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar style={{ background: '#6366f1', fontSize: 20 }} size={48}>{formAvatar || formName?.[0] || <RobotOutlined />}</Avatar>
              <Input value={formAvatar} onChange={e => setFormAvatar(e.target.value)} placeholder="头像文字（可选，默认取名称首字）" style={{ borderRadius: 8, background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9' }} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>系统提示词</div>
            <TextArea
              value={formPrompt} onChange={e => setFormPrompt(e.target.value)}
              placeholder="请输入系统提示词..." rows={3}
              showCount maxLength={500}
              style={{ borderRadius: 8, background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9' }}
            />
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>关联技能</div>
            <Select
              mode="multiple" value={formSkills} onChange={setFormSkills}
              placeholder="选择技能" style={{ width: '100%' }}
              options={allSkills.map(s => ({ label: s.label, value: s.value }))}
              tagRender={props => {
                const sk = allSkills.find(s => s.value === props.value);
                return <Tag style={{ background: `${sk?.color || '#6366f1'}22`, color: sk?.color || '#6366f1', border: 'none', borderRadius: 4, margin: '2px 4px 2px 0' }}>{props.label}<span style={{ marginLeft: 4, cursor: 'pointer' }} onClick={props.onClose}>×</span></Tag>;
              }}
            />
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>欢迎语</div>
            <Input value={formWelcome} onChange={e => setFormWelcome(e.target.value)} placeholder="用户进入对话时的欢迎语" style={{ borderRadius: 8, background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>模型选择</div>
              <Select value={formModel} onChange={setFormModel} options={models} style={{ width: '100%' }} />
            </div>
            <div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>温度参数: {formTemp.toFixed(1)}</div>
              <Slider min={0} max={2} step={0.1} value={formTemp} onChange={setFormTemp} />
            </div>
          </div>
        </div>
      </Modal>

      {/* 测试对话 Drawer */}
      <Drawer
        title="测试对话" open={drawerOpen} onClose={() => setDrawerOpen(false)}
        width={420}
        styles={{ body: { background: '#0f172a', padding: 0 }, header: { background: '#1e293b', borderBottom: '1px solid #334155' } }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px' }}>
            {testMessages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', marginBottom: 14, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {msg.role === 'assistant' && (
                  <Avatar style={{ background: '#6366f1', marginRight: 8, flexShrink: 0 }} icon={<RobotOutlined />} size={32} />
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
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, textAlign: msg.role === 'user' ? 'right' : 'left' }}>{msg.time}</div>
                </div>
                {msg.role === 'user' && (
                  <Avatar style={{ background: '#3b82f6', marginLeft: 8, flexShrink: 0 }} size={32}><UserOutlined /></Avatar>
                )}
              </div>
            ))}
          </div>
          <div style={{ padding: '12px 16px', borderTop: '1px solid #334155', display: 'flex', gap: 8 }}>
            <Input
              value={testInput} onChange={e => setTestInput(e.target.value)}
              placeholder="输入测试消息..."
              onPressEnter={handleTestSend}
              style={{ borderRadius: 8, background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9' }}
            />
            <Button type="primary" onClick={handleTestSend} style={{ borderRadius: 8, background: '#6366f1', border: 'none' }}>发送</Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default DigitalEmployee;
