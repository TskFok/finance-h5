import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { expenseApi, incomeApi, authApi, statisticsApi } from '../services/api';
import { storage } from '../utils/storage';
import { formatDateTime, formatMoney, formatDate } from '../utils/format';
import { CategoryIcon } from '../utils/categoryIcons';
import type { Expense, Income } from '../types';
import BottomNav from '../components/BottomNav';

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [totalExpense, setTotalExpense] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [startTime, setStartTime] = useState<string>(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return formatDate(monthStart.toISOString());
  });
  const [endTime, setEndTime] = useState<string>(() => formatDate(new Date().toISOString()));
  const [showFilter, setShowFilter] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: number; type: 'expense' | 'income' } | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    loadData();
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, startTime, endTime, location.key]);

  const loadUser = async () => {
    try {
      const response = await authApi.getProfile();
      if (response.code === 200) {
        setUser(response.data);
        storage.setUser(response.data);
      }
    } catch (err) {
      console.error('获取用户信息失败', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = { page: 1, page_size: 100 };
      if (startTime) params.start_time = startTime;
      if (endTime) params.end_time = endTime;

      if (activeTab === 'expense') {
        const response = await expenseApi.getList(params);
        if (response.code === 200) setExpenses(response.data.list);
      } else {
        const response = await incomeApi.getList(params);
        if (response.code === 200) setIncomes(response.data.list);
      }
    } catch (err) {
      console.error('加载数据失败', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const params: any = {};
      if (startTime) params.start_time = startTime;
      if (endTime) params.end_time = endTime;
      const res = await statisticsApi.getSummary(Object.keys(params).length ? params : undefined);
      if (res.code === 200 && res.data) {
        setTotalExpense(Number(res.data.total_expense || 0));
        setTotalIncome(Number(res.data.total_income || 0));
      }
    } catch (err) {
      console.error('加载汇总失败', err);
    }
  };

  const setQuickFilter = (type: 'today' | 'week' | 'month' | 'all') => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (type) {
      case 'today':
        setStartTime(formatDate(today.toISOString()));
        setEndTime(formatDate(today.toISOString()));
        break;
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        setStartTime(formatDate(weekStart.toISOString()));
        setEndTime(formatDate(now.toISOString()));
        break;
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        setStartTime(formatDate(monthStart.toISOString()));
        setEndTime(formatDate(now.toISOString()));
        break;
      case 'all':
        setStartTime('');
        setEndTime('');
        break;
    }
    setShowFilter(false);
  };

  const clearFilter = () => {
    setStartTime('');
    setEndTime('');
    setShowFilter(false);
  };

  const handleDeleteClick = (id: number) => {
    setItemToDelete({ id, type: activeTab });
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setDeletingId(itemToDelete.id);
    try {
      if (itemToDelete.type === 'expense') {
        const response = await expenseApi.delete(itemToDelete.id);
        if (response.code === 200) {
          await loadData();
          await loadSummary();
        } else {
          alert(response.message || '删除失败');
        }
      } else {
        const response = await incomeApi.delete(itemToDelete.id);
        if (response.code === 200) {
          await loadData();
          await loadSummary();
        } else {
          alert(response.message || '删除失败');
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || '删除失败，请稍后重试');
    } finally {
      setDeletingId(null);
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setItemToDelete(null);
  };

  const handleLogout = () => {
    storage.clear();
    navigate('/login');
  };

  const currentList = activeTab === 'expense' ? expenses : incomes;
  const total = activeTab === 'expense' ? totalExpense : totalIncome;
  const isTodayFilter = startTime && endTime && startTime === endTime && startTime === formatDate(new Date().toISOString());
  const isAllFilter = !startTime && !endTime;

  return (
    <div className="page">
      <div className="app-bg-texture" />
      <div className="app-bg-gradient" />

      {/* 头部卡片 */}
      <div className="card" style={{ marginBottom: '20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 100, height: 100, background: 'linear-gradient(135deg, rgba(55,65,81,0.1) 0%, transparent 100%)', borderRadius: '0 0 0 100%', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div className="font-tech" style={{ fontSize: '0.7rem', letterSpacing: '0.2em', color: 'var(--text-dim)', marginBottom: '4px' }}>欢迎回来</div>
            <div className="font-display" style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user?.username || '用户'}</div>
          </div>
          <button
            onClick={handleLogout}
            className="btn"
            style={{ padding: '8px 16px', fontSize: '0.9rem' }}
          >
            退出
          </button>
        </div>
        <div className="home-summary-row">
          <div className="home-summary-col">
            <div className="home-summary-label">总支出</div>
            <div className="home-summary-amount" style={{ color: 'var(--expense-color)' }}>{formatMoney(totalExpense)}</div>
          </div>
          <div className="home-summary-col">
            <div className="home-summary-label">总收入</div>
            <div className="home-summary-amount" style={{ color: 'var(--income-color)' }}>{formatMoney(totalIncome)}</div>
          </div>
          <div className="home-summary-col">
            <div className="home-summary-label">净收入</div>
            <div className="home-summary-amount" style={{ color: totalIncome - totalExpense >= 0 ? 'var(--income-color)' : 'var(--expense-color)' }}>{formatMoney(totalIncome - totalExpense)}</div>
          </div>
        </div>
      </div>

      {/* 标签切换 */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('expense')}
          className="btn"
          style={{
            flex: 1,
            background: activeTab === 'expense' ? 'var(--expense-bg)' : 'var(--bg-card)',
            color: activeTab === 'expense' ? 'var(--expense-color)' : 'var(--text-muted)',
            border: activeTab === 'expense' ? '1px solid var(--expense-border)' : '1px solid var(--border-color)'
          }}
        >
          <i className="fa-solid fa-arrow-down" style={{ marginRight: '6px', fontSize: '0.9rem' }} />
          支出
        </button>
        <button
          onClick={() => setActiveTab('income')}
          className="btn"
          style={{
            flex: 1,
            background: activeTab === 'income' ? 'var(--income-bg)' : 'var(--bg-card)',
            color: activeTab === 'income' ? 'var(--income-color)' : 'var(--text-muted)',
            border: activeTab === 'income' ? '1px solid var(--income-border)' : '1px solid var(--border-color)'
          }}
        >
          <i className="fa-solid fa-arrow-up" style={{ marginRight: '6px', fontSize: '0.9rem' }} />
          收入
        </button>
      </div>

      {/* 时间筛选 */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showFilter ? '16px' : '0' }}>
          <div className="font-tech" style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)' }}>时间筛选</div>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.9rem' }}
          >
            {showFilter ? '收起' : '筛选'}
          </button>
        </div>

        {showFilter && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {(['today', 'week', 'month', 'all'] as const).map((type) => {
                const labels = { today: '今天', week: '本周', month: '本月', all: '全部' };
                const active = (type === 'today' && isTodayFilter) || (type === 'all' && isAllFilter);
                return (
                  <button
                    key={type}
                    onClick={() => setQuickFilter(type)}
                    className="btn"
                    style={{
                      background: active ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                      color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                      border: active ? '1px solid var(--border-subtle)' : '1px solid var(--border-color)',
                      padding: '10px 16px',
                      fontSize: '0.95rem'
                    }}
                  >
                    {labels[type]}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">开始时间</label>
                <input type="date" className="input" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">结束时间</label>
                <input type="date" className="input" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
              {(startTime || endTime) && (
                <button onClick={clearFilter} className="btn" style={{ marginTop: '8px' }}>
                  清除筛选
                </button>
              )}
            </div>
          </div>
        )}

        {(startTime || endTime) && !showFilter && (
          <div style={{ marginTop: '12px', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
            {startTime && endTime ? `${startTime} 至 ${endTime}` : startTime ? `从 ${startTime} 开始` : `至 ${endTime} 结束`}
          </div>
        )}
      </div>

      {/* 列表 */}
      {loading ? (
        <div className="loading">加载中...</div>
      ) : currentList.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <i className={`fa-solid ${activeTab === 'expense' ? 'fa-arrow-down' : 'fa-arrow-up'}`} />
          </div>
          <div style={{ marginBottom: '20px' }}>暂无{activeTab === 'expense' ? '支出' : '收入'}记录</div>
          <button
            className="btn btn-primary metal-shimmer"
            onClick={() => navigate(activeTab === 'expense' ? '/expense/add' : '/income/add')}
          >
            <i className="fa-solid fa-plus" style={{ marginRight: '8px' }} />
            添加第一条记录
          </button>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: '12px' }}>
            <div className="font-tech" style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '8px' }}>
              {activeTab === 'expense' ? '支出' : '收入'}总计
            </div>
            <div className="home-list-total-amount font-display" style={{ color: activeTab === 'expense' ? 'var(--expense-color)' : 'var(--income-color)' }}>
              {formatMoney(total)}
            </div>
          </div>

          {currentList.map((item) => (
            <div key={item.id} className="list-item" style={{ display: 'flex', alignItems: 'flex-start' }}>
              <div className="list-item-icon">
                <CategoryIcon
                  categoryName={activeTab === 'expense' ? (item as Expense).category : (item as Income).type}
                  size={24}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="list-item-header">
                  <div className="list-item-title">
                    {activeTab === 'expense' ? (item as Expense).category : (item as Income).type}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className={`amount-badge ${activeTab === 'expense' ? 'amount-expense' : 'amount-income'}`}>
                      {activeTab === 'expense' ? '-' : '+'}{formatMoney(item.amount)}
                    </div>
                    <button
                      onClick={() => handleDeleteClick(item.id)}
                      disabled={deletingId === item.id}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--expense-color)',
                        cursor: deletingId === item.id ? 'not-allowed' : 'pointer',
                        padding: '4px 8px',
                        fontSize: '1rem',
                        opacity: deletingId === item.id ? 0.5 : 1
                      }}
                      title="删除"
                    >
                      <i className="fa-solid fa-trash-can" />
                    </button>
                  </div>
                </div>
                <div className="list-item-meta">
                  {activeTab === 'expense' && (item as Expense).description && (
                    <div style={{ marginTop: '4px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      {(item as Expense).description}
                    </div>
                  )}
                  <div style={{ marginTop: '4px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                    {formatDateTime(activeTab === 'expense' ? (item as Expense).expense_time : (item as Income).income_time)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      <BottomNav active="home" addTarget={activeTab} />

      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
            <div className="font-display" style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>
              确认删除
            </div>
            <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
              确定要删除这条{activeTab === 'expense' ? '支出' : '收入'}记录吗？删除后无法恢复。
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleDeleteCancel} className="btn" style={{ flex: 1 }} disabled={deletingId !== null}>
                取消
              </button>
              <button onClick={handleDeleteConfirm} className="btn btn-danger" style={{ flex: 1 }} disabled={deletingId !== null}>
                {deletingId !== null ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
