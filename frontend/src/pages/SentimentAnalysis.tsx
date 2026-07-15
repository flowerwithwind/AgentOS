
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Row, Col, Tag, Table, Typography, Space, Segmented, Select, Button, message,
} from 'antd';
import {
  ArrowUpOutlined, ArrowDownOutlined, WarningOutlined, AlertOutlined,
  RiseOutlined, ClockCircleOutlined, LinkOutlined, EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Text, Title } = Typography;

const overviewCards = [
  { title: '今日采集量', value: 247, trend: '+12.3%', up: true, icon: <RiseOutlined />, color: '#6366f1' },
  { title: '正面情感占比', value: '62.3%', trend: '+2.1%', up: true, icon: <ArrowUpOutlined />, color: '#10b981' },
  { title: '负面情感占比', value: '15.8%', trend: '-1.4%', up: false, icon: <ArrowDownOutlined />, color: '#ef4444' },
  { title: '风险预警数', value: 3, trend: '', up: false, icon: <WarningOutlined />, color: '#f59e0b', blink: true },
];

// 7天情感趋势数据
const trendData = [
  { day: '07-08', pos: 58, neu: 24, neg: 18 },
  { day: '07-09', pos: 62, neu: 22, neg: 16 },
  { day: '07-10', pos: 55, neu: 26, neg: 19 },
  { day: '07-11', pos: 60, neu: 23, neg: 17 },
  { day: '07-12', pos: 65, neu: 20, neg: 15 },
  { day: '07-13', pos: 61, neu: 22, neg: 17 },
  { day: '07-14', pos: 62, neu: 22, neg: 16 },
];

const hotTopics = [
  { text: '人工智能', size: 28, color: '#6366f1' },
  { text: '大模型', size: 26, color: '#8b5cf6' },
  { text: '数据安全', size: 22, color: '#ef4444' },
  { text: '智慧城市', size: 24, color: '#3b82f6' },
  { text: '自动驾驶', size: 20, color: '#10b981' },
  { text: '量子计算', size: 16, color: '#06b6d4' },
  { text: '元宇宙', size: 15, color: '#f59e0b' },
  { text: '芯片制造', size: 21, color: '#ec4899' },
  { text: '碳中和', size: 18, color: '#14b8a6' },
  { text: '数字经济', size: 23, color: '#6366f1' },
  { text: '区块链', size: 14, color: '#f97316' },
  { text: '机器人', size: 19, color: '#8b5cf6' },
  { text: '云计算', size: 17, color: '#3b82f6' },
  { text: '边缘计算', size: 13, color: '#10b981' },
  { text: '隐私计算', size: 16, color: '#ef4444' },
  { text: '低空经济', size: 20, color: '#f59e0b' },
  { text: '具身智能', size: 18, color: '#ec4899' },
];

const alertData = [
  { key: '1', title: '负面舆情激增：某产品质量投诉集中爆发', level: 'high', source: '微博/黑猫投诉', time: '2026-07-14 09:15', status: 'pending' },
  { key: '2', title: '竞品发布新品，市场讨论度快速上升', level: 'medium', source: '科技媒体/知乎', time: '2026-07-14 08:30', status: 'pending' },
  { key: '3', title: '行业政策变动可能影响业务合规性', level: 'high', source: '政府官网/新华网', time: '2026-07-13 22:00', status: 'processed' },
  { key: '4', title: '用户反馈系统响应速度下降', level: 'low', source: 'App Store/评论区', time: '2026-07-13 16:45', status: 'ignored' },
];

const levelMap: Record<string, { color: string; text: string }> = {
  high: { color: '#ef4444', text: '高' },
  medium: { color: '#f59e0b', text: '中' },
  low: { color: '#10b981', text: '低' },
};

const statusMap: Record<string, { color: string; text: string }> = {
  pending: { color: '#ef4444', text: '待处理' },
  processed: { color: '#10b981', text: '已处理' },
  ignored: { color: '#64748b', text: '已忽略' },
};

