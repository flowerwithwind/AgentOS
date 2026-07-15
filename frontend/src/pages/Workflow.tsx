
import { useState } from 'react';
import {
  Button, Input, Select, Slider, Typography, Space, Tooltip, message, Divider,
} from 'antd';
import {
  SaveOutlined, PlayCircleOutlined, UndoOutlined, RedoOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined, PlayCircleFilled,
  BranchesOutlined, ApiOutlined, CodeOutlined, DatabaseOutlined,
  MergeCellsOutlined, FlagOutlined, ThunderboltOutlined, DeleteOutlined,
} from '@ant-design/icons';

const { Text } = Typography;
const { TextArea } = Input;

const nodeTypes = [
  { type: 'start', label: '开始节点', icon: <PlayCircleFilled />, color: '#10b981', desc: '工作流入口' },
  { type: 'llm', label: 'LLM 节点', icon: <ThunderboltOutlined />, color: '#8b5cf6', desc: '调用大语言模型' },
  { type: 'condition', label: '条件分支', icon: <BranchesOutlined />, color: '#f59e0b', desc: '根据条件分流' },
  { type: 'http', label: 'HTTP 请求', icon: <ApiOutlined />, color: '#3b82f6', desc: '发送HTTP请求' },
  { type: 'code', label: '代码执行', icon: <CodeOutlined />, color: '#06b6d4', desc: '执行代码片段' },
  { type: 'knowledge', label: '知识库检索', icon: <DatabaseOutlined />, color: '#3b82f6', desc: '从知识库检索' },
  { type: 'merge', label: '变量聚合', icon: <MergeCellsOutlined />, color: '#f97316', desc: '聚合多路变量' },
  { type: 'end', label: '结束节点', icon: <FlagOutlined />, color: '#ef4444', desc: '工作流结束' },
];

type NodeData = {
  id: string; type: string; label: string; x: number; y: number;
  color: string; config?: Record<string, unknown>;
};

const initialNodes: NodeData[] = [
  { id: 'n1', type: 'start', label: '开始', x: 80, y: 200, color: '#10b981' },
  { id: 'n2', type: 'knowledge', label: '检索产品文档', x: 280, y: 200, color: '#3b82f6' },
  { id: 'n3', type: 'condition', label: '是否有匹配结果？', x: 500, y: 200, color: '#f59e0b' },
  { id: 'n4', type: 'llm', label: '基于知识库回答', x: 740, y: 120, color: '#8b5cf6' },
  { id: 'n5', type: 'llm', label: '通用回答', x: 740, y: 290, color: '#8b5cf6' },
  { id: 'n6', type: 'end', label: '结束', x: 960, y: 200, color: '#ef4444' },
];

const connections = [
  { from: 'n1', to: 'n2' },
  { from: 'n2', to: 'n3' },
  { from: 'n3', to: 'n4', label: '是' },
  { from: 'n3', to: 'n5', label: '否' },
  { from: 'n4', to: 'n6' },
  { from: 'n5', to: 'n6' },
];

const getNodeCenter = (node: NodeData) => {
  const w = node.type === 'condition' ? 140 : 150;
  const h = 52;
  return { cx: node.x + w / 2, cy: node.y + h / 2, w, h };
};

