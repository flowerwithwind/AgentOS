import { useState } from 'react';
import { Form, Input, Slider, Button, Modal, Upload, message, Tag, InputNumber } from 'antd';
import {
  SettingOutlined, BugOutlined, SafetyOutlined,
  DatabaseOutlined, InfoCircleOutlined, SaveOutlined,
  UndoOutlined, InboxOutlined,
} from '@ant-design/icons';

const { TextArea } = Input;

const tabs = [
  { key: 'basic', label: '基础设置', icon: <SettingOutlined /> },
  { key: 'collect', label: '采集参数', icon: <BugOutlined /> },
  { key: 'security', label: '安全设置', icon: <SafetyOutlined /> },
  { key: 'data', label: '数据管理', icon: <DatabaseOutlined /> },
  { key: 'about', label: '关于系统', icon: <InfoCircleOutlined /> },
];

const presetColors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const FormRow = ({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ fontSize: 14, fontWeight: 500, color: '#f1f5f9', marginBottom: 4 }}>{label}</div>
    {desc && <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>{desc}</div>}
    {children}
  </div>
);

const SectionTitle = ({ title, desc }: { title: string; desc?: string }) => (
  <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #334155' }}>
    <div style={{ fontSize: 18, fontWeight: 600, color: '#f1f5f9' }}>{title}</div>
    {desc && <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{desc}</div>}
  </div>
);

