import { useState, useEffect } from "react";
import {
  Avatar, Button, Input, Select, Drawer, Tag, message, Tooltip, Spin,
} from "antd";
import {
  SearchOutlined, EyeOutlined, DeleteOutlined, RobotOutlined, UserOutlined, ClockCircleOutlined,
} from "@ant-design/icons";
import { getSessions, getSessionMessages, deleteSession } from "../services/system";

const statusColor = { 活跃: { bg: "#10b98122", color: "#10b981" }, 已结束: { bg: "#64748b22", color: "#64748b" } };
const PAGE_SIZE = 10;

const SessionManagement = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeMessages, setActiveMessages] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [msgLoading, setMsgLoading] = useState(false);

  const fetchSessions = async () => {
    try {
      var params: any = { page: page, pageSize: PAGE_SIZE };
      if (userSearch) params.keyword = userSearch;
      var res = await getSessions(params);
      setSessions(res.items || []);
      setTotal(res.total || 0);
    } catch(e) {
      console.error("Fetch sessions failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, [page]);

  const viewMessages = async function(session) {
    setActiveSession(session);
    setDrawerOpen(true);
    setMsgLoading(true);
    try {
      var res = await getSessionMessages(session.id);
      setActiveMessages(res.messages || []);
    } catch(e) {
      setActiveMessages([]);
    } finally {
      setMsgLoading(false);
    }
  };

  const handleDelete = async function(id) {
    try {
      await deleteSession(id);
      message.success("会话已删除");
      fetchSessions();
    } catch(e) {
      message.error("删除失败");
    }
  };

  if (loading) return <div style={{ textAlign: "center", padding: 80 }}><Spin size="large" /></div>;

  var totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <Input prefix={<SearchOutlined style={{ color: "#64748b" }} />} placeholder="搜索用户名..." value={userSearch}
          onChange={function(e) { setUserSearch(e.target.value); setPage(1); }}
          style={{ width: 200, borderRadius: 8, background: "#0f172a", border: "1px solid #334155" }} allowClear />
      </div>

      <div style={{ background: "#0f172a", borderRadius: 12, border: "1px solid #334155", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", color: "#f1f5f9", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #334155" }}>
              {["会话ID", "用户", "标题", "消息数", "开始时间", "状态", "操作"].map(function(h) { return (
                <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: "#94a3b8", fontWeight: 500, fontSize: 12 }}>{h}</th>
              );})}
            </tr>
          </thead>
          <tbody>
            {sessions.map(function(s) {
              var st = s.endTime && s.endTime !== "-" ? "已结束" : "活跃";
              return (
              <tr key={s.id} style={{ borderBottom: "1px solid #334155" }}>
                <td style={{ padding: "12px 14px", fontFamily: "monospace", fontSize: 12, color: "#94a3b8" }}>
                  <Tooltip title={s.id}>{String(s.id).slice(0, 10)}...</Tooltip>
                </td>
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Avatar style={{ background: "#3b82f6" }} size={24}><UserOutlined /></Avatar>
                    <span>{s.username || "-"}</span>
                  </div>
                </td>
                <td style={{ padding: "12px 14px", color: "#94a3b8" }}>{s.title || "-"}</td>
                <td style={{ padding: "12px 14px", color: "#94a3b8" }}>{s.messageCount || s.message_count || 0}</td>
                <td style={{ padding: "12px 14px", color: "#64748b", fontSize: 12 }}>
                  <ClockCircleOutlined style={{ marginRight: 4, color: "#64748b" }} />{s.createdAt || s.startTime || "-"}
                </td>
                <td style={{ padding: "12px 14px" }}>
                  <Tag style={{ background: statusColor[st]?.bg, color: statusColor[st]?.color, border: "none", borderRadius: 4, fontSize: 12 }}>{st}</Tag>
                </td>
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    <Tooltip title="查看消息">
                      <Button size="small" icon={<EyeOutlined />} style={{ borderRadius: 6, borderColor: "#334155", color: "#6366f1" }} onClick={function() { viewMessages(s); }} />
                    </Tooltip>
                    <Tooltip title="删除">
                      <Button size="small" icon={<DeleteOutlined />} style={{ borderRadius: 6, borderColor: "#334155", color: "#ef4444" }} onClick={function() { handleDelete(s.id); }} />
                    </Tooltip>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #334155" }}>
          <span style={{ fontSize: 12, color: "#64748b" }}>共 {total} 条记录</span>
          <div style={{ display: "flex", gap: 4 }}>
            <Button size="small" disabled={page <= 1} onClick={function() { setPage(function(p) { return p - 1; }); }} style={{ borderRadius: 6, borderColor: "#334155", color: "#94a3b8" }}>上一页</Button>
            {Array.from({ length: Math.min(totalPages, 10) }, function(_, i) { return i + 1; }).map(function(p) { return (
              <Button key={p} size="small" style={{ borderRadius: 6, minWidth: 32, borderColor: page === p ? "#6366f1" : "#334155", color: page === p ? "#6366f1" : "#94a3b8", background: page === p ? "#6366f122" : "transparent" }} onClick={function() { setPage(p); }}>{p}</Button>
            );})}
            <Button size="small" disabled={page >= totalPages} onClick={function() { setPage(function(p) { return p + 1; }); }} style={{ borderRadius: 6, borderColor: "#334155", color: "#94a3b8" }}>下一页</Button>
          </div>
        </div>
      </div>

      <Drawer title={activeSession ? "会话消息 - " + (activeSession.username || "") : "会话消息"}
        open={drawerOpen} onClose={function() { setDrawerOpen(false); }}
        width={480} styles={{ body: { background: "#0f172a", padding: 0 }, header: { background: "#1e293b", borderBottom: "1px solid #334155" } }}>
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16, height: "100%", overflowY: "auto" }}>
          {msgLoading ? <div style={{ textAlign: "center", padding: 40 }}><Spin /></div> : activeMessages.length === 0 ? (
            <div style={{ textAlign: "center", color: "#64748b", padding: 40 }}>暂无消息</div>
          ) : activeMessages.map(function(msg, i) {
            var isUser = msg.role === "user";
            return (
            <div key={i} style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
              {!isUser && <Avatar style={{ background: "#6366f1", marginRight: 8, flexShrink: 0, marginTop: 4 }} icon={<RobotOutlined />} size={32} />}
              <div style={{ maxWidth: "75%" }}>
                <div style={{ padding: "10px 14px", borderRadius: 12, fontSize: 13, lineHeight: 1.6, background: isUser ? "#6366f1" : "#1e293b", border: !isUser ? "1px solid #334155" : "none", color: isUser ? "#fff" : "#e2e8f0", borderBottomRightRadius: isUser ? 4 : 12, borderBottomLeftRadius: !isUser ? 4 : 12 }}>
                  {msg.content}
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, textAlign: isUser ? "right" : "left" }}>{msg.time || msg.created_at || ""}</div>
              </div>
              {isUser && <Avatar style={{ background: "#3b82f6", marginLeft: 8, flexShrink: 0, marginTop: 4 }} size={32}><UserOutlined /></Avatar>}
            </div>
            );
          })}
        </div>
      </Drawer>
    </div>
  );
};

export default SessionManagement;