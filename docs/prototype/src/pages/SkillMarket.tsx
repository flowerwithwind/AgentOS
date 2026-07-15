import { useState } from 'react';
import {
  Input, Card, Row, Col, Tag, Button, Drawer, Table,
  message, Badge, Typography, Space, Divider,
} from 'antd';
import {
  SearchOutlined, CloudOutlined, GlobalOutlined, DatabaseOutlined,
  FileTextOutlined, PictureOutlined, CodeOutlined, MailOutlined,
  CalendarOutlined, BarChartOutlined, PlusOutlined, ThunderboltOutlined,
  CheckOutlined, PlayCircleOutlined,
} from '@ant-design/icons';

const { Text, Title, Paragraph } = Typography;

const categories = ['全部', '信息查询', '数据处理', '内容生成', '系统工具', '自定义'];

type Skill = {
  key: string; name: string; desc: string; icon: React.ReactNode;
  category: string; installed: boolean; uses: number; color: string;
  fullDesc: string;
  params: { name: string; type: string; required: boolean; desc: string }[];
  output: string; example: string;
};

const skillsData: Skill[] = [
  { key: '1', name: '天气查询', desc: '获取指定城市的实时天气信息', icon: <CloudOutlined />, category: '信息查询', installed: true, uses: 12453, color: '#3b82f6', fullDesc: '通过对接天气API，获取指定城市当前天气状况和未来7天预报，支持温度、湿度、风力、空气质量等多维度数据查询。', params: [{ name: 'city', type: 'string', required: true, desc: '城市名称，如"北京"' }, { name: 'days', type: 'number', required: false, desc: '预报天数，默认1天' }], output: 'JSON格式天气数据，包含温度、天气状况、风力等', example: '输入: "北京今天天气怎么样？"\n输出: {"city":"北京","temp":"28°C","weather":"晴","humidity":"45%","wind":"东南风3级"}' },
  { key: '2', name: '网页搜索', desc: '通过搜索引擎检索互联网信息', icon: <GlobalOutlined />, category: '信息查询', installed: true, uses: 28934, color: '#10b981', fullDesc: '集成主流搜索引擎，快速检索互联网公开信息，支持摘要提取和来源链接追踪。', params: [{ name: 'query', type: 'string', required: true, desc: '搜索关键词' }, { name: 'num', type: 'number', required: false, desc: '返回结果数量，默认5条' }], output: '搜索结果列表，含标题、摘要、URL', example: '输入: "最新AI大模型论文"\n输出: 返回5条相关搜索结果' },
  { key: '3', name: '数据库查询', desc: '执行 SQL 查询并返回结果', icon: <DatabaseOutlined />, category: '数据处理', installed: false, uses: 8762, color: '#f59e0b', fullDesc: '连接MySQL/PostgreSQL数据库，执行SELECT查询语句，自动解析结果并以表格形式返回，支持参数化查询防止SQL注入。', params: [{ name: 'sql', type: 'string', required: true, desc: 'SQL查询语句' }, { name: 'database', type: 'string', required: false, desc: '目标数据库名' }], output: '查询结果表格（JSON数组）', example: '输入: "SELECT * FROM users LIMIT 5"\n输出: 5条用户记录' },
  { key: '4', name: '文档解析', desc: '解析 PDF/Word/Excel 文档内容', icon: <FileTextOutlined />, category: '数据处理', installed: false, uses: 6234, color: '#8b5cf6', fullDesc: '支持解析PDF、Word、Excel、PPT等格式文档，提取文本内容、表格数据和图片OCR识别结果。', params: [{ name: 'file_url', type: 'string', required: true, desc: '文档URL或路径' }, { name: 'format', type: 'string', required: false, desc: '输出格式：text/markdown/json' }], output: '提取的文档内容文本', example: '输入: 上传的PDF文件\n输出: 文档全文内容及结构化数据' },
  { key: '5', name: '图片生成', desc: '基于文本描述生成图片', icon: <PictureOutlined />, category: '内容生成', installed: false, uses: 15678, color: '#ec4899', fullDesc: '接入Stable Diffusion/DALL-E等AI绘图模型，根据文本描述生成高质量图片，支持风格控制和尺寸调节。', params: [{ name: 'prompt', type: 'string', required: true, desc: '图片描述文本' }, { name: 'size', type: 'string', required: false, desc: '图片尺寸，如"1024x1024"' }, { name: 'style', type: 'string', required: false, desc: '风格：realistic/anime/3d' }], output: '生成的图片URL', example: '输入: "赛博朋克风格的城市夜景"\n输出: 生成的图片URL' },
  { key: '6', name: '代码执行', desc: '在沙箱环境中运行 Python/JS 代码', icon: <CodeOutlined />, category: '系统工具', installed: true, uses: 9845, color: '#06b6d4', fullDesc: '提供安全的沙箱执行环境，支持Python和Node.js代码运行，可安装常用库，执行结果实时返回。', params: [{ name: 'code', type: 'string', required: true, desc: '待执行的代码' }, { name: 'language', type: 'string', required: false, desc: '语言：python/javascript' }], output: '代码执行输出（stdout/stderr）', example: '输入: print(sum(range(1,101)))\n输出: 5050' },
  { key: '7', name: '邮件发送', desc: '通过 SMTP 发送邮件通知', icon: <MailOutlined />, category: '系统工具', installed: false, uses: 3421, color: '#f97316', fullDesc: '通过配置的SMTP服务器发送邮件，支持HTML格式、附件添加和收件人批量发送。', params: [{ name: 'to', type: 'string', required: true, desc: '收件人邮箱' }, { name: 'subject', type: 'string', required: true, desc: '邮件主题' }, { name: 'body', type: 'string', required: true, desc: '邮件正文（支持HTML）' }], output: '发送结果：成功/失败', example: '输入: 发送测试邮件到 user@example.com\n输出: {"status":"success","messageId":"xxx"}' },
  { key: '8', name: '日程管理', desc: '创建和管理日程提醒', icon: <CalendarOutlined />, category: '系统工具', installed: false, uses: 5632, color: '#14b8a6', fullDesc: '集成日历系统，支持创建、查询、修改和删除日程事件，可设置提醒时间和重复规则。', params: [{ name: 'action', type: 'string', required: true, desc: '操作：create/list/update/delete' }, { name: 'title', type: 'string', required: false, desc: '日程标题' }, { name: 'datetime', type: 'string', required: false, desc: '日程时间' }], output: '操作结果或日程列表', example: '输入: "创建明天下午3点的会议"\n输出: 日程已创建' },
  { key: '9', name: '数据分析', desc: '对结构化数据进行统计分析', icon: <BarChartOutlined />, category: '数据处理', installed: true, uses: 7823, color: '#a855f7', fullDesc: '对CSV/Excel/JSON格式数据进行统计分析，支持描述性统计、分组聚合、趋势分析和可视化图表生成。', params: [{ name: 'data', type: 'string', required: true, desc: '数据内容或文件路径' }, { name: 'analysis_type', type: 'string', required: false, desc: '分析类型：describe/groupby/trend' }], output: '统计结果JSON和可视化图表', example: '输入: 销售数据CSV\n输出: 月度销售额趋势图及统计摘要' },
];