const Settings = () => {
  const [activeTab, setActiveTab] = useState('basic');
  const [form] = Form.useForm();
  const [themeColor, setThemeColor] = useState('#6366f1');
  const [retainDays, setRetainDays] = useState(90);
  const [cleanModalOpen, setCleanModalOpen] = useState(false);

  const handleSave = () => {
    message.success('设置已保存');
  };

  const handleReset = () => {
    form.resetFields();
    setThemeColor('#6366f1');
    setRetainDays(90);
    message.info('已重置为默认值');
  };

  const renderPanel = () => {
    switch (activeTab) {
      case 'basic':
        return (
          <div>
            <SectionTitle title="基础设置" desc="配置站点基本信息和外观" />
            <FormRow label="站点名称" desc="显示在页面标题和侧边栏中的名称">
              <Input defaultValue="XHAgentOS" style={{ maxWidth: 400 }} />
            </FormRow>
            <FormRow label="站点描述" desc="简短描述站点的用途和功能">
              <TextArea defaultValue="基于AI的智能瞭望与智能问数系统" rows={3} style={{ maxWidth: 500 }} />
            </FormRow>
            <FormRow label="主题色" desc="选择系统的主色调">
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                {presetColors.map(c => (
                  <div
                    key={c}
                    onClick={() => setThemeColor(c)}
                    style={{
                      width: 36, height: 36, borderRadius: 8, background: c, cursor: 'pointer',
                      border: themeColor === c ? '3px solid #f1f5f9' : '3px solid transparent',
                      transition: 'border-color 0.2s',
                    }}
                  />
                ))}
                <Input type="color" value={themeColor} onChange={e => setThemeColor(e.target.value)} style={{ width: 60, height: 36, padding: 2, cursor: 'pointer' }} />
              </div>
            </FormRow>
            <FormRow label="Logo 上传" desc="建议尺寸 200x60px，支持 PNG/SVG 格式">
              <Upload.Dragger
                accept="image/*"
                maxCount={1}
                beforeUpload={() => { message.success('Logo 已上传（模拟）'); return false; }}
                style={{ maxWidth: 400, background: '#0f172a', borderColor: '#334155' }}
              >
                <p style={{ color: '#64748b', fontSize: 40, marginBottom: 8 }}><InboxOutlined /></p>
                <p style={{ color: '#94a3b8' }}>点击或拖拽文件到此处上传</p>
              </Upload.Dragger>
            </FormRow>
          </div>
        );

      case 'collect':
        return (
          <div>
            <SectionTitle title="采集参数" desc="配置数据采集的相关策略" />
            <FormRow label="最大采集页数" desc="单次采集任务的最大翻页数">
              <InputNumber defaultValue={50} min={1} max={200} style={{ width: 150 }} addonAfter="页" />
            </FormRow>
            <FormRow label="请求间隔" desc="两次请求之间的等待时间，避免被反爬">
              <InputNumber defaultValue={1000} min={100} max={10000} step={100} style={{ width: 180 }} addonAfter="ms" />
            </FormRow>
            <FormRow label="User-Agent" desc="自定义请求头中的 User-Agent 字段">
              <Input defaultValue="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" style={{ maxWidth: 600 }} />
            </FormRow>
            <FormRow label="代理设置" desc="HTTP 代理地址，留空则不使用代理">
              <Input placeholder="http://proxy:8080" style={{ maxWidth: 400 }} />
            </FormRow>
          </div>
        );

      case 'security':
        return (
          <div>
            <SectionTitle title="安全设置" desc="配置系统安全策略" />
            <FormRow label="Cookie 过期时间" desc="用户登录后 Cookie 的有效期">
              <InputNumber defaultValue={24} min={1} max={720} style={{ width: 150 }} addonAfter="小时" />
            </FormRow>
            <FormRow label="密码最小长度" desc="用户注册时密码的最小长度要求">
              <InputNumber defaultValue={6} min={4} max={20} style={{ width: 150 }} addonAfter="位" />
            </FormRow>
            <FormRow label="登录失败锁定次数" desc="连续登录失败多少次后锁定账号">
              <InputNumber defaultValue={5} min={3} max={20} style={{ width: 150 }} addonAfter="次" />
            </FormRow>
            <FormRow label="IP 白名单" desc="仅允许以下 IP 访问管理后台，留空表示不限制">
              <TextArea placeholder="每行一个 IP 地址，例如：&#10;192.168.1.0/24&#10;10.0.0.1" rows={4} style={{ maxWidth: 400 }} />
            </FormRow>
          </div>
        );

      case 'data':
        return (
          <div>
            <SectionTitle title="数据管理" desc="管理数据存储和清理策略" />
            <FormRow label="数据保留天数" desc={`当前设置：保留最近 ${retainDays} 天的数据`}>
              <Slider min={7} max={365} value={retainDays} onChange={setRetainDays} style={{ maxWidth: 400 }} marks={{ 7: '7天', 90: '90天', 180: '半年', 365: '1年' }} />
            </FormRow>
            <FormRow label="数据库大小" desc="当前数据库占用的存储空间">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 200, height: 10, background: '#334155', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ width: '28%', height: '100%', background: '#10b981', borderRadius: 5 }} />
                </div>
                <span style={{ fontSize: 14, color: '#f1f5f9' }}>1.8 GB / 6.4 GB</span>
              </div>
            </FormRow>
            <FormRow label="数据清理" desc="清除过期数据和缓存">
              <div style={{ display: 'flex', gap: 12 }}>
                <Button danger onClick={() => setCleanModalOpen(true)}>一键清理过期数据</Button>
                <Button icon={<DatabaseOutlined />}>导出全部数据</Button>
              </div>
            </FormRow>
            <Modal
              title="确认清理"
              open={cleanModalOpen}
              onOk={() => { setCleanModalOpen(false); message.success('清理完成'); }}
              onCancel={() => setCleanModalOpen(false)}
              okText="确认清理"
              cancelText="取消"
              okButtonProps={{ danger: true }}
            >
              <p style={{ color: '#f1f5f9' }}>确定要清理所有过期数据吗？此操作不可恢复。</p>
              <p style={{ color: '#64748b', fontSize: 13 }}>预计将清理 {retainDays} 天前的对话记录、采集数据和日志文件。</p>
            </Modal>
          </div>
        );

      case 'about':
        return (
          <div>
            <SectionTitle title="关于系统" desc="XHAgentOS 版本与技术信息" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 600 }}>
              {[
                { label: '系统版本', value: 'v2.1.0' },
                { label: '运行时间', value: '12天 8小时 32分' },
                { label: '后端框架', value: 'Tornado 6.4' },
                { label: '前端框架', value: 'React 19 + Ant Design 6' },
                { label: '数据库', value: 'SQLite / MySQL 8.0' },
                { label: 'Python 版本', value: '3.12.1' },
                { label: '许可证', value: 'MIT License' },
                { label: '团队', value: '西华 Vibe Coding 团队' },
              ].map((item, i) => (
                <div key={i} style={{ padding: '14px 16px', background: '#0f172a', borderRadius: 8, border: '1px solid #334155' }}>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 14, color: '#f1f5f9', fontWeight: 500 }}>{item.value}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 24, padding: '16px 20px', background: '#0f172a', borderRadius: 8, border: '1px solid #334155', maxWidth: 600 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#f1f5f9', marginBottom: 8 }}>技术栈信息</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['Python', 'Tornado', 'React', 'TypeScript', 'Ant Design', 'SQLite', 'jieba', 'OpenAI API', 'requests'].map(t => (
                  <Tag key={t} style={{ background: '#334155', border: 'none', color: '#94a3b8', borderRadius: 4 }}>{t}</Tag>
                ))}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 130px)', margin: -24, borderRadius: 12, overflow: 'hidden' }}>
      {/* 左侧导航 */}
      <div style={{
        width: 200, background: '#0f172a', borderRight: '1px solid #334155',
        padding: '16px 8px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        <div style={{ padding: '8px 12px', marginBottom: 8, fontSize: 16, fontWeight: 600, color: '#f1f5f9' }}>
          系统设置
        </div>
        {tabs.map(tab => (
          <div
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 10,
              background: activeTab === tab.key ? '#1e293b' : 'transparent',
              color: activeTab === tab.key ? '#f1f5f9' : '#94a3b8',
              fontWeight: activeTab === tab.key ? 500 : 400,
              transition: 'all 0.15s',
              fontSize: 14,
            }}
            onMouseEnter={e => { if (activeTab !== tab.key) (e.currentTarget as HTMLDivElement).style.background = '#1e293b88'; }}
            onMouseLeave={e => { if (activeTab !== tab.key) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
          >
            <span style={{ fontSize: 16 }}>{tab.icon}</span>
            {tab.label}
          </div>
        ))}
      </div>

      {/* 右侧内容 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 32, background: '#1e293b' }}>
        <Form form={form} layout="vertical">
          {renderPanel()}
        </Form>

        {activeTab !== 'about' && (
          <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid #334155', display: 'flex', gap: 12 }}>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} style={{ borderRadius: 8, background: '#6366f1', border: 'none' }}>
              保存更改
            </Button>
            <Button icon={<UndoOutlined />} onClick={handleReset} style={{ borderRadius: 8, borderColor: '#334155', color: '#94a3b8' }}>
              重置
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
