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
        setCategories(response.data);
        if (response.data.length > 0) {
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
      <div className="app-bg-texture" />
      <div className="app-bg-gradient" />

      <div style={{ width: '100%', maxWidth: '100%', padding: '20px 20px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* 顶部栏 */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', marginTop: '10px', padding: '0 4px' }}>
          <button
            onClick={() => navigate('/home')}
            className="btn"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '10px 14px', minWidth: '44px', minHeight: '44px' }}
          >
            <i className="fa-solid fa-arrow-left" style={{ color: 'var(--text-primary)' }} />
          </button>
          <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', flex: 1, marginLeft: '16px' }}>
            记录支出
          </h1>
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
                style={{ fontSize: '1.75rem', fontWeight: 600, fontFamily: 'Space Grotesk, sans-serif' }}
              />
            </div>

            <div className="input-group">
              <label className="input-label">类别 *</label>
              {loadingCategories ? (
                <div style={{ padding: '16px', color: 'var(--text-muted)', textAlign: 'center' }}>正在加载类别...</div>
              ) : categoryError ? (
                <div>
                  <select className="select" value="" disabled>
                    <option>加载失败</option>
                  </select>
                  <div className="error-message" style={{ marginTop: '8px' }}>
                    <span>{categoryError}</span>
                    <button type="button" onClick={loadCategories} className="btn" style={{ marginLeft: '12px', padding: '4px 12px', fontSize: '0.85rem' }}>
                      重试
                    </button>
                  </div>
                </div>
              ) : categories.length === 0 ? (
                <div style={{ padding: '16px', color: 'var(--text-muted)', textAlign: 'center' }}>暂无可用类别</div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <select
                    className="select"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    style={{ paddingLeft: '56px' }}
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                  {formData.category && (
                    <div className="category-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                      <CategoryIcon categoryName={formData.category} size={22} />
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
                onChange={(e) => setFormData({ ...formData, expense_time: formatDateTimeForAPI(e.target.value) })}
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
                <i className="fa-solid fa-circle-exclamation" />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-block metal-shimmer" disabled={loading} style={{ marginTop: '8px' }}>
              {loading ? '保存中...' : <><i className="fa-solid fa-floppy-disk" style={{ marginRight: '8px' }} />保存支出</>}
            </button>
          </form>
        </div>

        {/* 快速金额 */}
        <div className="card" style={{ marginTop: '16px' }}>
          <div className="input-label" style={{ marginBottom: '12px' }}>快速输入</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {[10, 20, 50, 100, 200, 500].map((amount) => (
              <button
                key={amount}
                type="button"
                className="btn"
                onClick={() => setFormData({ ...formData, amount: amount.toString() })}
                style={{ padding: '14px', fontSize: '1rem' }}
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
