import { useState, useEffect } from "react";
import { Button, Modal, Input, message, Tree, Tag, Spin } from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  CheckCircleFilled, UserOutlined, TeamOutlined,
} from "@ant-design/icons";
import { getRoles, createRole, deleteRole, getPermissionRoles, getPermissionFunctions, savePermission } from "../services/system";

const treeData = [
  { title: "数据总览", key: "overview", children: [{ title: "仪表盘", key: "dashboard" }, { title: "数智大屏", key: "bigscreen" }] },
  { title: "AI 能力", key: "ai", children: [{ title: "对话系统", key: "chat" }, { title: "数字员工管理", key: "digital-employee" }, { title: "技能市场", key: "skill-market" }, { title: "知识库管理", key: "knowledge" }, { title: "工作流编辑器", key: "workflow" }] },
  { title: "数据分析", key: "analysis", children: [{ title: "瞭望采集", key: "lookout" }, { title: "舆情分析", key: "sentiment" }] },
  { title: "运维管理", key: "ops", children: [{ title: "监控告警", key: "monitor" }, { title: "模型引擎", key: "model-engine" }] },
  { title: "系统管理", key: "system", children: [{ title: "用户管理", key: "user-mgmt" }, { title: "角色权限", key: "role-perm" }, { title: "会话管理", key: "session-mgmt" }, { title: "对话管理", key: "conv-mgmt" }, { title: "API Token", key: "api-token" }, { title: "系统设置", key: "settings" }] },
];

const cardBase = { background: "#0f172a", borderRadius: 10, border: "1px solid #334155", padding: 16, cursor: "pointer" };

const RolePermission = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [checkedPerms, setCheckedPerms] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [roleName, setRoleName] = useState("");
  const [savingPerms, setSavingPerms] = useState(false);

  const fetchRoles = async () => {
    try {
      var res = await getRoles();
      setRoles(res || []);
    } catch(e) {
      console.error("Fetch roles failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoles(); }, []);

  const selectRole = async function(role) {
    setSelectedRole(role);
    try {
      var res = await getPermissionFunctions(role.id);
      var keys: any[] = [];
      function collectKeys(nodes) {
        for (var i = 0; i < nodes.length; i++) {
          if (nodes[i].checked) keys.push(nodes[i].key || String(nodes[i].id));
          if (nodes[i].children) collectKeys(nodes[i].children);
        }
      }
      collectKeys(res || []);
      setCheckedPerms(keys);
    } catch(e) {
      setCheckedPerms([]);
    }
  };

  const handleSavePermissions = async function() {
    if (!selectedRole) return;
    setSavingPerms(true);
    try {
      await savePermission({ roleId: selectedRole.id, functionIds: checkedPerms.map(function(k) { return parseInt(k) || k; }) });
      message.success("权限配置已保存");
    } catch(e) {
      message.error("保存失败");
    } finally {
      setSavingPerms(false);
    }
  };

  const openCreateModal = function() { setEditingRole(null); setRoleName(""); setModalOpen(true); };
  const openEditModal = function(role) { setEditingRole(role); setRoleName(role.name); setModalOpen(true); };

  const handleModalOk = async function() {
    if (!roleName.trim()) { message.warning("请输入角色名称"); return; }
    try {
      if (editingRole) {
        message.success("角色已更新（API待扩展）");
      } else {
        await createRole({ name: roleName });
        message.success("角色已创建");
      }
      setModalOpen(false);
      fetchRoles();
    } catch(e) {
      message.error("操作失败");
    }
  };

  const deleteRoleItem = async function(id) {
    try {
      await deleteRole(id);
      message.success("角色已删除");
      if (selectedRole && selectedRole.id === id) setSelectedRole(null);
      fetchRoles();
    } catch(e) {
      message.error("删除失败");
    }
  };

  if (loading) return <div style={{ textAlign: "center", padding: 80 }}><Spin size="large" /></div>;

  return (
    <div style={{ display: "flex", gap: 20, height: "calc(100vh - 150px)" }}>
      <div style={{ width: "40%", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: "#f1f5f9" }}>角色列表</span>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal} style={{ background: "#6366f1", border: "none", borderRadius: 8 }}>创建角色</Button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingRight: 4 }}>
          {roles.map(function(role) {
            var isSelected = selectedRole && selectedRole.id === role.id;
            return (
            <div key={role.id} onClick={function() { selectRole(role); }}
              style={{ ...cardBase, borderColor: isSelected ? "#6366f1" : "#334155", background: isSelected ? "#1e293b" : "#0f172a" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <TeamOutlined style={{ color: isSelected ? "#6366f1" : "#64748b", fontSize: 16 }} />
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#f1f5f9" }}>{role.name}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94a3b8" }}>
                    <UserOutlined /><span>{role.userCount || 0} 位关联用户</span>
                    <span style={{ color: "#334155" }}>|</span>
                    <CheckCircleFilled style={{ color: "#10b981" }} /><span>{role.permissionCount || "N"} 项权限</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <Button type="text" size="small" icon={<EditOutlined />} onClick={function(e) { e.stopPropagation(); openEditModal(role); }} style={{ color: "#94a3b8" }} />
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={function(e) { e.stopPropagation(); deleteRoleItem(role.id); }} />
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>
      <div style={{ width: "60%", background: "#1e293b", borderRadius: 12, border: "1px solid #334155", padding: 24, display: "flex", flexDirection: "column" }}>
        {selectedRole ? (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: "#f1f5f9", marginBottom: 4 }}>{selectedRole.name}</div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#f1f5f9", marginBottom: 12 }}>功能权限</div>
            <div style={{ flex: 1, overflowY: "auto", background: "#0f172a", borderRadius: 8, border: "1px solid #334155", padding: 16 }}>
              <Tree checkable defaultExpandAll treeData={treeData} checkedKeys={checkedPerms}
                onCheck={function(keys) { setCheckedPerms(Array.isArray(keys) ? keys : keys.checked); }}
                style={{ color: "#f1f5f9" }} />
            </div>
            <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <Button style={{ borderColor: "#334155", color: "#94a3b8", borderRadius: 8 }} onClick={function() { setCheckedPerms([]); }}>重置</Button>
              <Button type="primary" onClick={handleSavePermissions} loading={savingPerms} style={{ background: "#6366f1", border: "none", borderRadius: 8 }}>保存权限</Button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
            <TeamOutlined style={{ fontSize: 48, color: "#334155" }} />
            <span style={{ color: "#64748b", fontSize: 15 }}>请从左侧选择一个角色以配置权限</span>
          </div>
        )}
      </div>
      <Modal title={<span style={{ color: "#f1f5f9" }}>{editingRole ? "编辑角色" : "创建角色"}</span>}
        open={modalOpen} onCancel={function() { setModalOpen(false); }} onOk={handleModalOk} okText="确定" cancelText="取消">
        <div>
          <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 4 }}>角色名称</div>
          <Input placeholder="如 运营管理员" value={roleName} onChange={function(e) { setRoleName(e.target.value); }} />
        </div>
      </Modal>
    </div>
  );
};

export default RolePermission;