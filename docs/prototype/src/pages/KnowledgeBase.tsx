import { useState } from 'react';
import {
  Select, Button, Card, Row, Col, Table, Input, Tag, Upload, Progress,
  Slider, Radio, Space, Typography, Badge, message, Tooltip,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, InboxOutlined,
  FileTextOutlined, FilePdfOutlined, FileWordOutlined, FileMarkdownOutlined,
  DeleteOutlined, EyeOutlined, DatabaseOutlined, ExperimentOutlined,
  CloseOutlined, ThunderboltOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Text, Title } = Typography;

const knowledgeBases = [
  { value: 'product', label: '产品手册库' },
  { value: 'tech', label: '技术文档库' },
  { value: 'faq', label: 'FAQ问答库' },
];

const overviewCards = [
  { title: '文档总数', value: 128, icon: <FileTextOutlined />, color: '#6366f1' },
  { title: '总分段数', value: '1,247', icon: <DatabaseOutlined />, color: '#10b981' },
  { title: '向量维度', value: '1536', icon: <ThunderboltOutlined />, color: '#f59e0b' },
];

const mockDocs = [
  { key: '1', name: '产品使用手册v3.2.pdf', type: 'PDF', size: '4.2 MB', segments: 87, status: 'completed', time: '2026-07-12 14:30' },
  { key: '2', name: 'API接口文档.docx', type: 'Word', size: '2.1 MB', segments: 45, status: 'completed', time: '2026-07-11 09:15' },
  { key: '3', name: '常见问题汇总.md', type: 'Markdown', size: '156 KB', segments: 234, status: 'completed', time: '2026-07-10 16:45' },
  { key: '4', name: '技术架构设计.pdf', type: 'PDF', size: '8.7 MB', segments: 156, status: 'processing', time: '2026-07-13 10:20' },
  { key: '5', name: '用户反馈分析报告.docx', type: 'Word', size: '3.5 MB', segments: 68, status: 'failed', time: '2026-07-09 11:30' },
  { key: '6', name: '部署运维指南.md', type: 'Markdown', size: '280 KB', segments: 312, status: 'completed', time: '2026-07-08 08:00' },
];

const typeIconMap: Record<string, React.ReactNode> = {
  PDF: <FilePdfOutlined style={{ color: '#ef4444', fontSize: 16 }} />,
  Word: <FileWordOutlined style={{ color: '#3b82f6', fontSize: 16 }} />,
  Markdown: <FileMarkdownOutlined style={{ color: '#10b981', fontSize: 16 }} />,
};

const statusMap: Record<string, { color: string; text: string }> = {
  processing: { color: 'processing', text: '处理中' },
  completed: { color: 'success', text: '已完成' },
  failed: { color: 'error', text: '失败' },
};

const mockSearchResults = [
  { id: 1, content: '系统支持多种部署方式，包括<em>私有化部署</em>、混合云部署和SaaS模式。管理员可在系统设置中切换部署模式，并配置相应的资源配额。', score: 0.94, source: '产品使用手册v3.2.pdf' },
  { id: 2, content: 'API调用频率限制为每分钟<em>60次</em>，超出限制后系统将返回429状态码。企业版用户可申请提升配额至每分钟500次。', score: 0.87, source: 'API接口文档.docx' },
  { id: 3, content: '<em>知识库检索</em>采用混合检索策略，结合向量相似度检索与BM25全文检索，通过RRF算法融合排序结果，召回率提升约23%。', score: 0.82, source: '技术架构设计.pdf' },
];

