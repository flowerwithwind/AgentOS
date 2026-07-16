import { useState, useEffect } from "react";
import {
  Button, Table, Switch, Tag, Modal, Input, message, Tooltip, Spin,
} from "antd";
import {
  PlusOutlined, DeleteOutlined, KeyOutlined,
  ThunderboltOutlined, CalendarOutlined, CheckCircleFilled,
} from "@ant-design/icons";
import { getApiTokens, createApiToken, deleteApiToken } from "../services/system";

const statCardS = { background: "#1e293b", borderRadius: 12, border: "1px solid #334155", padding: 20, flex: 1 };
const statValueS = { fontSize: 28, fontWeight: 700, color: "#f1f5f9", marginTop: 8 };
const statLabelS = { fontSize: 13, color: "#64748b" };

const ApiTokenManagement = () => {
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [tokenName, setTokenName] = useState("");
  const [newTokenKey, setNewTokenKey] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchTokens = async () => {
    try {
      var res = await getApiTokens({ page: 1, pageSize: 20 });
      setTokens(res.items || []);
    } catch(e) {
      console.error("Fetch tokens failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTokens(); }, []);

  const handleCreate = async function() {
    if (!tokenName.trim()) { message.warning("请输入Token名称"); return; }
    setSaving(true);
    try {
      var res = await createApiToken({ name: tokenName });
      setNewTokenKey(res.apiKey || "创建成功");
      message.success("Token 已创建");
    } catch(e) {
      message.error("创建失败");
    } finally {
      setSaving(false);
    }
  };

  const deleteT = async function(id) {
    try {
      await deleteApiToken(id);
      message.success("Token 已删除");
      fetchTokens();
    } catch(e) {
      message.error("删除失败");
    }
  };

  if (loading) return <div style={{ textAlign: "center", padding: 80 }}><Spin size="large" /></div>;

  var activeTokens = tokens.filter(function(t) { return t.status === 1 || t.status === undefined; });
  var totalCalls = tokens.reduce(function(s, t) { return s + (t.callCount || 0); }, 0);

  const columns = [
    { title: "Token名称", dataIndex: "name", key: "name", render: function(v) { return <span style={{ fontWeight: 500, color: "#f1f5f9" }}>{v}</span>; }},
    { title: "Token值", dataIndex: "apiKey", key: "apiKey", render: function(v) { return <code style={{ background: "#0f172a", padding: "2px 8px", borderRadius: 4, color: "#94a3b8", fontSize: 12 }}>{v ? v.slice(0, 8)+"..." : "-"}</code>; }},
    { title: "状态", dataIndex: "status", key: "status", render: function(v) { return <Switch checked={v === 1 || v === undefined} size="small" />; }},
    { title: "创建时间", dataIndex: "createAt", key: "createAt", render: function(v) { return <span style={{ color: "#64748b", fontSize: 13 }}>{v || "-"}</span>; }},
    { title: "调用次数", dataIndex: "callCount", key: "callCount", render: function(v) { return <span style={{ color: "#94a3b8" }}>{(v || 0).toLocaleString()}</span>; }},
    { title: "操作", key: "action", render: function(_, r) { return (
      <Tooltip title="删除"><Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={function() { deleteT(r.id); }} /></Tooltip>
    );}},
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div />
        <Button type="primary" icon={<PlusOutlined />} onClick={function() { setCreateModalOpen(true); setNewTokenKey(""); setTokenName(""); }}
          style={{ background: "#6366f1", border: "none", borderRadius: 8 }}>创建Token</Button>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <div key="active" style={statCardS}>
          <span style={{ fontSize: 20, color: "#6366f1" }}><KeyOutlined /></span>
          <div style={statLabelS}>活跃Token数</div>
          <div style={statValueS}>{activeTokens.length}</div>
        </div>
        <div key="today" style={statCardS}>
          <span style={{ fontSize: 20, color: "#10b981" }}><ThunderboltOutlined /></span>
          <div style={statLabelS}>今日API调用</div>
          <div style={statValueS}>-</div>
        </div>
        <div key="total" style={statCardS}>
          <span style={{ fontSize: 20, color: "#3b82f6" }}><CalendarOutlined /></span>
          <div style={statLabelS}>总调用次数</div>
          <div style={statValueS}>{totalCalls.toLocaleString()}</div>
        </div>
      </div>

      <div style={{ background: "#1e293b", borderRadius: 12, border: "1px solid #334155", padding: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#f1f5f9", marginBottom: 16 }}>Token 列表</div>
        <Table dataSource={tokens} columns={columns} rowKey="id" pagination={false} size="small" />
      </div>

      <Modal title={<span style={{ color: "#f1f5f9" }}>创建 API Token</span>}
        open={createModalOpen}
        onCancel={function() { setCreateModalOpen(false); setNewTokenKey(""); }}
        footer={newTokenKey ? (
          <Button type="primary" icon={<CheckCircleFilled />} onClick={function() { setCreateModalOpen(false); setNewTokenKey(""); }}
            style={{ background: "#6366f1", border: "none", borderRadius: 8 }}>关闭</Button>
        ) : (
          <>
            <Button onClick={function() { setCreateModalOpen(false); }} style={{ borderColor: "#334155", color: "#94a3b8" }}>取消</Button>
            <Button type="primary" onClick={handleCreate} loading={saving} style={{ background: "#6366f1", border: "none" }}>创建</Button>
          </>
        )}>
        {!newTokenKey ? (
          <div>
            <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 4 }}>Token 名称</div>
            <Input placeholder="如 生产环境Token" value={tokenName} onChange={function(e) { setTokenName(e.target.value); }} />
          </div>
        ) : (
          <div style={{ background: "#0f172a", borderRadius: 8, border: "1px solid #334155", padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <CheckCircleFilled style={{ color: "#10b981", fontSize: 18 }} />
              <span style={{ color: "#10b981", fontWeight: 600 }}>Token 创建成功！</span>
            </div>
            <div style={{ fontSize: 13, color: "#f59e0b", marginBottom: 12 }}>
              请立即复制并安全保存此 Token，关闭后将无法再次查看！
            </div>
            <code style={{ display: "block", background: "#1e293b", padding: "8px 12px", borderRadius: 6, color: "#f1f5f9", fontSize: 13, wordBreak: "break-all", border: "1px solid #334155" }}>
              {newTokenKey}
            </code>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ApiTokenManagement;