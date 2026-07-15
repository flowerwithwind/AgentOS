import { useState, useRef, useEffect, useCallback } from 'react';
import { Input, Button, Avatar, Dropdown, Tooltip, message, Popover, Tag } from 'antd';
import {
  PlusOutlined, SearchOutlined, DeleteOutlined, SendOutlined,
  PaperClipOutlined, CommentOutlined, CopyOutlined, LikeOutlined,
  DislikeOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
  ExportOutlined, RobotOutlined, BookOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { TextArea } = Input;

/* ===== Mock Data ===== */
interface Conv { id: string; title: string; lastMsg: string; time: string; avatar: string; }
interface Msg { id: number; role: 'user' | 'assistant'; content: string; }

const mockConversations: Conv[] = [
  { id: '1', title: '数据分析任务讨论', lastMsg: '根据最近一周的数据趋势来看...', time: '14:32', avatar: '📊' },
  { id: '2', title: '舆情报告生成', lastMsg: '已为您生成今日舆情简报...', time: '13:18', avatar: '📰' },
  { id: '3', title: '采集源配置咨询', lastMsg: '建议您添加36氪作为新采集源...', time: '昨天', avatar: '🔍' },
  { id: '4', title: '模型性能优化', lastMsg: '关于 deepseek-chat 的参数调优...', time: '昨天', avatar: '⚙️' },
  { id: '5', title: '知识库管理', lastMsg: '当前知识库共有文档 1,247 篇...', time: '3天前', avatar: '📚' },
];

const mockMessages: Msg[] = [
  { id: 1, role: 'user', content: '请帮我分析一下最近7天的对话数据趋势，并给出你的建议。' },
  { id: 2, role: 'assistant', content: `## 📊 近7天对话数据分析

根据系统数据统计，最近7天的对话量呈现**波动上升**趋势：

### 关键数据
- **总对话数**: 2,008 次
- **日均对话**: 286 次
- **峰值**: 周四（421次）
- **谷值**: 周六（156次）

### 趋势特点
1. 工作日对话量明显高于周末
2. 周三到周五是高峰期
3. 用户活跃度逐周提升 **12.5%**

### 建议
> 建议在周四前增加服务器资源预留，周末可适当降低资源配置以节约成本。

\`\`\`
每日平均响应时间: 1.2s
用户满意度评分: 4.6/5.0
\`\`\`` },
  { id: 3, role: 'user', content: '好的，那帮我生成一份本周的舆情简报，重点关注科技领域。' },
  { id: 4, role: 'assistant', content: `## 📰 本周科技领域舆情简报

### 热点话题 Top 3
1. **AI 大模型竞争白热化** — 讨论热度 🔥🔥🔥
   - GPT-5 即将发布的消息引发广泛关注
   - 国内厂商加速追赶，多家企业发布新模型

2. **数据隐私与合规** — 讨论热度 🔥🔥
   - 新的数据安全法规征求意见稿发布
   - 企业数据治理成为焦点话题

3. **芯片供应链动态** — 讨论热度 🔥
   - 国产芯片取得阶段性突破
   - 供应链多元化策略受到重视

### 情感分析
| 话题 | 正面 | 中性 | 负面 |
|------|------|------|------|
| AI大模型 | 62% | 25% | 13% |
| 数据隐私 | 28% | 42% | 30% |
| 芯片供应 | 55% | 33% | 12% |

*数据采集时间：本周 00:00 至当前时刻*` },
  { id: 5, role: 'user', content: '这份简报很好，帮我导出成 PDF 格式。' },
  { id: 6, role: 'assistant', content: '好的，PDF 已生成完毕。您可以通过页面顶部的 **导出 PDF** 按钮下载。\n\n文件包含完整的舆情简报内容，已按章节排版，包含数据图表和情感分析可视化。' },
];

const aiReplyTemplate = `收到您的消息！让我为您分析一下：

根据您的描述，这是一个很好的问题。从系统数据来看：

- **相关性分析**: 高度匹配
- **置信度**: 92.3%
- **建议操作**: 继续深入探索该方向

如果您需要更详细的数据，可以使用 \`@数据瞭望助手\` 来获取实时数据报表。`;

const digitalEmployees = [
  { id: '1', name: '数据瞭望助手', avatar: '🔍', status: 'enabled' },
  { id: '2', name: '智能问数专家', avatar: '📊', status: 'enabled' },
  { id: '3', name: '舆情分析师', avatar: '📰', status: 'enabled' },
  { id: '4', name: '报告生成器', avatar: '📄', status: 'enabled' },
  { id: '5', name: '知识管理员', avatar: '📚', status: 'enabled' },
];

const knowledgeBases = [
  { id: '1', name: '产品文档库', count: 342 },
  { id: '2', name: '行业报告库', count: 128 },
  { id: '3', name: 'FAQ知识库', count: 567 },
];

/* ===== Styles ===== */
const sidebarStyle: React.CSSProperties = {
  width: 280, background: '#0f172a', borderRight: '1px solid #334155',
  display: 'flex', flexDirection: 'column', flexShrink: 0,
  transition: 'width 0.25s ease', overflow: 'hidden',
};

const convItemStyle: React.CSSProperties = {
  padding: '12px 14px', borderRadius: 8, cursor: 'pointer', marginBottom: 4,
  display: 'flex', alignItems: 'flex-start', gap: 10,
  transition: 'background 0.15s',
};

/* ===== Component ===== */
const Chat = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeConv, setActiveConv] = useState<string>('1');
  const [messages, setMessages] = useState<Msg[]>(mockMessages);
  const [inputVal, setInputVal] = useState('');
  const [sending, setSending] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [streamText, setStreamText] = useState('');
  const [msgId, setMsgId] = useState(7);
  const [mentionedEmployee, setMentionedEmployee] = useState<string | null>(null);
  const [linkedKB, setLinkedKB] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const streamTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, streamText, scrollToBottom]);

  const filteredConvs = mockConversations.filter(c =>
    !searchText || c.title.includes(searchText) || c.lastMsg.includes(searchText)
  );

  const startStreaming = useCallback((fullText: string) => {
    let idx = 0;
    setStreamText('');
    setSending(true);
    streamTimerRef.current = setInterval(() => {
      idx += Math.floor(Math.random() * 3) + 1;
      if (idx >= fullText.length) {
        idx = fullText.length;
        if (streamTimerRef.current) clearInterval(streamTimerRef.current);
        setStreamText('');
        setMessages(prev => [...prev, { id: Date.now(), role: 'assistant', content: fullText }]);
        setSending(false);
        setMsgId(p => p + 1);
      } else {
        setStreamText(fullText.slice(0, idx));
      }
    }, 25);
  }, []);

  useEffect(() => {
    return () => { if (streamTimerRef.current) clearInterval(streamTimerRef.current); };
  }, []);

  const handleSend = () => {
    const text = inputVal.trim();
    if (!text || sending) return;
    const content = mentionedEmployee ? `@${mentionedEmployee} ${text}` : text;
    const newUserMsg: Msg = { id: msgId, role: 'user', content };
    setMessages(prev => [...prev, newUserMsg]);
    setMsgId(p => p + 1);
    setInputVal('');
    setMentionedEmployee(null);
    setTimeout(() => startStreaming(aiReplyTemplate), 400);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const deleteConv = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    message.success('会话已删除');
    if (activeConv === id) setActiveConv('');
  };

  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text).then(() => message.success('已复制到剪贴板')).catch(() => message.info('复制失败'));
  };

  const modelMenuItems: MenuProps['items'] = [
    { key: 'deepseek', label: 'DeepSeek Chat' },
    { key: 'gpt4', label: 'GPT-4o' },
    { key: 'qwen', label: 'Qwen-Max' },
  ];

  /* ===== @提及数字员工 Popover content ===== */
  const employeePopoverContent = (
    <div style={{ width: 200 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', marginBottom: 8 }}>选择数字员工</div>
      {digitalEmployees.map(emp => (
        <div
          key={emp.id}
          onClick={() => {
            setMentionedEmployee(emp.name);
            setInputVal(`@${emp.name} ` + inputVal);
            message.success(`已@${emp.name}`);
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
            borderRadius: 6, cursor: 'pointer', transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#334155'}
          onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
        >
          <span style={{ fontSize: 20 }}>{emp.avatar}</span>
          <div>
            <div style={{ fontSize: 13, color: '#f1f5f9' }}>{emp.name}</div>
            <div style={{ fontSize: 11, color: '#10b981' }}>● 已启用</div>
          </div>
        </div>
      ))}
    </div>
  );

  /* ===== 知识库 Popover content ===== */
  const kbPopoverContent = (
    <div style={{ width: 200 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', marginBottom: 8 }}>选择知识库</div>
      {knowledgeBases.map(kb => (
        <div
          key={kb.id}
          onClick={() => {
            setLinkedKB(kb.name);
            message.success(`已关联知识库：${kb.name}`);
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
            borderRadius: 6, cursor: 'pointer', transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#334155'}
          onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
        >
          <BookOutlined style={{ color: '#6366f1' }} />
          <div>
            <div style={{ fontSize: 13, color: '#f1f5f9' }}>{kb.name}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>{kb.count} 篇文档</div>
          </div>
        </div>
      ))}
    </div>
  );

  /* ===== Markdown-like renderer ===== */
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeLines: string[] = [];
    let listItems: string[] = [];

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`ul-${elements.length}`} style={{ margin: '6px 0', paddingLeft: 20 }}>
            {listItems.map((item, i) => <li key={i} style={{ marginBottom: 3, color: '#e2e8f0' }}>{renderInline(item)}</li>)}
          </ul>
        );
        listItems = [];
      }
    };

    const renderInline = (line: string): React.ReactNode => {
      const parts: React.ReactNode[] = [];
      let remaining = line;
      let key = 0;
      while (remaining.length > 0) {
        const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
        const codeMatch = remaining.match(/`([^`]+)`/);
        if (boldMatch && (!codeMatch || boldMatch.index! <= codeMatch.index!)) {
          const before = remaining.slice(0, boldMatch.index!);
          if (before) parts.push(<span key={key++}>{before}</span>);
          parts.push(<strong key={key++} style={{ color: '#f1f5f9' }}>{boldMatch[1]}</strong>);
          remaining = remaining.slice(boldMatch.index! + boldMatch[0].length);
        } else if (codeMatch) {
          const before = remaining.slice(0, codeMatch.index!);
          if (before) parts.push(<span key={key++}>{before}</span>);
          parts.push(<code key={key++} style={{ background: '#334155', padding: '2px 6px', borderRadius: 4, fontSize: 13, color: '#f59e0b' }}>{codeMatch[1]}</code>);
          remaining = remaining.slice(codeMatch.index! + codeMatch[0].length);
        } else {
          parts.push(<span key={key++}>{remaining}</span>);
          break;
        }
      }
      return parts;
    };

    lines.forEach((line, i) => {
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          flushList();
          inCodeBlock = true;
          codeLines = [];
        } else {
          inCodeBlock = false;
          elements.push(
            <pre key={`code-${i}`} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '12px 16px', margin: '8px 0', fontSize: 13, color: '#e2e8f0', overflow: 'auto', fontFamily: "'Courier New', monospace" }}>
              {codeLines.join('\n')}
            </pre>
          );
        }
        return;
      }
      if (inCodeBlock) { codeLines.push(line); return; }

      if (line.startsWith('## ')) { flushList(); elements.push(<h2 key={`h2-${i}`} style={{ fontSize: 18, fontWeight: 600, color: '#f1f5f9', margin: '12px 0 8px' }}>{renderInline(line.slice(3))}</h2>); }
      else if (line.startsWith('### ')) { flushList(); elements.push(<h3 key={`h3-${i}`} style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9', margin: '10px 0 6px' }}>{renderInline(line.slice(4))}</h3>); }
      else if (line.startsWith('> ')) { flushList(); elements.push(<blockquote key={`bq-${i}`} style={{ borderLeft: '3px solid #6366f1', paddingLeft: 12, margin: '8px 0', color: '#94a3b8', fontStyle: 'italic' }}>{renderInline(line.slice(2))}</blockquote>); }
      else if (/^\d+\.\s/.test(line)) { listItems.push(line.replace(/^\d+\.\s/, '')); }
      else if (line.startsWith('- ')) { listItems.push(line.slice(2)); }
      else if (line.startsWith('| ') || line.startsWith('|--')) {
        // skip table rendering for simplicity
      }
      else if (line.trim() === '') { flushList(); }
      else { flushList(); elements.push(<p key={`p-${i}`} style={{ margin: '4px 0', color: '#e2e8f0', lineHeight: 1.7 }}>{renderInline(line)}</p>); }
    });
    flushList();
    return elements;
  };

  const activeConvData = mockConversations.find(c => c.id === activeConv);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 130px)', margin: -24, background: '#0f172a', borderRadius: 12, overflow: 'hidden' }}>
      {/* 左侧会话列表 */}
      <div style={{ ...sidebarStyle, width: collapsed ? 0 : 280 }}>
        <div style={{ padding: '16px 14px', borderBottom: '1px solid #334155', flexShrink: 0 }}>
          <Button type="primary" icon={<PlusOutlined />} block style={{ marginBottom: 12, borderRadius: 8 }}>
            新建会话
          </Button>
          <Input
            prefix={<SearchOutlined style={{ color: '#64748b' }} />}
            placeholder="搜索会话..."
            size="small"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ borderRadius: 8, background: '#1e293b', border: '1px solid #334155' }}
            allowClear
          />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
          {filteredConvs.map(conv => (
            <div
              key={conv.id}
              style={{
                ...convItemStyle,
                background: conv.id === activeConv ? '#1e293b' : 'transparent',
              }}
              onClick={() => setActiveConv(conv.id)}
              onMouseEnter={e => { if (conv.id !== activeConv) (e.currentTarget as HTMLDivElement).style.background = '#1e293b88'; }}
              onMouseLeave={e => { if (conv.id !== activeConv) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
            >
              <span style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{conv.avatar}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {conv.title}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 3 }}>
                  {conv.lastMsg}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                <span style={{ fontSize: 11, color: '#64748b' }}>{conv.time}</span>
                <DeleteOutlined
                  style={{ color: '#ef4444', fontSize: 12, opacity: 0.6, cursor: 'pointer' }}
                  onClick={e => deleteConv(conv.id, e)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 右侧对话区 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#1e293b' }}>
        {/* 顶部栏 */}
        <div style={{
          padding: '12px 20px', borderBottom: '1px solid #334155',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span onClick={() => setCollapsed(!collapsed)} style={{ cursor: 'pointer', color: '#94a3b8', fontSize: 16 }}>
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </span>
            <Avatar style={{ background: '#6366f1' }} icon={<RobotOutlined />} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>{activeConvData?.title || '新会话'}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>在线</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Dropdown menu={{ items: modelMenuItems }}>
              <Button size="small" style={{ borderRadius: 6, borderColor: '#334155', color: '#94a3b8' }}>
                DeepSeek Chat
              </Button>
            </Dropdown>
            <Tooltip title="导出对话">
              <Button size="small" icon={<ExportOutlined />} style={{ borderRadius: 6, borderColor: '#334155', color: '#94a3b8' }} />
            </Tooltip>
          </div>
        </div>

        {/* 消息列表 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {messages.map(msg => (
            <div key={msg.id} style={{ display: 'flex', marginBottom: 20, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {msg.role === 'assistant' && (
                <Avatar style={{ background: '#6366f1', marginRight: 10, flexShrink: 0, marginTop: 4 }} icon={<RobotOutlined />} size={36} />
              )}
              <div style={{ maxWidth: '70%' }}>
                <div style={{
                  padding: '12px 16px', borderRadius: 12,
                  background: msg.role === 'user' ? '#6366f1' : '#0f172a',
                  border: msg.role === 'assistant' ? '1px solid #334155' : 'none',
                  color: msg.role === 'user' ? '#fff' : '#e2e8f0',
                  borderBottomRightRadius: msg.role === 'user' ? 4 : 12,
                  borderBottomLeftRadius: msg.role === 'assistant' ? 4 : 12,
                  fontSize: 14, lineHeight: 1.7,
                }}>
                  {msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}
                </div>
                {/* 操作栏 */}
                <div style={{ display: 'flex', gap: 8, marginTop: 6, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <Tooltip title="复制">
                    <span style={{ cursor: 'pointer', color: '#64748b', fontSize: 13 }} onClick={() => copyMessage(msg.content)}>
                      <CopyOutlined />
                    </span>
                  </Tooltip>
                  {msg.role === 'assistant' && (
                    <>
                      <Tooltip title="有用">
                        <span style={{ cursor: 'pointer', color: '#64748b', fontSize: 13 }}><LikeOutlined /></span>
                      </Tooltip>
                      <Tooltip title="无用">
                        <span style={{ cursor: 'pointer', color: '#64748b', fontSize: 13 }}><DislikeOutlined /></span>
                      </Tooltip>
                    </>
                  )}
                </div>
              </div>
              {msg.role === 'user' && (
                <Avatar style={{ background: '#3b82f6', marginLeft: 10, flexShrink: 0, marginTop: 4 }} size={36}>U</Avatar>
              )}
            </div>
          ))}

          {/* 流式响应中 */}
          {streamText && (
            <div style={{ display: 'flex', marginBottom: 20 }}>
              <Avatar style={{ background: '#6366f1', marginRight: 10, flexShrink: 0, marginTop: 4 }} icon={<RobotOutlined />} size={36} />
              <div style={{ maxWidth: '70%' }}>
                <div style={{ padding: '12px 16px', borderRadius: 12, background: '#0f172a', border: '1px solid #334155', borderBottomLeftRadius: 4, color: '#e2e8f0', fontSize: 14, lineHeight: 1.7 }}>
                  {renderMarkdown(streamText)}
                  <span style={{ display: 'inline-block', width: 2, height: 16, background: '#6366f1', marginLeft: 2, animation: 'blink 0.8s infinite', verticalAlign: 'text-bottom' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* 底部输入区 */}
        <div style={{ padding: '12px 20px 16px', borderTop: '1px solid #334155', flexShrink: 0 }}>
          {/* 已关联知识库标签 */}
          {linkedKB && (
            <div style={{ marginBottom: 8 }}>
              <Tag
                closable
                onClose={() => setLinkedKB(null)}
                color="#6366f1"
                icon={<BookOutlined />}
              >
                已关联知识库：{linkedKB}
              </Tag>
            </div>
          )}
          {/* 当前对话对象提示 */}
          {mentionedEmployee && (
            <div style={{ marginBottom: 8, padding: '4px 10px', background: '#6366f122', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <RobotOutlined style={{ color: '#6366f1', fontSize: 13 }} />
              <span style={{ fontSize: 12, color: '#94a3b8' }}>当前对话对象：</span>
              <span style={{ fontSize: 12, color: '#f1f5f9', fontWeight: 500 }}>{mentionedEmployee}</span>
              <span onClick={() => setMentionedEmployee(null)} style={{ marginLeft: 'auto', cursor: 'pointer', color: '#64748b', fontSize: 12 }}>✕ 取消</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <Tooltip title="上传文件">
              <Button size="small" icon={<PaperClipOutlined />} style={{ borderRadius: 6, borderColor: '#334155', color: '#94a3b8' }} />
            </Tooltip>
            <Popover content={employeePopoverContent} trigger="click" placement="topLeft">
              <Tooltip title="@提及数字员工">
                <Button size="small" icon={<CommentOutlined />} style={{ borderRadius: 6, borderColor: mentionedEmployee ? '#6366f1' : '#334155', color: mentionedEmployee ? '#6366f1' : '#94a3b8' }} />
              </Tooltip>
            </Popover>
            <Popover content={kbPopoverContent} trigger="click" placement="topLeft">
              <Tooltip title="引用知识库">
                <Button size="small" icon={<BookOutlined />} style={{ borderRadius: 6, borderColor: linkedKB ? '#6366f1' : '#334155', color: linkedKB ? '#6366f1' : '#94a3b8' }} />
              </Tooltip>
            </Popover>
            <Dropdown menu={{ items: modelMenuItems }}>
              <Button size="small" style={{ borderRadius: 6, borderColor: '#334155', color: '#94a3b8', fontSize: 12 }}>
                DeepSeek Chat
              </Button>
            </Dropdown>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <TextArea
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息，Shift+Enter 换行，Enter 发送..."
              autoSize={{ minRows: 1, maxRows: 4 }}
              style={{ borderRadius: 10, background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', resize: 'none' }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              loading={sending}
              style={{ borderRadius: 10, height: 'auto', minHeight: 40, background: sending ? undefined : '#6366f1', border: 'none' }}
            >
              发送
            </Button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
};

export default Chat;
