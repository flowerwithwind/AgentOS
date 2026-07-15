import { useState } from 'react';
import { Button, Modal, Input, message, Tree, Tag } from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  CheckCircleFilled, UserOutlined, TeamOutlined,
} from '@ant-design/icons';

/* ---------- types ---------- */
interface Role {
  key: string; name: string; desc: string; code: string; userCount: number;
  permissions: string[];
}

/* ---------- mock data ---------- */
const mockRoles: Role[] = [
  {
    key: '1', name: '超级管理员', desc: '拥有系统全部功能的访问权限', code: 'super_admin', userCount: 2,
    permissions: ['dashboard', 'bigscreen', 'chat', 'digital-employee', 'skill-market', 'knowledge', 'workflow',
      'lookout', 'sentiment', 'monitor', 'model-engine', 'user-mgmt', 'role-perm', 'session-mgmt', 'conv-mgmt', 'api-token', 'settings'],
  },
  {
    key: '2', name: '普通管理员', desc: '日常管理操作权限，不含系统配置', code: 'admin', userCount: 3,
    permissions: ['dashboard', 'chat', 'digital-employee', 'lookout', 'sentiment', 'settings'],
  },
  {
    key: '3', name: '只读用户', desc: '仅拥有数据查看权限', code: 'viewer', userCount: 5,
    permissions: ['dashboard', 'chat', 'lookout', 'sentiment'],
  },
];

const treeData = [
  {
    title: '数据总览', key: 'overview', children: [
      { title: '仪表盘', key: 'dashboard' },
      { title: '数智大屏', key: 'bigscreen' },
    ],
  },
  {
    title: 'AI 能力', key: 'ai', children: [
      { title: '对话系统', key: 'chat' },
      { title: '数字员工管理', key: 'digital-employee' },
      { title: '技能市场', key: 'skill-market' },
      { title: '知识库管理', key: 'knowledge' },
      { title: '工作流编辑器', key: 'workflow' },
    ],
  },
  {
    title: '数据分析', key: 'analysis', children: [
      { title: '瞭望采集', key: 'lookout' },
      { title: '舆情分析', key: 'sentiment' },
    ],
  },
  {
    title: '运维管理', key: 'ops', children: [
      { title: '监控告警', key: 'monitor' },
      { title: '模型引擎', key: 'model-engine' },
    ],
  },
  {
    title: '系统管理', key: 'system', children: [
      { title: '用户管理', key: 'user-mgmt' },
      { title: '角色权限', key: 'role-perm' },
      { title: '会话管理', key: 'session-mgmt' },
      { title: '对话管理', key: 'conv-mgmt' },
      { title: 'API Token', key: 'api-token' },
      { title: '系统设置', key: 'settings' },
    ],
  },
];

/* ---------- styles ---------- */
const cardBase: React.CSSProperties = {
  background: '#0f172a', borderRadius: 10, border: '1px solid #334155', padding: 16, cursor: 'pointer',
  transition: 'border-color 0.15s',
};