const articles = [
  { key: '1', title: 'AI大模型进入"应用深水区"：从技术竞赛到商业落地', source: '36氪', sentiment: 'positive', summary: '随着大模型技术逐渐成熟，行业竞争焦点从模型性能转向实际商业应用场景的深度挖掘...', time: '2小时前' },
  { key: '2', title: '某品牌新款智能设备被曝存在数据安全隐患', source: '澎湃新闻', sentiment: 'negative', summary: '安全研究人员发现该设备在数据传输过程中存在未加密的敏感信息泄露风险...', time: '3小时前' },
  { key: '3', title: '智慧城市建设白皮书发布：2026年市场规模预计突破万亿', source: '新华网', sentiment: 'positive', summary: '国家信息中心发布最新白皮书，指出智慧城市建设在交通、医疗、政务等领域取得显著进展...', time: '5小时前' },
  { key: '4', title: '自动驾驶L4级路测范围扩大，多家企业获新牌照', source: '第一财经', sentiment: 'neutral', summary: '工信部批准新一批自动驾驶路测区域，覆盖更多城市复杂场景...', time: '6小时前' },
];

const sentimentColorMap: Record<string, { color: string; text: string }> = {
  positive: { color: '#10b981', text: '正面' },
  negative: { color: '#ef4444', text: '负面' },
  neutral: { color: '#64748b', text: '中性' },
};