const KnowledgeBase = () => {
  const [selectedKB, setSelectedKB] = useState('product');
  const [searchText, setSearchText] = useState('');
  const [testPanelOpen, setTestPanelOpen] = useState(true);
  const [searchMode, setSearchMode] = useState('hybrid');
  const [topK, setTopK] = useState(5);
  const [queryText, setQueryText] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<null | { stage: string; percent: number }>(null);
  const [selectedDocType, setSelectedDocType] = useState<string>('all');

  const filteredDocs = mockDocs.filter(d => {
    if (selectedDocType !== 'all' && d.type !== selectedDocType) return false;
    if (searchText && !d.name.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  const columns: ColumnsType<typeof mockDocs[0]> = [
    {
      title: '文档名称', dataIndex: 'name', key: 'name',
      render: (text: string, record) => (
        <Space>{typeIconMap[record.type]}<Text style={{ color: '#f1f5f9' }}>{text}</Text></Space>
      ),
    },
    { title: '类型', dataIndex: 'type', key: 'type', width: 80,
      render: (t: string) => <Tag>{t}</Tag>,
    },
    { title: '大小', dataIndex: 'size', key: 'size', width: 100 },
    { title: '分段数', dataIndex: 'segments', key: 'segments', width: 80 },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (s: string) => {
        const info = statusMap[s];
        return <Badge status={info.color as 'processing' | 'success' | 'error'} text={info.text} />;
      },
    },
    { title: '上传时间', dataIndex: 'time', key: 'time', width: 160 },
    {
      title: '操作', key: 'action', width: 120,
      render: () => (
        <Space>
          <Tooltip title="预览"><Button type="text" size="small" icon={<EyeOutlined />} /></Tooltip>
          <Tooltip title="删除"><Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => message.info('已删除（原型演示）')} /></Tooltip>
        </Space>
      ),
    },
  ];

  const simulateUpload = () => {
    setUploadProgress({ stage: '分段中', percent: 20 });
    setTimeout(() => setUploadProgress({ stage: '分段中', percent: 45 }), 600);
    setTimeout(() => setUploadProgress({ stage: '向量化中', percent: 70 }), 1200);
    setTimeout(() => setUploadProgress({ stage: '向量化中', percent: 90 }), 1800);
    setTimeout(() => {
      setUploadProgress({ stage: '完成', percent: 100 });
      message.success('文档处理完成');
      setTimeout(() => setUploadProgress(null), 1500);
    }, 2400);
  };

  return (
    <div>
      {/* 顶部操作栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Title level={4} style={{ margin: 0, color: '#f1f5f9' }}>知识库管理</Title>
          <Select value={selectedKB} onChange={setSelectedKB} style={{ width: 200 }}
            options={knowledgeBases} />
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => message.info('新建知识库（原型演示）')}>新建知识库</Button>
      </div>

      {/* 概览卡片 */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        {overviewCards.map(c => (
          <Col span={8} key={c.title}>
            <Card style={{ background: '#0f172a', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: c.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: c.color }}>
                  {c.icon}
                </div>
                <div>
                  <Text style={{ color: '#94a3b8', fontSize: 13 }}>{c.title}</Text>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9' }}>{c.value}</div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 主体区域：文档管理 + 检索测试 */}
      <div style={{ display: 'flex', gap: 16 }}>
        {/* 左侧文档管理区 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* 搜索和筛选 */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <Input prefix={<SearchOutlined />} placeholder="搜索文档名称" value={searchText}
              onChange={e => setSearchText(e.target.value)} style={{ flex: 1 }} allowClear />
            <Select value={selectedDocType} onChange={setSelectedDocType} style={{ width: 130 }}
              options={[{ value: 'all', label: '全部类型' }, { value: 'PDF', label: 'PDF' }, { value: 'Word', label: 'Word' }, { value: 'Markdown', label: 'Markdown' }]} />
          </div>

          {/* 文档表格 */}
          <Table columns={columns} dataSource={filteredDocs} pagination={false}
            style={{ background: '#0f172a', borderRadius: 8 }} size="middle" />

          {/* 上传区域 */}
          <Card style={{ marginTop: 16, background: '#0f172a', border: '1px solid #334155' }} title="文档上传">
            <Upload.Dragger
              multiple
              showUploadList={false}
              beforeUpload={() => { simulateUpload(); return false; }}
              style={{ background: '#1e293b', border: '2px dashed #334155' }}
            >
              <p style={{ fontSize: 32, color: '#6366f1', marginBottom: 8 }}><InboxOutlined /></p>
              <p style={{ color: '#f1f5f9', fontSize: 15 }}>点击或拖拽文件到此区域上传</p>
              <p style={{ color: '#64748b', fontSize: 13 }}>支持 PDF、Word、Markdown、TXT 格式，单文件最大 50MB</p>
            </Upload.Dragger>
            {uploadProgress && (
              <div style={{ marginTop: 12 }}>
                <Text style={{ color: '#94a3b8', fontSize: 13 }}>{uploadProgress.stage}</Text>
                <Progress percent={uploadProgress.percent} status={uploadProgress.percent === 100 ? 'success' : 'active'}
                  strokeColor="#6366f1" style={{ marginTop: 4 }} />
              </div>
            )}
          </Card>
        </div>

        {/* 右侧检索测试面板 */}
        <div style={{ width: testPanelOpen ? 360 : 0, transition: 'width 0.3s', overflow: 'hidden', flexShrink: 0 }}>
          <Card
            style={{ width: 360, background: '#0f172a', border: '1px solid #334155', height: '100%' }}
            title={<Space><ExperimentOutlined /> 检索测试</Space>}
            extra={<Button type="text" icon={<CloseOutlined />} onClick={() => setTestPanelOpen(false)} />}
          >
            <Input.TextArea rows={3} placeholder="输入检索内容..." value={queryText}
              onChange={e => setQueryText(e.target.value)} style={{ marginBottom: 12, background: '#1e293b' }} />

            <Text style={{ color: '#94a3b8', fontSize: 12 }}>检索模式</Text>
            <Radio.Group value={searchMode} onChange={e => setSearchMode(e.target.value)}
              style={{ display: 'flex', marginBottom: 12, marginTop: 4 }} buttonStyle="solid" size="small">
              <Radio.Button value="vector">向量检索</Radio.Button>
              <Radio.Button value="fulltext">全文检索</Radio.Button>
              <Radio.Button value="hybrid">混合检索</Radio.Button>
            </Radio.Group>

            <Text style={{ color: '#94a3b8', fontSize: 12 }}>Top K: {topK}</Text>
            <Slider min={1} max={20} value={topK} onChange={setTopK} style={{ marginBottom: 16 }} />

            <Button type="primary" block icon={<SearchOutlined />}
              onClick={() => { setShowResults(true); message.info('检索完成（原型演示）'); }}
              style={{ marginBottom: 16 }}>
              执行检索
            </Button>

            {showResults && (
              <div>
                <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 8, display: 'block' }}>
                  检索结果（{mockSearchResults.length}条）
                </Text>
                {mockSearchResults.map(r => (
                  <Card key={r.id} size="small" style={{ marginBottom: 8, background: '#1e293b', border: '1px solid #334155' }}>
                    <div style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.6, marginBottom: 8 }}
                      dangerouslySetInnerHTML={{ __html: r.content }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Tag color="blue">{r.source}</Tag>
                      <Text style={{ color: '#10b981', fontWeight: 600, fontSize: 13 }}>
                        {(r.score * 100).toFixed(1)}%
                      </Text>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* 展开按钮 */}
        {!testPanelOpen && (
          <Button type="primary" ghost onClick={() => setTestPanelOpen(true)}
            icon={<ExperimentOutlined />}
            style={{ writingMode: 'vertical-rl', padding: '12px 6px', height: 'auto' }}>
            检索测试
          </Button>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBase;
