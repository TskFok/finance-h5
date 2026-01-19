import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../services/api';
import { storage } from '../utils/storage';

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'verify' | 'register'>('email');
  const [formData, setFormData] = useState({
    email: '',
    code: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await authApi.sendVerificationCode({
        email: formData.email,
        type: 'register'
      });
      if (response.code === 200) {
        setSuccess('验证码已发送到您的邮箱，请查收');
        setStep('verify');
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(response.message || '发送验证码失败');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '发送验证码失败');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.verifyEmailCode({
        email: formData.email,
        code: formData.code,
        type: 'register'
      });
      if (response.code === 200) {
        setSuccess('验证码验证成功');
        setStep('register');
      } else {
        setError(response.message || '验证码错误或已过期');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '验证码错误或已过期');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (formData.password.length < 6) {
      setError('密码长度至少为6位');
      return;
    }

    if (formData.username.length < 3) {
      setError('用户名长度至少为3位');
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.registerWithVerification({
        email: formData.email,
        code: formData.code,
        username: formData.username,
        password: formData.password
      });
      if (response.code === 200 && response.data) {
        // 注册成功后自动登录
        const loginResponse = await authApi.login({
          username: formData.username,
          password: formData.password
        });
        if (loginResponse.code === 200 && loginResponse.data) {
          storage.setToken(loginResponse.data.token);
          storage.setUser(loginResponse.data.user_info);
          navigate('/home');
        }
      } else {
        setError(response.message || '注册失败');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px', marginTop: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>
            创建账号
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px' }}>
            {step === 'email' && '请输入您的邮箱'}
            {step === 'verify' && '请输入验证码'}
            {step === 'register' && '完善账号信息'}
          </p>
        </div>

        <div className="card">
          {step === 'email' && (
            <>
              <h2 style={{ fontSize: '24px', marginBottom: '24px', textAlign: 'center' }}>
                邮箱验证
              </h2>
              <form onSubmit={handleSendCode}>
                <div className="input-group">
                  <label className="input-label">邮箱地址</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="请输入邮箱地址"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                {error && (
                  <div className="error-message">
                    <span>⚠️</span>
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="success-message">
                    <span>✅</span>
                    <span>{success}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  disabled={loading}
                  style={{ marginTop: '8px' }}
                >
                  {loading ? '发送中...' : '发送验证码'}
                </button>
              </form>
            </>
          )}

          {step === 'verify' && (
            <>
              <h2 style={{ fontSize: '24px', marginBottom: '24px', textAlign: 'center' }}>
                验证码验证
              </h2>
              <form onSubmit={handleVerifyCode}>
                <div className="input-group">
                  <label className="input-label">验证码</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="请输入6位验证码"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    maxLength={6}
                    required
                  />
                  <div style={{ marginTop: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    验证码已发送至: {formData.email}
                  </div>
                </div>

                {error && (
                  <div className="error-message">
                    <span>⚠️</span>
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="success-message">
                    <span>✅</span>
                    <span>{success}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  disabled={loading}
                  style={{ marginTop: '8px' }}
                >
                  {loading ? '验证中...' : '验证验证码'}
                </button>

                <button
                  type="button"
                  className="btn btn-block"
                  disabled={countdown > 0 || loading}
                  onClick={handleSendCode}
                  style={{
                    marginTop: '12px',
                    background: 'transparent',
                    border: '2px solid var(--primary-color)',
                    color: 'var(--primary-color)'
                  }}
                >
                  {countdown > 0 ? `重新发送 (${countdown}s)` : '重新发送验证码'}
                </button>
              </form>
            </>
          )}

          {step === 'register' && (
            <>
              <h2 style={{ fontSize: '24px', marginBottom: '24px', textAlign: 'center' }}>
                完善信息
              </h2>
              <form onSubmit={handleRegister}>
                <div className="input-group">
                  <label className="input-label">用户名</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="请输入用户名（3-50个字符）"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    minLength={3}
                    maxLength={50}
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">密码</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="请输入密码（至少6位）"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    minLength={6}
                    maxLength={50}
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">确认密码</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="请再次输入密码"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                  />
                </div>

                {error && (
                  <div className="error-message">
                    <span>⚠️</span>
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  disabled={loading}
                  style={{ marginTop: '8px' }}
                >
                  {loading ? '注册中...' : '完成注册'}
                </button>
              </form>
            </>
          )}

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <span style={{ color: 'var(--text-secondary)' }}>已有账号？</span>
            <Link
              to="/login"
              style={{
                color: 'var(--primary-color)',
                textDecoration: 'none',
                fontWeight: '600',
                marginLeft: '8px'
              }}
            >
              立即登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