const RolePermission = () => {
  const [roles, setRoles] = useState<Role[]>(mockRoles);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [checkedPerms, setCheckedPerms] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const selectRole = (role: Role) => {
    setSelectedRole(role);
    setCheckedPerms(role.permissions);
  };

  const handleSavePermissions = () => {
    if (!selectedRole) return;
    setRoles(prev => prev.map(r => r.key === selectedRole.key ? { ...r, permissions: checkedPerms } : r));
    setSelectedRole(prev => prev ? { ...prev, permissions: checkedPerms } : null);
    message.success('权限配置已保存');
  };

  const openCreateModal = () => { setEditingRole(null); setModalOpen(true); };
  const openEditModal = (role: Role) => { setEditingRole(role); setModalOpen(true); };

  const handleModalOk = () => {
    setModalOpen(false);
    message.success(editingRole ? '角色已更新' : '角色已创建');
  };

  const deleteRole = (key: string) => {
    setRoles(prev => prev.filter(r => r.key !== key));
    if (selectedRole?.key === key) setSelectedRole(null);
    message.success('角色已删除');
  };

  return (
    <div style={{ display: 'flex', gap: 20, height: 'calc(100vh - 150px)' }}>
      {/* 左侧角色列表 */}
      <div style={{ width: '40%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#f1f5f9' }}>角色列表</span>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal} style={{ background: '#6366f1', border: 'none', borderRadius: 8 }}>创建角色</Button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 4 }}>
          {roles.map(role => {
            const isSelected = selectedRole?.key === role.key;
            return (
              <div
                key={role.key}
                onClick={() => selectRole(role)}
                style={{
                  ...cardBase,
                  borderColor: isSelected ? '#6366f1' : '#334155',
                  background: isSelected ? '#1e293b' : '#0f172a',
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = '#475569'; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = '#334155'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <TeamOutlined style={{ color: isSelected ? '#6366f1' : '#64748b', fontSize: 16 }} />
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>{role.name}</span>
                      <Tag style={{ background: '#334155', border: 'none', color: '#94a3b8', borderRadius: 4, fontSize: 11 }}>{role.code}</Tag>
                    </div>
                    <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>{role.desc}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8' }}>
                      <UserOutlined /><span>{role.userCount} 位关联用户</span>
                      <span style={{ margin: '0 6px', color: '#334155' }}>·</span>
                      <CheckCircleFilled style={{ color: '#10b981' }} /><span>{role.permissions.length} 项权限</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <Button type="text" size="small" icon={<EditOutlined />} onClick={e => { e.stopPropagation(); openEditModal(role); }} style={{ color: '#94a3b8' }} />
                    <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={e => { e.stopPropagation(); deleteRole(role.key); }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 右侧权限配置 */}
      <div style={{ width: '60%', background: '#1e293b', borderRadius: 12, border: '1px solid #334155', padding: 24, display: 'flex', flexDirection: 'column' }}>
        {selectedRole ? (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>{selectedRole.name}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>{selectedRole.desc}</div>
            </div>

            <div style={{ fontSize: 14, fontWeight: 500, color: '#f1f5f9', marginBottom: 12 }}>功能权限</div>
            <div style={{ flex: 1, overflowY: 'auto', background: '#0f172a', borderRadius: 8, border: '1px solid #334155', padding: 16 }}>
              <Tree
                checkable
                defaultExpandAll
                treeData={treeData}
                checkedKeys={checkedPerms}
                onCheck={keys => setCheckedPerms(keys as string[])}
                style={{ color: '#f1f5f9' }}
              />
            </div>

            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Button style={{ borderColor: '#334155', color: '#94a3b8', borderRadius: 8 }} onClick={() => setCheckedPerms(selectedRole.permissions)}>重置</Button>
              <Button type="primary" onClick={handleSavePermissions} style={{ background: '#6366f1', border: 'none', borderRadius: 8 }}>保存权限</Button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
            <TeamOutlined style={{ fontSize: 48, color: '#334155' }} />
            <span style={{ color: '#64748b', fontSize: 15 }}>请从左侧选择一个角色以配置权限</span>
          </div>
        )}
      </div>

      {/* 创建/编辑角色 Modal */}
      <Modal
        title={<span style={{ color: '#f1f5f9' }}>{editingRole ? '编辑角色' : '创建角色'}</span>}
        open={modalOpen} onCancel={() => setModalOpen(false)}
        onOk={handleModalOk} okText="确定" cancelText="取消"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>角色名称</div>
            <Input placeholder="如 运营管理员" defaultValue={editingRole?.name} />
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>角色标识</div>
            <Input placeholder="英文标识，如 admin / editor / viewer" defaultValue={editingRole?.code} />
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>描述</div>
            <Input.TextArea rows={3} placeholder="简要描述该角色的职责范围" defaultValue={editingRole?.desc} />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RolePermission;
