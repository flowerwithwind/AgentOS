import { useState, useEffect } from 'react';
import { Form, Input, Button, message, Typography, Divider } from 'antd';
import { UserOutlined, LockOutlined, RobotOutlined, GlobalOutlined, SafetyOutlined, GithubFilled, QqCircleFilled } from '@ant-design/icons';
import { login, register } from '../services/auth';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/useAuthStore';

const { Text, Title } = Typography;

const strengthConfig = (pwd: string) => {
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { level: '弱', color: '#ef4444', percent: 33 };
  if (score <= 3) return { level: '中', color: '#f59e0b', percent: 66 };
  return { level: '强', color: '#10b981', percent: 100 };
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const HomePage = () => {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();
  const strength = strengthConfig(password);

  // 处理 URL 参数：OAuth 回调、模式切换、错误/成功消息、自动登录
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthSuccess = params.get('oauth_success');
    const username = params.get('username');
    const simulated = params.get('simulated');
    const urlMode = params.get('mode');
    const errorMsg = params.get('error');
    const successMsg = params.get('success');
    const autoLogin = params.get('auto_login');

    // 模式切换（登录/注册）
    if (urlMode === 'register' || urlMode === 'login') {
      setMode(urlMode);
    }

    // 错误消息
    if (errorMsg) {
      message.error(decodeURIComponent(errorMsg));
    }

    // 成功消息
    if (successMsg) {
      message.success(decodeURIComponent(successMsg));
    }

    // OAuth 成功回调
    if (oauthSuccess && username) {
      const modeText = simulated ? '模拟' : '';
      message.success(`${modeText}${oauthSuccess.toUpperCase()} 登录成功！`);
      fetchUserAndRedirect();
    }

    // 自动登录（后端已设置 cookie）
    if (autoLogin) {
      message.success('登录成功');
      fetchUserAndRedirect();
    }

    // 清除 URL 参数（保留 mode）
    if (oauthSuccess || errorMsg || successMsg || autoLogin) {
      const cleanUrl = urlMode ? `/?mode=${urlMode}` : window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }

    function fetchUserAndRedirect() {
      fetch(`${API_BASE}/auth/me`, { credentials: 'include' })
        .then(r => r.json())
        .then(result => {
          if (result.code === 200 && result.data) {
            const d = result.data;
            setUser({ id: d.id, username: d.username, roleId: d.roleId, roleName: d.roleName }, d.permissions || []);
            if (d.roleId === 1) navigate('/admin/dashboard');
            else navigate('/user/dashboard');
          }
        })
        .catch(() => window.location.reload());
    }
  }, []);

  const handleLogin = async () => {
    const vals = await loginForm.validateFields().catch(() => null);
    if (!vals) return;
    setLoading(true);
    try {
      const result: any = await login({ username: vals.username, password: vals.password });
      setUser({ id: result.id, username: result.username, roleId: result.roleId, roleName: result.roleName }, result.permissions || []);
      message.success('登录成功');
      if (result.roleId === 1) navigate('/admin/dashboard');
      else navigate('/user/dashboard');
    } catch (e: any) {
      message.error(e?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    const vals = await registerForm.validateFields().catch(() => null);
    if (!vals) return;
    setLoading(true);
    try {
      await register({ username: vals.username, password: vals.password, confirmPassword: vals.confirmPassword });
      message.success('注册成功，请登录');
      setMode('login');
      registerForm.resetFields();
    } catch (e: any) {
      message.error(e?.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = (provider: string) => {
    window.location.href = `${API_BASE}/auth/oauth/${provider}/login`;
  };

  return (
    <div style={{ height: '100vh', display: 'flex', overflow: 'hidden' }} className="homepage-container">
      {/* Left: Brand Panel */}
      <div style={{ width: '55%', flex: 'none', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #172554 100%)', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 80px', overflow: 'hidden', boxSizing: 'border-box' }} className="login-left-panel">
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '60%', height: '60%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '50%', height: '50%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '40%', right: '20%', width: '30%', height: '30%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#fff', fontWeight: 700, boxShadow: '0 8px 32px rgba(99,102,241,0.3)' }}>
              XH
            </div>
            <span style={{ color: '#fff', fontSize: 22, fontWeight: 700, letterSpacing: 1 }}>XHAgentOS</span>
          </div>

          <Title level={1} style={{ color: '#fff', fontWeight: 700, margin: 0, lineHeight: 1.2, letterSpacing: -1 }}>智能数据<br />瞭望与问数平台</Title>
          <Text style={{ color: 'rgba(255,255,255,0.6)', display: 'block', marginTop: 16, maxWidth: 420, lineHeight: 1.7 }}>
            AI 驱动的企业级数据分析平台，支持实时新闻采集、舆情分析和智能问数能力。
          </Text>

          <div style={{ display: 'flex', gap: 24, marginTop: 40, flexWrap: 'wrap' }}>
            {[
              { icon: <RobotOutlined />, label: 'AI 智能体', desc: '智能数字员工' },
              { icon: <GlobalOutlined />, label: '实时监控', desc: '实时新闻采集' },
              { icon: <SafetyOutlined />, label: '智能分析', desc: '舆情与风险洞察' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: 'rgba(255,255,255,0.05)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', fontSize: 16 }}>{f.icon}</div>
                <div>
                  <div className="feature-badge-label" style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 600 }}>{f.label}</div>
                  <div className="feature-badge-desc" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Login/Register Form */}
      <div style={{ width: '45%', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: 40, overflowY: 'auto', boxSizing: 'border-box' }} className="login-right-panel">
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 40, background: '#f1f5f9', borderRadius: 12, padding: 4, width: 'fit-content' }}>
            <div onClick={() => setMode('login')} style={{ padding: '10px 28px', borderRadius: 10, cursor: 'pointer', background: mode === 'login' ? '#fff' : 'transparent', color: mode === 'login' ? '#6366f1' : '#64748b', fontWeight: 600, fontSize: 14, boxShadow: mode === 'login' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none', transition: 'all 0.2s' }}>登录</div>
            <div onClick={() => setMode('register')} style={{ padding: '10px 28px', borderRadius: 10, cursor: 'pointer', background: mode === 'register' ? '#fff' : 'transparent', color: mode === 'register' ? '#6366f1' : '#64748b', fontWeight: 600, fontSize: 14, boxShadow: mode === 'register' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none', transition: 'all 0.2s' }}>注册</div>
          </div>

          <Title level={3} style={{ color: '#0f172a', margin: 0, fontSize: 24 }}>{mode === 'login' ? '欢迎回来' : '创建账号'}</Title>
          <Text style={{ color: '#64748b', display: 'block', marginTop: 6, marginBottom: 32, fontSize: 14 }}>{mode === 'login' ? '登录您的账号以继续使用' : '注册 XHAgentOS 账号以开始使用'}</Text>

          <div key={mode} className="form-switch-animate">
          {mode === 'login' ? (
            <Form form={loginForm} layout="vertical" size="large" onFinish={handleLogin}>
              <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]} style={{ marginBottom: 20 }}>
                <Input prefix={<UserOutlined style={{ color: '#94a3b8' }} />} placeholder="用户名" style={{ height: 48, borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff' }} />
              </Form.Item>
              <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]} style={{ marginBottom: 8 }}>
                <Input.Password prefix={<LockOutlined style={{ color: '#94a3b8' }} />} placeholder="密码" style={{ height: 48, borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff' }} />
              </Form.Item>
              <div style={{ textAlign: 'right', marginBottom: 24 }}>
                <a style={{ color: '#6366f1', fontSize: 13 }}>忘记密码？</a>
              </div>
              <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 48, borderRadius: 10, fontSize: 15, fontWeight: 600, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}>
                登 录
              </Button>
              <Divider style={{ margin: '24px 0', color: '#94a3b8', fontSize: 12 }}>或使用以下方式登录</Divider>
              <div style={{ display: 'flex', gap: 12 }}>
                <Button block icon={<GithubFilled />} style={{ height: 44, borderRadius: 10, border: '1px solid #24292f', color: '#24292f', fontSize: 15, background: '#fff' }} onClick={() => handleOAuthLogin('github')}>
                  GitHub
                </Button>
                <Button block icon={<QqCircleFilled />} style={{ height: 44, borderRadius: 10, border: '1px solid #12b7f5', color: '#12b7f5', fontSize: 15, background: '#fff' }} onClick={() => handleOAuthLogin('qq')}>
                  QQ
                </Button>
              </div>
            </Form>
          ) : (
            <Form form={registerForm} layout="vertical" size="large" onFinish={handleRegister}>
              <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }, { min: 3, message: '用户名至少3个字符，以字母开头' }, { pattern: /^[a-zA-Z][a-zA-Z0-9_-]*$/, message: '用户名必须以字母开头' }]} style={{ marginBottom: 20 }}>
                <Input prefix={<UserOutlined style={{ color: '#94a3b8' }} />} placeholder="用户名" style={{ height: 48, borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff' }} />
              </Form.Item>
              <Form.Item name="password" rules={[
                { required: true, message: '请输入密码' },
                { min: 8, message: '密码至少8个字符' },
                { pattern: /[A-Z]+/, message: '密码必须包含大写字母' },
                { pattern: /[a-z]+/, message: '密码必须包含小写字母' },
                { pattern: /[0-9]+/, message: '密码必须包含数字' },
              ]} style={{ marginBottom: 4 }}>
                <Input.Password prefix={<LockOutlined style={{ color: '#94a3b8' }} />} placeholder="密码（至少8位，含大小写字母和数字）" style={{ height: 48, borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff' }} onChange={e => setPassword(e.target.value)} />
              </Form.Item>
              {password && (
                <div style={{ marginBottom: 16, marginTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${strength.percent}%`, height: '100%', background: strength.color, borderRadius: 3, transition: 'all 0.3s' }} />
                    </div>
                    <span style={{ fontSize: 12, color: strength.color, fontWeight: 500 }}>{strength.level}</span>
                  </div>
                </div>
              )}
              <Form.Item name="confirmPassword" dependencies={['password']} rules={[
                { required: true, message: '请确认密码' },
                ({ getFieldValue }) => ({ validator(_, value) { if (!value || getFieldValue('password') === value) return Promise.resolve(); return Promise.reject(new Error('两次输入的密码不一致')); } }),
              ]} style={{ marginBottom: 24 }}>
                <Input.Password prefix={<LockOutlined style={{ color: '#94a3b8' }} />} placeholder="确认密码" style={{ height: 48, borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff' }} />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 48, borderRadius: 10, fontSize: 15, fontWeight: 600, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}>
                注 册
              </Button>
            </Form>
          )}
          </div>

          <div style={{ textAlign: 'center', marginTop: 24, color: '#94a3b8', fontSize: 12 }}>
            &copy; 2026 XHAgentOS. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

// 注入响应式样式
const styleId = 'homepage-responsive-styles';
if (!document.getElementById(styleId)) {
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    body { margin: 0; overflow-x: hidden; }
    .homepage-container { width: 100vw; }
    /* 字体响应式缩放 */
    .login-left-panel h1 { font-size: clamp(26px, 3.5vw, 42px) !important; }
    .login-left-panel p { font-size: clamp(13px, 1.3vw, 16px) !important; }
    .login-left-panel .feature-badge-label { font-size: clamp(11px, 1.1vw, 13px) !important; }
    .login-left-panel .feature-badge-desc { font-size: clamp(10px, 1vw, 12px) !important; }
    .login-right-panel input { font-size: clamp(13px, 1.2vw, 15px) !important; }
    /* 修复输入框文字变白 - 强制颜色 */
    .login-right-panel .ant-input,
    .login-right-panel .ant-input-password,
    .login-right-panel input.ant-input,
    .login-right-panel .ant-input-affix-wrapper input.ant-input {
      color: #333333 !important;
      -webkit-text-fill-color: #333333 !important;
    }
    .login-right-panel .ant-input-affix-wrapper .ant-input {
      background: transparent !important;
    }
    /* 表单切换动画 */
    .form-switch-animate {
      animation: formFadeSlide 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    }
    @keyframes formFadeSlide {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    /* 输入框聚焦动画 */
    .login-right-panel .ant-input-affix-wrapper {
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }
    .login-right-panel .ant-input-affix-wrapper-focused {
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15) !important;
      border-color: #6366f1 !important;
    }
    /* OAuth 按钮悬停 */
    .login-right-panel .ant-btn:not(.ant-btn-primary):hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
    }
    .login-right-panel .ant-btn:not(.ant-btn-primary) {
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }
    /* 主按钮悬停提升 */
    .login-right-panel .ant-btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4) !important;
    }
    .login-right-panel .ant-btn-primary {
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }
    /* 响应式布局 */
    @media (max-width: 1100px) {
      .homepage-container { flex-direction: column !important; overflow-y: auto !important; height: auto !important; min-height: 100vh !important; }
      .login-left-panel { width: 100% !important; padding: 32px 40px !important; align-items: center !important; text-align: center !important; }
      .login-left-panel h1 { font-size: 32px !important; }
      .login-left-panel p { max-width: 100% !important; }
      .login-right-panel { width: 100% !important; padding: 32px 24px !important; }
    }
    @media (max-width: 600px) {
      .login-left-panel { padding: 24px 20px !important; }
      .login-left-panel h1 { font-size: 26px !important; }
      .login-right-panel { padding: 24px 16px !important; }
    }
  `;
  document.head.appendChild(style);
}

export default HomePage;
