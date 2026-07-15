import { useState } from 'react';
import {
  Avatar, Button, Modal, Input, Select, Switch, Tag, message, Tooltip,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
  UserOutlined, SafetyOutlined,
} from '@ant-design/icons';

/* ===== Mock Data ===== */
interface UserItem {
  id: string; username: string; email: string; avatar: string;
  role: '超级管理员' | '普通用户'; status: '正常' | '禁用';
  createdAt: string; lastLogin: string;
}

const mockUsers: UserItem[] = [
  { id: '1', username: 'admin', email: 'admin@xhu.edu.cn', avatar: 'A', role: '超级管理员', status: '正常', createdAt: '2025-12-01', lastLogin: '2026-07-15 14:32' },
  { id: '2', username: 'zhangsan', email: 'zhangsan@xhu.edu.cn', avatar: '张', role: '普通用户', status: '正常', createdAt: '2026-01-15', lastLogin: '2026-07-15 10:18' },
  { id: '3', username: 'lisi', email: 'lisi@xhu.edu.cn', avatar: '李', role: '普通用户', status: '正常', createdAt: '2026-02-20', lastLogin: '2026-07-14 16:45' },
  { id: '4', username: 'wangwu', email: 'wangwu@xhu.edu.cn', avatar: '王', role: '普通用户', status: '禁用', createdAt: '2026-03-10', lastLogin: '2026-06-28 09:30' },
  { id: '5', username: 'zhaoliu', email: 'zhaoliu@xhu.edu.cn', avatar: '赵', role: '超级管理员', status: '正常', createdAt: '2026-03-25', lastLogin: '2026-07-15 08:22' },
  { id: '6', username: 'test_user', email: 'test@xhu.edu.cn', avatar: 'T', role: '普通用户', status: '正常', createdAt: '2026-05-08', lastLogin: '2026-07-13 20:15' },
];

const avatarColors: Record<string, string> = {
  '超级管理员': '#6366f1', '普通用户': '#3b82f6',
};

const roleColors: Record<string, { bg: string; color: string }> = {
  '超级管理员': { bg: '#6366f122', color: '#6366f1' },
  '普通用户': { bg: '#3b82f622', color: '#3b82f6' },
};

const statusColors: Record<string, { bg: string; color: string }> = {
  '正常': { bg: '#10b98122', color: '#10b981' },
  '禁用': { bg: '#ef444422', color: '#ef4444' },
};

const PAGE_SIZE = 5;

