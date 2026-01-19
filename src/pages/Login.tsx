import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../services/api';
import { storage } from '../utils/storage';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.login(formData);
      if (response.code === 200 && response.data) {
        storage.setToken(response.data.token);
        storage.setUser(response.data.user_info);
        navigate('/home');
      } else {
        setError(response.message || '登录失败');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px', marginTop: '60px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💰</div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>
            记账助手
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px' }}>
            轻松管理您的每一笔收支
          </p>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '24px', marginBottom: '24px', textAlign: 'center' }}>
            登录
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">用户名</label>
              <input
                type="text"
                className="input"
                placeholder="请输入用户名"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">密码</label>
              <input
                type="password"
                className="input"
                placeholder="请输入密码"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <span style={{ color: 'var(--text-secondary)' }}>还没有账号？</span>
            <Link
              to="/register"
              style={{
                color: 'var(--primary-color)',
                textDecoration: 'none',
                fontWeight: '600',
                marginLeft: '8px'
              }}
            >
              立即注册
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