const paramColumns = [
  { title: '参数名', dataIndex: 'name', key: 'name', render: (t: string) => <Tag color="blue">{t}</Tag> },
  { title: '类型', dataIndex: 'type', key: 'type', render: (t: string) => <Tag>{t}</Tag> },
  { title: '必填', dataIndex: 'required', key: 'required', width: 60, render: (v: boolean) => v ? <Tag color="red">是</Tag> : <Tag>否</Tag> },
  { title: '说明', dataIndex: 'desc', key: 'desc' },
];

const SkillMarket = () => {
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('全部');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [installState, setInstallState] = useState<Record<string, boolean>>(
    Object.fromEntries(skillsData.map(s => [s.key, s.installed]))
  );
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState('');

  const filtered = skillsData.filter(s => {
    if (activeCat !== '全部' && s.category !== activeCat) return false;
    if (search && !s.name.includes(search) && !s.desc.includes(search)) return false;
    return true;
  });

  const openDrawer = (skill: Skill) => {
    setSelectedSkill(skill);
    setDrawerOpen(true);
    setTestResult('');
  };

  const handleTest = () => {
    setTesting(true);
    setTimeout(() => {
      setTestResult(selectedSkill?.example || '测试完成');
      setTesting(false);
    }, 1200);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0, color: '#f1f5f9' }}>技能市场</Title>
      </div>

      {/* 搜索 + 分类 */}
      <div style={{ marginBottom: 20 }}>
        <Input prefix={<SearchOutlined />} placeholder="搜索技能名称或描述" value={search}
          onChange={e => setSearch(e.target.value)} style={{ maxWidth: 400, marginBottom: 12 }} allowClear />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <Tag key={cat} color={activeCat === cat ? '#6366f1' : 'default'}
              style={{ cursor: 'pointer', padding: '4px 12px', fontSize: 13 }}
              onClick={() => setActiveCat(cat)}>
              {cat}
            </Tag>
          ))}
        </div>
      </div>

      {/* 技能卡片网格 */}
      <Row gutter={[16, 16]}>
        {filtered.map(skill => (
          <Col xs={24} sm={12} lg={8} key={skill.key}>
            <Card hoverable style={{ background: '#0f172a', border: '1px solid #334155', height: '100%' }}
              onClick={() => openDrawer(skill)}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: skill.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: skill.color, flexShrink: 0 }}>
                  {skill.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text strong style={{ color: '#f1f5f9', fontSize: 15 }}>{skill.name}</Text>
                    <Badge status={installState[skill.key] ? 'success' : 'default'} text={installState[skill.key] ? '已安装' : '未安装'} />
                  </div>
                  <Paragraph style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 8px 0' }} ellipsis={{ rows: 2 }}>
                    {skill.desc}
                  </Paragraph>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Tag color="default" style={{ fontSize: 11 }}>{skill.category}</Tag>
                    <Text style={{ color: '#64748b', fontSize: 12 }}>
                      <ThunderboltOutlined style={{ marginRight: 4 }} />{skill.uses.toLocaleString()} 次
                    </Text>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        ))}

        {/* 创建自定义技能 */}
        <Col xs={24} sm={12} lg={8}>
          <Card hoverable style={{ background: 'transparent', border: '2px dashed #334155', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 160, cursor: 'pointer' }}
            onClick={() => message.info('创建自定义技能（原型演示）')}>
            <div style={{ textAlign: 'center' }}>
              <PlusOutlined style={{ fontSize: 28, color: '#64748b', marginBottom: 8 }} />
              <div><Text style={{ color: '#64748b' }}>创建自定义技能</Text></div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 详情抽屉 */}
      <Drawer
        title={selectedSkill?.name}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={520}
      >
        {selectedSkill && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, background: selectedSkill.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: selectedSkill.color }}>
                {selectedSkill.icon}
              </div>
              <div>
                <Title level={5} style={{ margin: 0 }}>{selectedSkill.name}</Title>
                <Text type="secondary">{selectedSkill.category}</Text>
              </div>
            </div>

            <Paragraph>{selectedSkill.fullDesc}</Paragraph>

            <Divider>输入参数</Divider>
            <Table columns={paramColumns} dataSource={selectedSkill.params.map((p, i) => ({ ...p, key: i }))}
              pagination={false} size="small" />

            <Divider>输出格式</Divider>
            <Paragraph><Text code>{selectedSkill.output}</Text></Paragraph>

            <Divider>操作</Divider>
            <Space style={{ marginBottom: 16 }}>
              <Button type="primary" icon={installState[selectedSkill.key] ? <CheckOutlined /> : <PlusOutlined />}
                onClick={() => {
                  setInstallState(prev => ({ ...prev, [selectedSkill.key]: !prev[selectedSkill.key] }));
                  message.success(installState[selectedSkill.key] ? '已卸载' : '已安装');
                }}>
                {installState[selectedSkill.key] ? '卸载技能' : '安装技能'}
              </Button>
              <Button icon={<PlayCircleOutlined />} onClick={handleTest} loading={testing}>在线测试</Button>
            </Space>

            {testResult && (
              <>
                <Divider>测试结果</Divider>
                <pre style={{ background: '#0f172a', padding: 12, borderRadius: 8, color: '#10b981', fontSize: 13, whiteSpace: 'pre-wrap', border: '1px solid #334155' }}>
                  {testResult}
                </pre>
              </>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default SkillMarket;
