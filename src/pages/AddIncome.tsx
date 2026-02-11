import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { incomeApi, incomeCategoryApi } from '../services/api';
import { getTodayDate, formatDateTimeForAPI, formatDateTimeForInput } from '../utils/format';
import type { IncomeCategory } from '../types';

export default function AddIncome() {
  const navigate = useNavigate();
  const [incomeCategories, setIncomeCategories] = useState<IncomeCategory[]>([]);
  const [formData, setFormData] = useState({
    amount: '',
    type: '',
    income_time: getTodayDate()
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryError, setCategoryError] = useState('');

  useEffect(() => {
    loadIncomeCategories();
  }, []);

  const loadIncomeCategories = async () => {
    setLoadingCategories(true);
    setCategoryError('');
    try {
      const response = await incomeCategoryApi.getList();
      if (response.code === 200 && response.data) {
        setIncomeCategories(response.data);
        if (response.data.length > 0) {
          setFormData(prev => ({ ...prev, type: response.data[0].name }));
        } else {
          setCategoryError('暂无可用收入类型');
        }
      } else {
        setCategoryError(response.message || '加载收入类型失败');
      }
    } catch (err: any) {
      console.error('加载收入类型失败', err);
      setCategoryError(err.response?.data?.message || '加载收入类型失败，请稍后重试');
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('请输入有效的金额');
      return;
    }

    if (!formData.type) {
      setError('请选择收入类型');
      return;
    }

    setLoading(true);

    try {
      const response = await incomeApi.create({
        amount: parseFloat(formData.amount),
        type: formData.type,
        income_time: formData.income_time
      });

      if (response.code === 200) {
        navigate('/home', { replace: true, state: { refreshAt: Date.now() } });
      } else {
        setError(response.message || '创建失败');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ padding: '0', width: '100%' }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '100%',
        padding: '20px 16px',
        margin: '0 auto'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '24px', 
          marginTop: '10px',
          padding: '0 4px'
        }}>
          <button
            onClick={() => navigate('/home')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '2rem',
              cursor: 'pointer',
              color: 'white',
              marginRight: '12px',
              padding: '8px',
              minWidth: '44px',
              minHeight: '44px'
            }}
          >
            ←
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'white', flex: 1 }}>记录收入</h1>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">金额 *</label>
              <input
                type="number"
                className="input"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                step="0.01"
                min="0.01"
                required
                style={{ fontSize: '2rem', fontWeight: 'bold' }}
              />
            </div>

            <div className="input-group">
              <label className="input-label">收入类型 *</label>
              {loadingCategories ? (
                <div style={{ padding: '14px 16px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                  正在加载收入类型...
                </div>
              ) : categoryError ? (
                <div>
                  <select className="select" disabled value="">
                    <option value="">加载失败</option>
                  </select>
                  <div className="error-message" style={{ marginTop: '8px' }}>
                    <span>⚠️</span>
                    <span>{categoryError}</span>
                    <button
                      type="button"
                      onClick={loadIncomeCategories}
                      style={{
                        marginLeft: '12px',
                        background: 'var(--primary-color)',
                        color: 'white',
                        border: 'none',
                        padding: '4px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      重试
                    </button>
                  </div>
                </div>
              ) : incomeCategories.length === 0 ? (
                <div style={{ padding: '16px 18px', color: 'var(--text-secondary)', textAlign: 'center', fontSize: '1rem' }}>
                  暂无可用收入类型
                </div>
              ) : (
                <select
                  className="select"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  {incomeCategories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="input-group">
              <label className="input-label">时间 *</label>
              <input
                type="datetime-local"
                className="input"
                value={formatDateTimeForInput(formData.income_time)}
                onChange={(e) => {
                  const apiFormat = formatDateTimeForAPI(e.target.value);
                  setFormData({ ...formData, income_time: apiFormat });
                }}
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
              className="btn btn-success btn-block"
              disabled={loading || loadingCategories || !!categoryError || incomeCategories.length === 0}
              style={{ marginTop: '8px' }}
            >
              {loading ? '保存中...' : '💾 保存收入'}
            </button>
          </form>
        </div>

        {/* 快速金额按钮 */}
        <div className="card" style={{ marginTop: '16px', width: '100%' }}>
          <div className="input-label" style={{ marginBottom: '12px' }}>快速输入</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', width: '100%' }}>
            {[100, 500, 1000, 2000, 5000, 10000].map((amount) => (
              <button
                key={amount}
                type="button"
                className="btn"
                onClick={() => setFormData({ ...formData, amount: amount.toString() })}
                style={{
                  background: 'var(--card-bg)',
                  border: '2px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '16px 12px',
                  fontSize: '1.125rem',
                  width: '100%'
                }}
              >
                ¥{amount}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