// CSS简易折线图
const MiniLineChart = ({ data }: { data: typeof trendData }) => {
  const maxVal = 70;
  const chartH = 160;
  const chartW = 100;
  const points = (key: 'pos' | 'neu' | 'neg') =>
    data.map((d, i) => `${(i / (data.length - 1)) * chartW},${chartH - (d[key] / maxVal) * chartH}`).join(' ');

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${chartW} ${chartH + 10}`} style={{ width: '100%', height: chartH + 20 }}>
        {[0, 20, 40, 60].map(v => {
          const y = chartH - (v / maxVal) * chartH;
          return <line key={v} x1={0} y1={y} x2={chartW} y2={y} stroke="#334155" strokeWidth={0.5} />;
        })}
        <polyline points={points('pos')} fill="none" stroke="#10b981" strokeWidth={2} />
        <polyline points={points('neu')} fill="none" stroke="#64748b" strokeWidth={2} strokeDasharray="4 2" />
        <polyline points={points('neg')} fill="none" stroke="#ef4444" strokeWidth={2} />
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * chartW;
          return (
            <g key={i}>
              <circle cx={x} cy={chartH - (d.pos / maxVal) * chartH} r={2.5} fill="#10b981" />
              <circle cx={x} cy={chartH - (d.neg / maxVal) * chartH} r={2.5} fill="#ef4444" />
              <text x={x} y={chartH + 10} textAnchor="middle" fill="#64748b" fontSize={6}>{d.day.slice(3)}</text>
            </g>
          );
        })}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 4 }}>
        <span style={{ color: '#10b981', fontSize: 12 }}>● 正面</span>
        <span style={{ color: '#64748b', fontSize: 12 }}>● 中性</span>
        <span style={{ color: '#ef4444', fontSize: 12 }}>● 负面</span>
      </div>
    </div>
  );
};

// CSS饼图 (conic-gradient)
const PieChart = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 24, justifyContent: 'center' }}>
    <div style={{
      width: 140, height: 140, borderRadius: '50%',
      background: 'conic-gradient(#10b981 0deg 224deg, #64748b 224deg 303deg, #ef4444 303deg 360deg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#f1f5f9', fontSize: 18, fontWeight: 700 }}>247</Text>
      </div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[{ label: '正面', pct: '62.3%', color: '#10b981' }, { label: '中性', pct: '21.9%', color: '#64748b' }, { label: '负面', pct: '15.8%', color: '#ef4444' }].map(item => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: item.color }} />
          <Text style={{ color: '#94a3b8', fontSize: 13 }}>{item.label}</Text>
          <Text strong style={{ color: '#f1f5f9', fontSize: 13 }}>{item.pct}</Text>
        </div>
      ))}
    </div>
  </div>
);

const SentimentAnalysis = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<string>('近7天');
  const [dataSource, setDataSource] = useState<string>('all');

  const alertColumns: ColumnsType<typeof alertData[0]> = [
    {
      title: '预警标题', dataIndex: 'title', key: 'title',
      render: (text: string, record) => (
        <div style={{ borderLeft: record.level === 'high' ? '3px solid #ef4444' : '3px solid transparent', paddingLeft: 8 }}>
          <Text style={{ color: '#f1f5f9' }}>{text}</Text>
        </div>
      ),
    },
    {
      title: '风险等级', dataIndex: 'level', key: 'level', width: 90,
      render: (l: string) => {
        const info = levelMap[l];
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    { title: '来源', dataIndex: 'source', key: 'source', width: 140 },
    { title: '发现时间', dataIndex: 'time', key: 'time', width: 160 },
    {
      title: '处理状态', dataIndex: 'status', key: 'status', width: 100,
      render: (s: string) => {
        const info = statusMap[s];
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
  ];

  return (
    <div>
      {/* 数据来源导航提示条 */}
      <div style={{
        padding: '8px 16px', marginBottom: 16, background: '#6366f122', borderRadius: 8,
        display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #6366f144',
      }}>
        <LinkOutlined style={{ color: '#6366f1' }} />
        <span style={{ fontSize: 13, color: '#94a3b8' }}>数据来源：瞭望采集系统 →</span>
        <span
          onClick={() => navigate('/lookout')}
          style={{ fontSize: 13, color: '#6366f1', cursor: 'pointer', fontWeight: 500 }}
        >
          查看采集数据
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0, color: '#f1f5f9' }}>舆情分析</Title>
        <Segmented
          value={timeRange}
          onChange={v => setTimeRange(v as string)}
          options={['今日', '近3天', '近7天', '近30天']}
        />
      </div>

      {/* 概览卡片 */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        {overviewCards.map(c => (
          <Col span={6} key={c.title}>
            <Card style={{ background: '#0f172a', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Text style={{ color: '#94a3b8', fontSize: 13 }}>{c.title}</Text>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#f1f5f9', lineHeight: 1.3 }}>
                    {c.value}
                    {c.blink && <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', marginLeft: 8, animation: 'blink 1s infinite' }} />}
                  </div>
                  {c.trend && (
                    <Text style={{ color: c.up ? '#10b981' : '#ef4444', fontSize: 12 }}>
                      {c.up ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {c.trend}
                    </Text>
                  )}
                </div>
                <div style={{ fontSize: 28, color: c.color, opacity: 0.6 }}>{c.icon}</div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 中部双列：趋势图 + 饼图 */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={14}>
          <Card title="情感分布趋势（7天）" style={{ background: '#0f172a', border: '1px solid #334155' }}>
            <MiniLineChart data={trendData} />
          </Card>
        </Col>
        <Col span={10}>
          <Card title="情感占比分布" style={{ background: '#0f172a', border: '1px solid #334155', height: '100%' }}>
            <PieChart />
          </Card>
        </Col>
      </Row>

      {/* 热点话题词云 */}
      <Card title="热点话题" style={{ background: '#0f172a', border: '1px solid #334155', marginBottom: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', padding: '8px 0' }}>
          {hotTopics.map((topic, i) => (
            <span key={i} style={{
              fontSize: topic.size, color: topic.color, fontWeight: 600, padding: '2px 8px',
              cursor: 'pointer', transition: 'transform 0.2s', borderRadius: 4,
              background: topic.color + '11',
            }}>
              {topic.text}
            </span>
          ))}
        </div>
      </Card>

      {/* 风险预警列表 */}
      <Card title={<Space><AlertOutlined style={{ color: '#f59e0b' }} /> 风险预警</Space>}
        style={{ background: '#0f172a', border: '1px solid #334155', marginBottom: 20 }}>
        <Table columns={alertColumns} dataSource={alertData} pagination={false} size="middle" />
      </Card>

      {/* 最新舆情文章 */}
      <Card
        title="最新舆情文章"
        style={{ background: '#0f172a', border: '1px solid #334155' }}
        extra={
          <Select
            value={dataSource}
            onChange={setDataSource}
            style={{ width: 180 }}
            size="small"
            options={[
              { value: 'all', label: '全部来源' },
              { value: 'baidu', label: '瞭望采集-百度新闻' },
              { value: 'sogou', label: '瞭望采集-搜狗微信' },
              { value: 'rss', label: 'RSS订阅' },
            ]}
          />
        }
      >
        {articles.map(a => (
          <div key={a.key} style={{ padding: '12px 0', borderBottom: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text strong style={{ color: '#f1f5f9', fontSize: 14 }}>{a.title}</Text>
              <Space>
                <Tag color={sentimentColorMap[a.sentiment].color}>{sentimentColorMap[a.sentiment].text}</Tag>
                <Text style={{ color: '#64748b', fontSize: 12 }}><ClockCircleOutlined /> {a.time}</Text>
              </Space>
            </div>
            <Text style={{ color: '#94a3b8', fontSize: 13 }}>{a.summary}</Text>
            <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: '#64748b', fontSize: 12 }}>来源：{a.source}</Text>
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => message.info('跳转到瞭望采集-数据仓库')}
                style={{ color: '#6366f1', fontSize: 12 }}
              >
                查看原文
              </Button>
            </div>
          </div>
        ))}
      </Card>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </div>
  );
};

export default SentimentAnalysis;
