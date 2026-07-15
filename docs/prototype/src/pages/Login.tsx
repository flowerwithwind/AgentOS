import { useState, useEffect, useCallback } from 'react';
import { Form, Input, Button, Checkbox, message } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined, MailOutlined } from '@ant-design/icons';

const CaptchaBox = ({ text }: { text: string }) => (
  <div
    style={{
      width: 120,
      height: 40,
      background: 'linear-gradient(135deg, #e8e8e8 0%, #d0d0d0 100%)',
      borderRadius: 8,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden',
      userSelect: 'none',
      flexShrink: 0,
    }}
  >
    {/* 噪点 */}
    {Array.from({ length: 30 }).map((_, i) => (
      <div
        key={i}
        style={{
          position: 'absolute',
          width: Math.random() * 3 + 1,
          height: Math.random() * 3 + 1,
          background: `rgba(${Math.random() * 150},${Math.random() * 150},${Math.random() * 150},0.5)`,
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          borderRadius: '50%',
        }}
      />
    ))}
    {/* 干扰线 */}
    {Array.from({ length: 3 }).map((_, i) => (
      <div
        key={`l${i}`}
        style={{
          position: 'absolute',
          width: '100%',
          height: 1,
          background: `rgba(${Math.random() * 100 + 50},${Math.random() * 100 + 50},${Math.random() * 100 + 50},0.4)`,
          top: `${Math.random() * 80 + 10}%`,
          left: 0,
          transform: `rotate(${Math.random() * 30 - 15}deg)`,
        }}
      />
    ))}
    <span
      style={{
        fontFamily: "'Courier New', monospace",
        fontSize: 20,
        fontWeight: 700,
        letterSpacing: 6,
        color: '#4a4a4a',
        fontStyle: 'italic',
        position: 'relative',
        zIndex: 1,
      }}
    >
      {text}
    </span>
  </div>
);

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