const Workflow = () => {
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [nodes, setNodes] = useState<NodeData[]>(initialNodes);
  const [dragging, setDragging] = useState<{ id: string; startX: number; startY: number; nodeX: number; nodeY: number } | null>(null);
  const [wfName, setWfName] = useState('知识库问答工作流');
  const [llmModel, setLlmModel] = useState('deepseek-chat');
  const [temperature, setTemperature] = useState(0.7);
  const [systemPrompt, setSystemPrompt] = useState('你是一个专业的客服助手，基于知识库内容回答用户问题。');
  const [conditionExpr, setConditionExpr] = useState('result.matches.length > 0');

  const selectedNodeData = nodes.find(n => n.id === selectedNode);

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const n = nodes.find(nd => nd.id === nodeId);
    if (!n) return;
    setDragging({ id: nodeId, startX: e.clientX, startY: e.clientY, nodeX: n.x, nodeY: n.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragging.startX;
    const dy = e.clientY - dragging.startY;
    setNodes(prev => prev.map(n => n.id === dragging.id ? { ...n, x: dragging.nodeX + dx, y: dragging.nodeY + dy } : n));
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const renderNode = (node: NodeData) => {
    const isSelected = selectedNode === node.id;
    const isCondition = node.type === 'condition';
    const isDragging = dragging?.id === node.id;

    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: node.x,
      top: node.y,
      width: isCondition ? 140 : 150,
      minHeight: 48,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: isDragging ? 'grabbing' : 'grab',
      zIndex: isDragging ? 20 : 10,
      transition: dragging ? 'none' : 'box-shadow 0.2s',
      border: `2px solid ${isSelected ? '#fff' : node.color}`,
      boxShadow: isSelected ? `0 0 0 3px ${node.color}55, 0 4px 12px rgba(0,0,0,0.4)` : `0 2px 8px rgba(0,0,0,0.3)`,
      background: '#1e293b',
      borderRadius: isCondition ? 4 : 10,
      padding: '8px 10px',
      userSelect: 'none',
    };

    const iconObj = nodeTypes.find(nt => nt.type === node.type);

    return (
      <div key={node.id} style={baseStyle}
        onMouseDown={(e) => { setSelectedNode(node.id); handleMouseDown(e, node.id); }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: node.color, fontSize: 16 }}>{iconObj?.icon}</span>
          <Text style={{ color: '#f1f5f9', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 100 }}>
            {node.label}
          </Text>
        </div>
      </div>
    );
  };

  const renderConnections = () => {
    const lines: React.ReactNode[] = [];
    connections.forEach((conn, i) => {
      const fromNode = nodes.find(n => n.id === conn.from)!;
      const toNode = nodes.find(n => n.id === conn.to)!;
      const from = getNodeCenter(fromNode);
      const to = getNodeCenter(toNode);

      const x1 = fromNode.type === 'condition' ? from.cx + from.w / 2 : fromNode.x + from.w;
      const y1 = from.cy;
      const x2 = toNode.x;
      const y2 = to.cy;

      const midX = (x1 + x2) / 2;

      const path = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;

      lines.push(
        <g key={i}>
          <path d={path} stroke="#475569" strokeWidth={2} fill="none" markerEnd="url(#arrowhead)" />
          {conn.label && (
            <text x={midX} y={(y1 + y2) / 2 - 8} fill="#94a3b8" fontSize={11} textAnchor="middle">
              {conn.label}
            </text>
          )}
        </g>
      );
    });

    return (
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#475569" />
          </marker>
        </defs>
        {lines}
      </svg>
    );
  };

  const renderRightPanel = () => {
    if (!selectedNodeData) return null;
    const nt = nodeTypes.find(n => n.type === selectedNodeData.type);

    return (
      <div style={{ width: 300, flexShrink: 0, background: '#0f172a', borderLeft: '1px solid #334155', padding: 16, overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ color: selectedNodeData.color, fontSize: 18 }}>{nt?.icon}</span>
          <Text strong style={{ color: '#f1f5f9' }}>{nt?.label}</Text>
        </div>

        <Text style={{ color: '#94a3b8', fontSize: 12 }}>节点名称</Text>
        <Input defaultValue={selectedNodeData.label} style={{ marginBottom: 16, marginTop: 4 }} />

        {selectedNodeData.type === 'llm' && (
          <>
            <Text style={{ color: '#94a3b8', fontSize: 12 }}>模型选择</Text>
            <Select value={llmModel} onChange={setLlmModel} style={{ width: '100%', marginTop: 4, marginBottom: 16 }}
              options={[
                { value: 'deepseek-chat', label: 'DeepSeek Chat' },
                { value: 'gpt-4o', label: 'GPT-4o' },
                { value: 'claude-3.5', label: 'Claude 3.5 Sonnet' },
              ]} />
            <Text style={{ color: '#94a3b8', fontSize: 12 }}>温度: {temperature}</Text>
            <Slider min={0} max={2} step={0.1} value={temperature} onChange={setTemperature} style={{ marginBottom: 16 }} />
            <Text style={{ color: '#94a3b8', fontSize: 12 }}>系统提示词</Text>
            <TextArea rows={4} value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)}
              style={{ marginTop: 4, marginBottom: 16, background: '#1e293b' }} />
          </>
        )}

        {selectedNodeData.type === 'condition' && (
          <>
            <Text style={{ color: '#94a3b8', fontSize: 12 }}>条件表达式</Text>
            <TextArea rows={3} value={conditionExpr} onChange={e => setConditionExpr(e.target.value)}
              style={{ marginTop: 4, marginBottom: 16, background: '#1e293b', fontFamily: 'monospace' }} />
          </>
        )}

        {selectedNodeData.type === 'http' && (
          <>
            <Text style={{ color: '#94a3b8', fontSize: 12 }}>请求URL</Text>
            <Input placeholder="https://api.example.com/data" style={{ marginTop: 4, marginBottom: 12 }} />
            <Text style={{ color: '#94a3b8', fontSize: 12 }}>请求方法</Text>
            <Select defaultValue="GET" style={{ width: '100%', marginTop: 4, marginBottom: 12 }}
              options={[{ value: 'GET', label: 'GET' }, { value: 'POST', label: 'POST' }, { value: 'PUT', label: 'PUT' }]} />
            <Text style={{ color: '#94a3b8', fontSize: 12 }}>Headers</Text>
            <Input placeholder="Content-Type: application/json" style={{ marginTop: 4, marginBottom: 16 }} />
          </>
        )}

        <Divider />
        <Button danger block icon={<DeleteOutlined />} onClick={() => { message.info('删除节点（原型演示）'); setSelectedNode(null); }}>
          删除节点
        </Button>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)', marginTop: -24, marginLeft: -24, marginRight: -24, marginBottom: -24 }}>
      {/* 顶部工具栏 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: '#0f172a', borderBottom: '1px solid #334155' }}>
        <Space>
          <Input value={wfName} onChange={e => setWfName(e.target.value)}
            style={{ width: 240, fontWeight: 600 }} variant="borderless" />
        </Space>
        <Space>
          <Tooltip title="撤销"><Button icon={<UndoOutlined />} disabled /></Tooltip>
          <Tooltip title="重做"><Button icon={<RedoOutlined />} disabled /></Tooltip>
          <Button icon={<SaveOutlined />} onClick={() => message.success('已保存（原型演示）')}>保存</Button>
          <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => message.info('运行测试（原型演示）')}>运行测试</Button>
        </Space>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* 左侧节点面板 */}
        <div style={{ width: leftPanelOpen ? 200 : 0, transition: 'width 0.3s', overflow: 'hidden', background: '#0f172a', borderRight: '1px solid #334155', flexShrink: 0 }}>
          <div style={{ width: 200, padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text strong style={{ color: '#f1f5f9', fontSize: 13 }}>节点类型</Text>
              <Button type="text" size="small" icon={<MenuFoldOutlined />} onClick={() => setLeftPanelOpen(false)} />
            </div>
            {nodeTypes.map(nt => (
              <div key={nt.type}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 6, cursor: 'grab', marginBottom: 4, background: '#1e293b', border: '1px solid #334155' }}
                onClick={() => message.info(`拖拽 ${nt.label} 到画布（原型演示）`)}>
                <span style={{ color: nt.color, fontSize: 16 }}>{nt.icon}</span>
                <div>
                  <div style={{ color: '#f1f5f9', fontSize: 13 }}>{nt.label}</div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>{nt.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {!leftPanelOpen && (
          <Button type="text" icon={<MenuUnfoldOutlined />} onClick={() => setLeftPanelOpen(true)}
            style={{ position: 'absolute', left: 0, top: '50%', zIndex: 20 }} />
        )}

        {/* 中间画布 */}
        <div style={{ flex: 1, position: 'relative', overflow: 'auto', background: '#0f172a', backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)', backgroundSize: '24px 24px' }}
          onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
          {renderConnections()}
          {nodes.map(renderNode)}
        </div>

        {/* 右侧属性面板 */}
        {selectedNode && renderRightPanel()}
      </div>
    </div>
  );
};

export default Workflow;