/* ===== Component ===== */
const UserManagement = () => {
  const [users, setUsers] = useState<UserItem[]>(mockUsers);
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<string>('普通用户');
  const [formStatus, setFormStatus] = useState(true);

  const filtered = users.filter(u => {
    const matchSearch = !searchText || u.username.includes(searchText) || u.email.includes(searchText);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => {
    setEditingId(null);
    setFormUsername(''); setFormEmail(''); setFormPassword('');
    setFormRole('普通用户'); setFormStatus(true);
    setModalOpen(true);
  };

  const openEdit = (u: UserItem) => {
    setEditingId(u.id);
    setFormUsername(u.username); setFormEmail(u.email); setFormPassword('');
    setFormRole(u.role); setFormStatus(u.status === '正常');
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!formUsername.trim()) { message.warning('请输入用户名'); return; }
    if (!formEmail.trim() || !formEmail.includes('@')) { message.warning('请输入有效邮箱'); return; }
    if (!editingId && !formPassword.trim()) { message.warning('请输入密码'); return; }
    if (editingId) {
      setUsers(prev => prev.map(u => u.id === editingId ? {
        ...u, username: formUsername, email: formEmail, avatar: formUsername[0].toUpperCase(),
        role: formRole as UserItem['role'], status: formStatus ? '正常' : '禁用',
      } : u));
      message.success('编辑成功');
    } else {
      const newUser: UserItem = {
        id: String(Date.now()), username: formUsername, email: formEmail,
        avatar: formUsername[0].toUpperCase(), role: formRole as UserItem['role'],
        status: formStatus ? '正常' : '禁用', createdAt: '2026-07-15', lastLogin: '-',
      };
      setUsers(prev => [...prev, newUser]);
      message.success('创建成功');
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除', content: '删除用户后无法恢复，确定要删除吗？',
      okText: '删除', okType: 'danger', cancelText: '取消',
      onOk: () => { setUsers(prev => prev.filter(u => u.id !== id)); message.success('已删除'); },
    });
  };

  const toggleStatus = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === '正常' ? '禁用' : '正常' } : u));
    message.success('状态已更新');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 工具栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Input
            prefix={<SearchOutlined style={{ color: '#64748b' }} />}
            placeholder="搜索用户名或邮箱..." value={searchText}
            onChange={e => { setSearchText(e.target.value); setPage(1); }}
            style={{ width: 260, borderRadius: 8, background: '#0f172a', border: '1px solid #334155' }}
            allowClear
          />
          <Select
            value={roleFilter} onChange={v => { setRoleFilter(v); setPage(1); }}
            style={{ width: 140 }}
            options={[
              { label: '全部角色', value: 'all' },
              { label: '超级管理员', value: '超级管理员' },
              { label: '普通用户', value: '普通用户' },
            ]}
          />
        </div>
        <Button type="primary" icon={<PlusOutlined />} style={{ borderRadius: 8, background: '#6366f1', border: 'none' }} onClick={openCreate}>
          创建用户
        </Button>
      </div>

      {/* 用户表格 */}
      <div style={{ background: '#0f172a', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#f1f5f9', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155' }}>
              {['用户', '邮箱', '角色', '状态', '注册时间', '最后登录', '操作'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#94a3b8', fontWeight: 500, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar style={{ background: avatarColors[u.role] || '#6366f1' }} size={32}>
                      {u.avatar}
                    </Avatar>
                    <span style={{ fontWeight: 500 }}>{u.username}</span>
                  </div>
                </td>
                <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{u.email}</td>
                <td style={{ padding: '12px 16px' }}>
                  <Tag style={{ background: roleColors[u.role]?.bg, color: roleColors[u.role]?.color, border: 'none', borderRadius: 4, fontSize: 12 }}>
                    {u.role === '超级管理员' && <SafetyOutlined style={{ marginRight: 4 }} />}
                    {u.role}
                  </Tag>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <Tag style={{ background: statusColors[u.status]?.bg, color: statusColors[u.status]?.color, border: 'none', borderRadius: 4, fontSize: 12 }}>
                    {u.status}
                  </Tag>
                </td>
                <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 12 }}>{u.createdAt}</td>
                <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 12 }}>{u.lastLogin}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Tooltip title="编辑">
                      <Button size="small" icon={<EditOutlined />} style={{ borderRadius: 6, borderColor: '#334155', color: '#94a3b8' }} onClick={() => openEdit(u)} />
                    </Tooltip>
                    <Tooltip title={u.status === '正常' ? '禁用' : '启用'}>
                      <Button
                        size="small"
                        style={{ borderRadius: 6, borderColor: '#334155', color: u.status === '正常' ? '#f59e0b' : '#10b981', fontSize: 12, paddingInline: 8 }}
                        onClick={() => toggleStatus(u.id)}
                      >
                        {u.status === '正常' ? '禁用' : '启用'}
                      </Button>
                    </Tooltip>
                    <Tooltip title="删除">
                      <Button size="small" icon={<DeleteOutlined />} style={{ borderRadius: 6, borderColor: '#334155', color: '#ef4444' }} onClick={() => handleDelete(u.id)} />
                    </Tooltip>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 分页 */}
        <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #334155' }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>共 {filtered.length} 条记录</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <Button size="small" disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ borderRadius: 6, borderColor: '#334155', color: '#94a3b8' }}>上一页</Button>
            {Array.from({ length: totalPages }, (_, i) => (
              <Button
                key={i + 1} size="small"
                style={{
                  borderRadius: 6, minWidth: 32,
                  borderColor: page === i + 1 ? '#6366f1' : '#334155',
                  color: page === i + 1 ? '#6366f1' : '#94a3b8',
                  background: page === i + 1 ? '#6366f122' : 'transparent',
                }}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </Button>
            ))}
            <Button size="small" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ borderRadius: 6, borderColor: '#334155', color: '#94a3b8' }}>下一页</Button>
          </div>
        </div>
      </div>

      {/* 创建/编辑 Modal */}
      <Modal
        title={editingId ? '编辑用户' : '创建用户'}
        open={modalOpen} onCancel={() => setModalOpen(false)}
        onOk={handleSave} okText="保存" cancelText="取消"
        width={480}
        styles={{ body: { background: '#1e293b' }, header: { background: '#1e293b', borderBottom: '1px solid #334155' }, footer: { borderTop: '1px solid #334155', background: '#1e293b' } }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
          <div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>用户名 *</div>
            <Input
              value={formUsername} onChange={e => setFormUsername(e.target.value)}
              placeholder="请输入用户名" prefix={<UserOutlined style={{ color: '#64748b' }} />}
              style={{ borderRadius: 8, background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9' }}
            />
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>邮箱 *</div>
            <Input
              value={formEmail} onChange={e => setFormEmail(e.target.value)}
              placeholder="请输入邮箱"
              style={{ borderRadius: 8, background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9' }}
            />
          </div>
          {!editingId && (
            <div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>密码 *</div>
              <Input.Password
                value={formPassword} onChange={e => setFormPassword(e.target.value)}
                placeholder="请输入密码（至少6位）"
                style={{ borderRadius: 8, background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9' }}
              />
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>角色</div>
              <Select
                value={formRole} onChange={setFormRole} style={{ width: '100%' }}
                options={[
                  { label: '超级管理员', value: '超级管理员' },
                  { label: '普通用户', value: '普通用户' },
                ]}
              />
            </div>
            <div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>状态</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 32 }}>
                <Switch checked={formStatus} onChange={setFormStatus} style={{ background: formStatus ? '#10b981' : '#334155' }} />
                <span style={{ fontSize: 13, color: formStatus ? '#10b981' : '#ef4444' }}>{formStatus ? '正常' : '禁用'}</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;