const Login = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [captchaText, setCaptchaText] = useState('');
  const [password, setPassword] = useState('');
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();

  const refreshCaptcha = useCallback(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let t = '';
    for (let i = 0; i < 4; i++) t += chars[Math.floor(Math.random() * chars.length)];
    setCaptchaText(t);
  }, []);

  useEffect(() => { refreshCaptcha(); }, [refreshCaptcha]);

  const handleLogin = () => {
    loginForm.validateFields().then((vals) => {
      if (vals.captcha?.toLowerCase() !== captchaText.toLowerCase()) {
        message.error('验证码错误');
        refreshCaptcha();
        loginForm.setFieldValue('captcha', '');
        return;
      }
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        message.success('登录成功！');
      }, 1200);
    });
  };

  const handleRegister = () => {
    registerForm.validateFields().then(() => {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        message.success('注册成功！请登录');
        setMode('login');
        registerForm.resetFields();
      }, 1200);
    });
  };

  const strength = strengthConfig(password);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* 装饰背景 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 30% 40%, rgba(100,149,237,0.08) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(99,102,241,0.06) 0%, transparent 50%)',
          pointerEvents: 'none',
        }}
      />

      {/* 左侧品牌区 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 60,
          position: 'relative',
          zIndex: 1,
        }}
        className="login-brand-area"
      >
        <div
          style={{
            width: 64,
            height: 64,
            background: 'linear-gradient(135deg, #4a90d9, #00c6ff)',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
            fontSize: 28,
            color: '#fff',
            fontWeight: 'bold',
            boxShadow: '0 8px 32px rgba(74,144,217,0.3)',
          }}
        >
          XH
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 600, color: '#fff', marginBottom: 16, letterSpacing: 1 }}>
          XHAgentOS
        </h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, maxWidth: 420 }}>
          智能数据瞭望与问数系统
          <br />
          AI 驱动的企业级数据分析平台
        </p>
      </div>

      {/* 右侧表单区 */}
      <div
        style={{
          width: 480,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 40,
          position: 'relative',
          zIndex: 1,
        }}
        className="login-form-area"
      >
        <div
          style={{
            width: '100%',
            maxWidth: 400,
            background: 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(20px)',
            borderRadius: 16,
            padding: '48px 40px 40px',
            boxShadow: '0 25px 80px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 600, color: '#1a1a2e', marginBottom: 8, textAlign: 'center' }}>
            {mode === 'login' ? '管理员登录' : '注册账号'}
          </div>
          <div style={{ fontSize: 14, color: '#8c8c8c', textAlign: 'center', marginBottom: 36 }}>
            {mode === 'login' ? '请使用管理员账号登录系统' : '创建您的 XHAgentOS 账号'}
          </div>

          {mode === 'login' ? (
            <Form form={loginForm} layout="vertical" size="large">
              <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
                <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} placeholder="请输入用户名" style={{ height: 48, borderRadius: 10, background: '#fafafa' }} />
              </Form.Item>
              <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
                <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="请输入密码" style={{ height: 48, borderRadius: 10, background: '#fafafa' }} />
              </Form.Item>
              <Form.Item style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <Form.Item name="captcha" noStyle rules={[{ required: true, message: '请输入验证码' }]}>
                    <Input
                      prefix={<SafetyOutlined style={{ color: '#bfbfbf' }} />}
                      placeholder="验证码"
                      style={{ height: 48, borderRadius: 10, background: '#fafafa', width: 160 }}
                    />
                  </Form.Item>
                  <div onClick={refreshCaptcha} title="点击刷新验证码">
                    <CaptchaBox text={captchaText} />
                  </div>
                </div>
              </Form.Item>
              <Form.Item>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Checkbox>记住我</Checkbox>
                  <a style={{ color: '#4a90d9', fontSize: 13 }} href="#">忘记密码？</a>
                </div>
              </Form.Item>
              <Button
                type="primary"
                block
                loading={loading}
                onClick={handleLogin}
                style={{
                  height: 48,
                  borderRadius: 10,
                  fontSize: 16,
                  fontWeight: 500,
                  background: loading ? undefined : 'linear-gradient(135deg, #4a90d9, #357abd)',
                  border: 'none',
                }}
              >
                登 录
              </Button>
            </Form>
          ) : (
            <Form form={registerForm} layout="vertical" size="large">
              <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }, { min: 3, message: '用户名至少3个字符' }]}>
                <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} placeholder="请输入用户名" style={{ height: 48, borderRadius: 10, background: '#fafafa' }} />
              </Form.Item>
              <Form.Item name="email" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '邮箱格式不正确' }]}>
                <Input prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} placeholder="请输入邮箱" style={{ height: 48, borderRadius: 10, background: '#fafafa' }} />
              </Form.Item>
              <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6个字符' }]}>
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                  placeholder="请输入密码"
                  style={{ height: 48, borderRadius: 10, background: '#fafafa' }}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Form.Item>
              {password && (
                <div style={{ marginTop: -16, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ flex: 1, height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${strength.percent}%`, height: '100%', background: strength.color, borderRadius: 3, transition: 'all 0.3s' }} />
                    </div>
                    <span style={{ fontSize: 12, color: strength.color, fontWeight: 500 }}>{strength.level}</span>
                  </div>
                </div>
              )}
              <Form.Item
                name="confirmPassword"
                dependencies={['password']}
                rules={[
                  { required: true, message: '请确认密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) return Promise.resolve();
                      return Promise.reject(new Error('两次输入的密码不一致'));
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="请确认密码" style={{ height: 48, borderRadius: 10, background: '#fafafa' }} />
              </Form.Item>
              <Button
                type="primary"
                block
                loading={loading}
                onClick={handleRegister}
                style={{
                  height: 48,
                  borderRadius: 10,
                  fontSize: 16,
                  fontWeight: 500,
                  background: loading ? undefined : 'linear-gradient(135deg, #4a90d9, #357abd)',
                  border: 'none',
                }}
              >
                注 册
              </Button>
            </Form>
          )}

          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#8c8c8c' }}>
            {mode === 'login' ? (
              <>
                没有账号？
                <a style={{ color: '#4a90d9', cursor: 'pointer', marginLeft: 4 }} onClick={() => { setMode('register'); setPassword(''); }}>
                  立即注册
                </a>
              </>
            ) : (
              <>
                已有账号？
                <a style={{ color: '#4a90d9', cursor: 'pointer', marginLeft: 4 }} onClick={() => { setMode('login'); setPassword(''); }}>
                  返回登录
                </a>
              </>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#8c8c8c' }}>
            &copy; 2026 XHAgentOS &mdash; All Rights Reserved
          </div>
        </div>
      </div>

      {/* 响应式样式 */}
      <style>{`
        @media (max-width: 900px) {
          .login-brand-area { padding: 40px 32px 20px !important; align-items: center !important; text-align: center !important; }
          .login-form-area { width: 100% !important; padding: 0 20px 40px !important; }
        }
        @media (max-width: 480px) {
          .login-brand-area { padding: 32px 20px 16px !important; }
        }
      `}</style>
    </div>
  );
};

export default Login;
