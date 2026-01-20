import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { expenseApi, categoryApi } from '../services/api';
import { getTodayDate, formatDateTimeForAPI, formatDateTimeForInput } from '../utils/format';
import { CategoryIcon } from '../utils/categoryIcons';
import type { ExpenseCategory } from '../types';

export default function AddExpense() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    description: '',
    expense_time: getTodayDate()
  });
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryError, setCategoryError] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoadingCategories(true);
    setCategoryError('');
    try {
      const response = await categoryApi.getList();
      if (response.code === 200 && response.data) {
        // 接口已经按 sort 排序，直接使用
        setCategories(response.data);
        if (response.data.length > 0) {
          // 使用类别的 name 字段
          setFormData(prev => ({ ...prev, category: response.data[0].name }));
        } else {
          setCategoryError('暂无可用类别');
        }
      } else {
        setCategoryError(response.message || '加载类别失败');
      }
    } catch (err: any) {
      console.error('加载类别失败', err);
      setCategoryError(err.response?.data?.message || '加载类别失败，请稍后重试');
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

    if (!formData.category) {
      setError('请选择类别');
      return;
    }

    setLoading(true);

    try {
      const response = await expenseApi.create({
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description || undefined,
        expense_time: formData.expense_time
      });

      if (response.code === 200) {
        navigate('/home');
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
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'white', flex: 1 }}>记录支出</h1>
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
              <label className="input-label">类别 *</label>
              {loadingCategories ? (
                <div style={{ padding: '14px 16px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                  正在加载类别...
                </div>
              ) : categoryError ? (
                <div>
                  <select
                    className="select"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    disabled
                  >
                    <option value="">加载失败</option>
                  </select>
                  <div className="error-message" style={{ marginTop: '8px' }}>
                    <span>⚠️</span>
                    <span>{categoryError}</span>
                    <button
                      type="button"
                      onClick={loadCategories}
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
              ) : categories.length === 0 ? (
                <div style={{ padding: '16px 18px', color: 'var(--text-secondary)', textAlign: 'center', fontSize: '1rem' }}>
                  暂无可用类别
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <select
                    className="select"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    style={{ paddingLeft: '60px' }}
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {formData.category && (
                    <div 
                      className="category-icon" 
                      style={{ 
                        position: 'absolute', 
                        left: '12px', 
                        top: '50%', 
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none'
                      }}
                    >
                      <CategoryIcon categoryName={formData.category} size={24} />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="input-group">
              <label className="input-label">时间 *</label>
              <input
                type="datetime-local"
                className="input"
                value={formatDateTimeForInput(formData.expense_time)}
                onChange={(e) => {
                  const apiFormat = formatDateTimeForAPI(e.target.value);
                  setFormData({ ...formData, expense_time: apiFormat });
                }}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">备注</label>
              <textarea
                className="textarea"
                placeholder="添加备注信息（可选）"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
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
              {loading ? '保存中...' : '💾 保存支出'}
            </button>
          </form>
        </div>

        {/* 快速金额按钮 */}
        <div className="card" style={{ marginTop: '16px', width: '100%' }}>
          <div className="input-label" style={{ marginBottom: '12px' }}>快速输入</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', width: '100%' }}>
            {[10, 20, 50, 100, 200, 500].map((amount) => (
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
