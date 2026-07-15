import { useState, useEffect } from "react";
import {
  Avatar, Button, Modal, Input, Select, Switch, Tag, message, Tooltip, Spin,
} from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
  UserOutlined, SafetyOutlined,
} from "@ant-design/icons";
import { getUsers, createUser, updateUser, deleteUser } from "../services/system";

const avatarColors = { 超级管理员: "#6366f1", 普通用户: "#3b82f6" };
const roleColors = { 超级管理员: { bg: "#6366f122", color: "#6366f1" }, 普通用户: { bg: "#3b82f622", color: "#3b82f6" } };
const statusColors = { 正常: { bg: "#10b98122", color: "#10b981" }, 禁用: { bg: "#ef444422", color: "#ef4444" } };
const PAGE_SIZE = 10;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formUsername, setFormUsername] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState("普通用户");
  const [formStatus, setFormStatus] = useState(true);
  const [saving, setSaving] = useState(false);

  const roleIdMap = { "超级管理员": 1, "普通用户": 2 };
  const roleNameMap = { 1: "超级管理员", 2: "普通用户" };

  const fetchUsers = async () => {
    try {
      const res = await getUsers({ page, pageSize: PAGE_SIZE });
      setUsers(res.items || []);
      setTotalCount(res.total || 0);
    } catch(e) {
      console.error("Fetch users failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [page]);

  const filtered = users.filter(function(u) {
    if (searchText && u.username.indexOf(searchText) < 0) return false;
    if (roleFilter !== "all" && roleFilter !== u.roleName) return false;
    return true;
  });

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const openCreate = function() {
    setEditingId(null);
    setFormUsername(""); setFormEmail(""); setFormPassword("");
    setFormRole("普通用户"); setFormStatus(true);
    setModalOpen(true);
  };

  const openEdit = function(u) {
    setEditingId(u.id);
    setFormUsername(u.username); setFormEmail(""); setFormPassword("");
    setFormRole(u.roleName); setFormStatus(true);
    setModalOpen(true);
  };

  const handleSave = async function() {
    if (!formUsername.trim()) { message.warning("请输入用户名"); return; }
    if (!editingId && !formPassword.trim()) { message.warning("请输入密码"); return; }
    setSaving(true);
    try {
      if (editingId) {
        await updateUser(editingId, {
          username: formUsername,
          password: formPassword || undefined,
          roleId: roleIdMap[formRole] || 2,
        });
        message.success("编辑成功");
      } else {
        await createUser({
          username: formUsername,
          password: formPassword,
          roleId: roleIdMap[formRole] || 2,
        });
        message.success("创建成功");
      }
      setModalOpen(false);
      fetchUsers();
    } catch(e) {
      message.error("操作失败");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = function(id) {
    Modal.confirm({
      title: "确认删除", content: "删除用户后无法恢复，确定要删除吗？",
      okText: "删除", okType: "danger", cancelText: "取消",
      onOk: async function() {
        try {
          await deleteUser(id);
          message.success("已删除");
          fetchUsers();
        } catch(e) { message.error("删除失败"); }
      },
    });
  };

  const toggleStatus = async function(id, currentRoleId) {
    try {
      await updateUser(id, { username: "update", roleId: currentRoleId === 1 ? 2 : 1, password: undefined });
      fetchUsers();
    } catch(e) { message.error("操作失败"); }
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: 80 }}><Spin size="large" /></div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Input
            prefix={<SearchOutlined style={{ color: "#64748b" }} />}
            placeholder="搜索用户名..." value={searchText}
            onChange={function(e) { setSearchText(e.target.value); setPage(1); }}
            style={{ width: 260, borderRadius: 8, background: "#0f172a", border: "1px solid #334155" }}
            allowClear
          />
          <Select
            value={roleFilter} onChange={function(v) { setRoleFilter(v); setPage(1); }}
            style={{ width: 140 }}
            options={[
              { label: "全部角色", value: "all" },
              { label: "超级管理员", value: "超级管理员" },
              { label: "普通用户", value: "普通用户" },
            ]}
          />
        </div>
        <Button type="primary" icon={<PlusOutlined />} style={{ borderRadius: 8, background: "#6366f1", border: "none" }} onClick={openCreate}>
          创建用户
        </Button>
      </div>

      <div style={{ background: "#0f172a", borderRadius: 12, border: "1px solid #334155", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", color: "#f1f5f9", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #334155" }}>
              {["用户", "邮箱", "角色", "状态", "注册时间", "最后登录", "操作"].map(function(h) { return (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#94a3b8", fontWeight: 500, fontSize: 12 }}>{h}</th>
              );})}
            </tr>
          </thead>
          <tbody>
            {filtered.map(function(u) {
              var displayRole = u.roleName || "普通用户";
              var avatarLetter = u.username.charAt(0).toUpperCase();
              return (
              <tr key={u.id} style={{ borderBottom: "1px solid #334155" }}>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar style={{ background: avatarColors[displayRole] || "#6366f1" }} size={32}>
                      {avatarLetter}
                    </Avatar>
                    <span style={{ fontWeight: 500 }}>{u.username}</span>
                  </div>
                </td>
                <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{u.email || "-"}</td>
                <td style={{ padding: "12px 16px" }}>
                  <Tag style={{ background: roleColors[displayRole]?.bg, color: roleColors[displayRole]?.color, border: "none", borderRadius: 4, fontSize: 12 }}>
                    {displayRole === "超级管理员" && <SafetyOutlined style={{ marginRight: 4 }} />}
                    {displayRole}
                  </Tag>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <Tag style={{ background: "#10b98122", color: "#10b981", border: "none", borderRadius: 4, fontSize: 12 }}>正常</Tag>
                </td>
                <td style={{ padding: "12px 16px", color: "#94a3b8", fontSize: 12 }}>{u.createAt || "-"}</td>
                <td style={{ padding: "12px 16px", color: "#94a3b8", fontSize: 12 }}>-</td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    <Tooltip title="编辑">
                      <Button size="small" icon={<EditOutlined />} style={{ borderRadius: 6, borderColor: "#334155", color: "#94a3b8" }} onClick={function() { openEdit(u); }} />
                    </Tooltip>
                    <Tooltip title="删除">
                      <Button size="small" icon={<DeleteOutlined />} style={{ borderRadius: 6, borderColor: "#334155", color: "#ef4444" }} onClick={function() { handleDelete(u.id); }} />
                    </Tooltip>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #334155" }}>
          <span style={{ fontSize: 12, color: "#64748b" }}>共 {totalCount} 条记录</span>
          <div style={{ display: "flex", gap: 4 }}>
            <Button size="small" disabled={page <= 1} onClick={function() { setPage(function(p) { return p - 1; }); }} style={{ borderRadius: 6, borderColor: "#334155", color: "#94a3b8" }}>上一页</Button>
            {Array.from({ length: Math.min(totalPages, 10) }, function(_, i) { return i + 1; }).map(function(p) { return (
              <Button key={p} size="small"
                style={{ borderRadius: 6, minWidth: 32, borderColor: page === p ? "#6366f1" : "#334155", color: page === p ? "#6366f1" : "#94a3b8", background: page === p ? "#6366f122" : "transparent" }}
                onClick={function() { setPage(p); }}>{p}</Button>
            );})}
            <Button size="small" disabled={page >= totalPages} onClick={function() { setPage(function(p) { return p + 1; }); }} style={{ borderRadius: 6, borderColor: "#334155", color: "#94a3b8" }}>下一页</Button>
          </div>
        </div>
      </div>

      <Modal title={editingId ? "编辑用户" : "创建用户"}
        open={modalOpen} onCancel={function() { setModalOpen(false); }}
        onOk={handleSave} confirmLoading={saving} okText="保存" cancelText="取消" width={480}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>用户名 *</div>
            <Input value={formUsername} onChange={function(e) { setFormUsername(e.target.value); }}
              placeholder="请输入用户名" prefix={<UserOutlined style={{ color: "#64748b" }} />}
              style={{ borderRadius: 8, background: "#0f172a", border: "1px solid #334155", color: "#f1f5f9" }} />
          </div>
          {!editingId && (
            <div>
              <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>密码 *</div>
              <Input.Password value={formPassword} onChange={function(e) { setFormPassword(e.target.value); }}
                placeholder="请输入密码（至少6位）"
                style={{ borderRadius: 8, background: "#0f172a", border: "1px solid #334155", color: "#f1f5f9" }} />
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>角色</div>
              <Select value={formRole} onChange={setFormRole} style={{ width: "100%" }}
                options={[{ label: "超级管理员", value: "超级管理员" }, { label: "普通用户", value: "普通用户" }]} />
            </div>
            <div>
              <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>状态</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, height: 32 }}>
                <Switch checked={formStatus} onChange={setFormStatus} style={{ background: formStatus ? "#10b981" : "#334155" }} />
                <span style={{ fontSize: 13, color: formStatus ? "#10b981" : "#ef4444" }}>{formStatus ? "正常" : "禁用"}</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;