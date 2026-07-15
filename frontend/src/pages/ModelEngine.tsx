import { useState, useEffect } from "react";
import {
  Card, Row, Col, Tag, Button, Modal, Input, Select, Switch,
  Typography, Space, message, Tooltip, Pagination, Spin,
} from "antd";
import {
  PlusOutlined, DeleteOutlined, EditOutlined, SendOutlined,
  SearchOutlined, StarFilled, StarOutlined,
  CloudServerOutlined, ExperimentOutlined, ThunderboltOutlined,
  KeyOutlined,
} from "@ant-design/icons";
import { getModels, createModel, updateModel, deleteModel as deleteModelApi, setDefaultModel, testModel } from "../services/models";

const { Text, Title } = Typography;

const providerMap = {
  openai: { label: "OpenAI", color: "#10b981" },
  azure: { label: "Azure", color: "#3b82f6" },
  anthropic: { label: "Anthropic", color: "#8b5cf6" },
  DeepSeek: { label: "DeepSeek", color: "#6366f1" },
};

const ModelEngine = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [testInput, setTestInput] = useState("");
  const [testOutput, setTestOutput] = useState("");
  const [testing, setTesting] = useState(false);
  const [pageTotal, setPageTotal] = useState(0);
  const pageSize = 6;

  const [formName, setFormName] = useState("");
  const [formProvider, setFormProvider] = useState("openai");
  const [formApiKey, setFormApiKey] = useState("");
  const [formBaseUrl, setFormBaseUrl] = useState("https://api.deepseek.com/v1");
  const [formModelName, setFormModelName] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchModels = async () => {
    try {
      const res = await getModels({ page: currentPage, pageSize });
      setModels(res.items || []);
      setPageTotal(res.total || 0);
    } catch(e) {
      console.error("Fetch models failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchModels(); }, [currentPage]);

  const filteredModels = models.filter(function(m) {
    return m.name.toLowerCase().indexOf(searchText.toLowerCase()) >= 0 ||
      m.provider.toLowerCase().indexOf(searchText.toLowerCase()) >= 0;
  });

  const toggleEnable = async function(id, currentStatus) {
    try {
      await updateModel(id, { status: currentStatus === 1 ? 0 : 1 });
      message.success("状态已更新");
      fetchModels();
    } catch(e) {
      message.error("更新状态失败");
    }
  };

  const setDefault = async function(id) {
    try {
      await setDefaultModel(id);
      message.success("已设为默认模型");
      fetchModels();
    } catch(e) {
      message.error("设置默认模型失败");
    }
  };

  const deleteModelItem = async function(id) {
    try {
      await deleteModelApi(id);
      message.success("已删除模型");
      fetchModels();
    } catch(e) {
      message.error("删除模型失败");
    }
  };

  const handleTest = async function() {
    if (!testInput.trim()) return;
    setTesting(true);
    setTestOutput("");
    var enabledModels = models.filter(function(m) { return m.status === 1 || m.status === undefined; });
    if (enabledModels.length === 0) {
      message.warning("没有可用的测试模型");
      setTesting(false);
      return;
    }
    try {
      var res = await testModel({ modelId: enabledModels[0].id, message: testInput });
      setTestOutput(res.reply || "无响应");
      fetchModels();
    } catch(e) {
      setTestOutput("调用失败: " + (e.message || "未知错误"));
    } finally {
      setTesting(false);
    }
  };

  var totalTokens = models.reduce(function(s, m) { return s + (m.totalTokens || 0); }, 0);
  var totalCalls = models.reduce(function(s, m) { return s + (m.totalCalls || 0); }, 0);
  var defaultModel = models.find(function(m) { return m.isDefault; });

  const overviewCards = [
    { label: "已配置模型", value: models.length.toString(), icon: <CloudServerOutlined />, color: "#6366f1" },
    { label: "默认模型", value: defaultModel ? defaultModel.name : "-", icon: <StarFilled />, color: "#10b981" },
    { label: "今日 Token 消耗", value: totalTokens > 0 ? (totalTokens / 1000).toFixed(0) + "K" : "0", icon: <ThunderboltOutlined />, color: "#f59e0b" },
    { label: "总调用次数", value: totalCalls.toLocaleString(), icon: <ExperimentOutlined />, color: "#3b82f6" },
  ];

  const openCreateModal = function() {
    setEditingModel(null);
    setFormName(""); setFormProvider("openai"); setFormApiKey("");
    setFormBaseUrl("https://api.deepseek.com/v1"); setFormModelName("");
    setModalOpen(true);
  };

  const openEditModal = function(m) {
    setEditingModel(m);
    setFormName(m.name || ""); setFormProvider(m.provider || "openai"); setFormApiKey("");
    setFormBaseUrl(m.baseUrl || "https://api.deepseek.com/v1"); setFormModelName(m.modelName || "");
    setModalOpen(true);
  };

  const handleSave = async function() {
    if (!formName.trim()) { message.warning("请输入模型名称"); return; }
    if (!formModelName.trim()) { message.warning("请输入 Model Name"); return; }
    setSaving(true);
    try {
      if (editingModel) {
        await updateModel(editingModel.id, {
          name: formName, provider: formProvider,
          apiKey: formApiKey || undefined,
          baseUrl: formBaseUrl, modelName: formModelName,
        });
        message.success("模型已更新");
      } else {
        await createModel({
          name: formName, provider: formProvider,
          apiKey: formApiKey, baseUrl: formBaseUrl, modelName: formModelName,
        });
        message.success("模型已添加");
      }
      setModalOpen(false);
      fetchModels();
    } catch(e) {
      message.error("操作失败");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: 80 }}><Spin size="large" /></div>;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0, color: "#f1f5f9" }}>
          <CloudServerOutlined style={{ marginRight: 8 }} />模型引擎
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}
          style={{ background: "#6366f1", border: "none", borderRadius: 8 }}>添加模型</Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 20 }}>
        {overviewCards.map(function(c) { return (
          <Col span={6} key={c.label}>
            <Card style={{ background: "#0f172a", border: "1px solid #334155" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <Text style={{ color: "#94a3b8", fontSize: 13 }}>{c.label}</Text>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "#f1f5f9", lineHeight: 1.3, marginTop: 4 }}>{c.value}</div>
                </div>
                <div style={{ fontSize: 28, color: c.color, opacity: 0.6 }}>{c.icon}</div>
              </div>
            </Card>
          </Col>
        );})}
      </Row>

      <Card style={{ background: "#0f172a", border: "1px solid #334155", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: 600, color: "#f1f5f9" }}>模型列表</Text>
          <Input prefix={<SearchOutlined style={{ color: "#64748b" }} />} placeholder="搜索模型名称或供应商..."
            value={searchText} onChange={function(e) { setSearchText(e.target.value); setCurrentPage(1); }}
            style={{ width: 280, borderColor: "#334155", background: "#1e293b", color: "#f1f5f9" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16, marginBottom: 16 }}>
          {filteredModels.map(function(m) { return (
            <div key={m.id} style={{ background: "#1e293b", borderRadius: 12, border: "1px solid #334155", padding: 20, borderColor: m.isDefault ? "#6366f1" : "#334155" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <Space>
                    <Text strong style={{ color: "#f1f5f9", fontSize: 15 }}>{m.name}</Text>
                    {m.isDefault && <Tag color="#6366f1" style={{ fontSize: 11, margin: 0 }}>默认</Tag>}
                  </Space>
                  <div style={{ marginTop: 6, display: "flex", gap: 6, alignItems: "center" }}>
                    <Tag color={providerMap[m.provider]?.color || "#64748b"} style={{ fontSize: 11 }}>
                      {providerMap[m.provider]?.label || m.provider}
                    </Tag>
                    <Tag color="cyan" style={{ fontSize: 11 }}>{m.modelName}</Tag>
                  </div>
                </div>
                <Switch checked={m.status === 1 || m.status === undefined} size="small" onChange={function() { toggleEnable(m.id, m.status); }}
                  checkedChildren="开" unCheckedChildren="关" />
              </div>

              <div style={{ display: "flex", gap: 20, margin: "12px 0", padding: "10px 0", borderTop: "1px solid #334155", borderBottom: "1px solid #334155" }}>
                <div>
                  <Text style={{ color: "#64748b", fontSize: 11, display: "block" }}>调用次数</Text>
                  <Text style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 14 }}>{(m.totalCalls || 0).toLocaleString()}</Text>
                </div>
                <div>
                  <Text style={{ color: "#64748b", fontSize: 11, display: "block" }}>Token 消耗</Text>
                  <Text style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 14 }}>{((m.totalTokens || 0) / 1000).toFixed(0)}K</Text>
                </div>
              </div>

              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                {!m.isDefault && (m.status === 1 || m.status === undefined) && (
                  <Tooltip title="设为默认">
                    <Button size="small" icon={<StarOutlined />} onClick={function() { setDefault(m.id); }}
                      style={{ borderColor: "#334155", color: "#f59e0b" }}>默认</Button>
                  </Tooltip>
                )}
                <Tooltip title="测试对话">
                  <Button size="small" icon={<SendOutlined />} onClick={function() { setTestOutput(""); }}
                    style={{ borderColor: "#334155", color: "#6366f1" }}>测试</Button>
                </Tooltip>
                <Tooltip title="编辑">
                  <Button size="small" icon={<EditOutlined />} onClick={function() { openEditModal(m); }}
                    style={{ borderColor: "#334155", color: "#94a3b8" }} />
                </Tooltip>
                <Tooltip title="删除">
                  <Button size="small" icon={<DeleteOutlined />} danger onClick={function() { deleteModelItem(m.id); }} />
                </Tooltip>
              </div>
            </div>
          );})}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Pagination current={currentPage} pageSize={pageSize} total={pageTotal} onChange={setCurrentPage}
            showTotal={function(total) { return <Text style={{ color: "#94a3b8" }}>共 {total} 个模型</Text>; }} />
        </div>
      </Card>

      <Modal title={<span style={{ color: "#f1f5f9" }}>{editingModel ? "编辑模型" : "添加模型"}</span>}
        open={modalOpen} onCancel={function() { setModalOpen(false); }}
        onOk={handleSave} confirmLoading={saving} okText="保存" cancelText="取消">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <Text style={{ color: "#94a3b8", fontSize: 13, display: "block", marginBottom: 4 }}>模型名称</Text>
            <Input placeholder="如：DeepSeek Chat" value={formName} onChange={function(e) { setFormName(e.target.value); }} />
          </div>
          <div>
            <Text style={{ color: "#94a3b8", fontSize: 13, display: "block", marginBottom: 4 }}>供应商</Text>
            <Select value={formProvider} onChange={setFormProvider} style={{ width: "100%" }}
              options={[{ value: "openai", label: "OpenAI" }, { value: "azure", label: "Azure" }, { value: "anthropic", label: "Anthropic" }, { value: "DeepSeek", label: "DeepSeek" }]} />
          </div>
          <div>
            <Text style={{ color: "#94a3b8", fontSize: 13, display: "block", marginBottom: 4 }}>API Key</Text>
            <Input.Password placeholder={editingModel ? "留空则不修改" : "输入 API Key"} value={formApiKey}
              onChange={function(e) { setFormApiKey(e.target.value); }}
              prefix={<KeyOutlined style={{ color: "#64748b" }} />} />
          </div>
          <div>
            <Text style={{ color: "#94a3b8", fontSize: 13, display: "block", marginBottom: 4 }}>API Base URL</Text>
            <Input placeholder="https://api.example.com" value={formBaseUrl} onChange={function(e) { setFormBaseUrl(e.target.value); }} />
          </div>
          <div>
            <Text style={{ color: "#94a3b8", fontSize: 13, display: "block", marginBottom: 4 }}>模型名称 (Model Name)</Text>
            <Input placeholder="如：gpt-4o / deepseek-chat" value={formModelName} onChange={function(e) { setFormModelName(e.target.value); }} />
          </div>
        </div>
      </Modal>

      <Card title={<Space><SendOutlined style={{ color: "#6366f1" }} /> 模型测试</Space>}
        style={{ background: "#0f172a", border: "1px solid #334155" }}>
        <Row gutter={16}>
          <Col span={8}>
            <div style={{ marginBottom: 12 }}>
              <Text style={{ color: "#94a3b8", fontSize: 13, display: "block", marginBottom: 4 }}>选择模型</Text>
              <Select placeholder="选择测试模型" style={{ width: "100%" }}
                options={models.filter(function(m) { return m.status === 1 || m.status === undefined; }).map(function(m) { return { value: m.id, label: m.name }; })} />
            </div>
            <div>
              <Text style={{ color: "#94a3b8", fontSize: 13, display: "block", marginBottom: 4 }}>输入消息</Text>
              <Input.TextArea rows={4} placeholder="输入测试消息..."
                value={testInput} onChange={function(e) { setTestInput(e.target.value); }} />
            </div>
            <Button type="primary" icon={<SendOutlined />} loading={testing}
              onClick={handleTest} style={{ background: "#6366f1", border: "none", marginTop: 12, width: "100%" }}>
              发送</Button>
          </Col>
          <Col span={16}>
            <Text style={{ color: "#94a3b8", fontSize: 13, display: "block", marginBottom: 8 }}>回复</Text>
            <div style={{ background: "#1e293b", borderRadius: 8, border: "1px solid #334155", padding: 16, minHeight: 180 }}>
              {testing ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 148, color: "#64748b" }}>
                  <SendOutlined spin style={{ marginRight: 8 }} /> 模型响应中...</div>
              ) : testOutput ? (
                <div style={{ color: "#f1f5f9", fontSize: 14, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{testOutput}</div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 148, color: "#64748b" }}>
                  <Text style={{ color: "#64748b" }}>发送消息后将在此处显示模型回复</Text></div>
              )}
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default ModelEngine;