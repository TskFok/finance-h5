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
      if (startTime) {
        params.start_time = startTime;
      }
      if (endTime) {
        params.end_time = endTime;
      }

      if (activeTab === 'expense') {
        const response = await expenseApi.getList(params);
        if (response.code === 200) {
          setExpenses(response.data.list);
        }
      } else {
        const response = await incomeApi.getList(params);
        if (response.code === 200) {
          setIncomes(response.data.list);
        }
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

  // 快捷时间选择
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
          // 刷新列表和统计数据
          await loadData();
          await loadSummary();
        } else {
          alert(response.message || '删除失败');
        }
      } else {
        const response = await incomeApi.delete(itemToDelete.id);
        if (response.code === 200) {
          // 刷新列表和统计数据
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

  return (
    <div className="page">
      {/* 头部 */}
      <div className="card home-header-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '1rem', opacity: 0.9, marginBottom: '6px' }}>欢迎回来</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{user?.username || '用户'}</div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              padding: '10px 18px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            退出
          </button>
        </div>
        <div className="home-summary-row">
          <div className="home-summary-col">
            <div className="home-summary-label">总支出</div>
            <div className="home-summary-amount">{formatMoney(totalExpense)}</div>
          </div>
          <div className="home-summary-col">
            <div className="home-summary-label">总收入</div>
            <div className="home-summary-amount">{formatMoney(totalIncome)}</div>
          </div>
          <div className="home-summary-col">
            <div className="home-summary-label">净收入</div>
            <div className="home-summary-amount">{formatMoney(totalIncome - totalExpense)}</div>
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
            background: activeTab === 'expense' 
              ? 'linear-gradient(135deg, var(--expense-color), #EE5A52)' 
              : 'var(--card-bg)',
            color: activeTab === 'expense' ? 'white' : 'var(--text-primary)',
            border: activeTab === 'expense' ? 'none' : '2px solid var(--border-color)'
          }}
        >
          💸 支出
        </button>
        <button
          onClick={() => setActiveTab('income')}
          className="btn"
          style={{
            flex: 1,
            background: activeTab === 'income' 
              ? 'linear-gradient(135deg, var(--income-color), #40C057)' 
              : 'var(--card-bg)',
            color: activeTab === 'income' ? 'white' : 'var(--text-primary)',
            border: activeTab === 'income' ? 'none' : '2px solid var(--border-color)'
          }}
        >
          💰 收入
        </button>
      </div>

      {/* 时间筛选 */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showFilter ? '16px' : '0' }}>
          <div style={{ fontSize: '1.125rem', fontWeight: '600' }}>时间筛选</div>
          <button
            onClick={() => setShowFilter(!showFilter)}
            style={{
              background: 'var(--primary-color)',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            {showFilter ? '收起' : '筛选'}
          </button>
        </div>

        {showFilter && (
          <div>
            {/* 快捷选项 */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setQuickFilter('today')}
                className="btn"
                style={{
                  background: startTime && endTime && startTime === endTime && startTime === formatDate(new Date().toISOString())
                    ? 'var(--primary-color)' : 'var(--card-bg)',
                  color: startTime && endTime && startTime === endTime && startTime === formatDate(new Date().toISOString())
                    ? 'white' : 'var(--text-primary)',
                  border: '2px solid var(--border-color)',
                  padding: '10px 16px',
                  fontSize: '1rem'
                }}
              >
                今天
              </button>
              <button
                onClick={() => setQuickFilter('week')}
                className="btn"
                style={{
                  background: 'var(--card-bg)',
                  color: 'var(--text-primary)',
                  border: '2px solid var(--border-color)',
                  padding: '10px 16px',
                  fontSize: '1rem'
                }}
              >
                本周
              </button>
              <button
                onClick={() => setQuickFilter('month')}
                className="btn"
                style={{
                  background: 'var(--card-bg)',
                  color: 'var(--text-primary)',
                  border: '2px solid var(--border-color)',
                  padding: '10px 16px',
                  fontSize: '1rem'
                }}
              >
                本月
              </button>
              <button
                onClick={() => setQuickFilter('all')}
                className="btn"
                style={{
                  background: !startTime && !endTime ? 'var(--primary-color)' : 'var(--card-bg)',
                  color: !startTime && !endTime ? 'white' : 'var(--text-primary)',
                  border: '2px solid var(--border-color)',
                  padding: '10px 16px',
                  fontSize: '1rem'
                }}
              >
                全部
              </button>
            </div>

            {/* 自定义时间范围 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="input-group" style={{ marginBottom: '0' }}>
                <label className="input-label">开始时间</label>
                <input
                  type="date"
                  className="input"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  style={{ fontSize: '1.125rem' }}
                />
              </div>
              <div className="input-group" style={{ marginBottom: '0' }}>
                <label className="input-label">结束时间</label>
                <input
                  type="date"
                  className="input"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  style={{ fontSize: '1.125rem' }}
                />
              </div>
              {(startTime || endTime) && (
                <button
                  onClick={clearFilter}
                  className="btn"
                  style={{
                    background: 'var(--card-bg)',
                    color: 'var(--text-primary)',
                    border: '2px solid var(--border-color)',
                    marginTop: '8px'
                  }}
                >
                  清除筛选
                </button>
              )}
            </div>
          </div>
        )}

        {/* 显示当前筛选条件 */}
        {(startTime || endTime) && !showFilter && (
          <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(74, 144, 226, 0.1)', borderRadius: '8px', fontSize: '0.9375rem' }}>
            {startTime && endTime ? (
              <span>筛选范围: {startTime} 至 {endTime}</span>
            ) : startTime ? (
              <span>从 {startTime} 开始</span>
            ) : (
              <span>至 {endTime} 结束</span>
            )}
          </div>
        )}
      </div>

      {/* 列表 */}
      {loading ? (
        <div className="loading">加载中...</div>
      ) : currentList.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            {activeTab === 'expense' ? '💸' : '💰'}
          </div>
          <div>暂无{activeTab === 'expense' ? '支出' : '收入'}记录</div>
          <button
            className="btn btn-primary"
            onClick={() => navigate(activeTab === 'expense' ? '/expense/add' : '/income/add')}
            style={{ marginTop: '20px' }}
          >
            添加第一条记录
          </button>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '12px' }}>
              {activeTab === 'expense' ? '支出' : '收入'}总计
            </div>
            <div className="home-list-total-amount" style={{ fontWeight: 'bold', color: activeTab === 'expense' ? 'var(--expense-color)' : 'var(--income-color)' }}>
              {formatMoney(total)}
            </div>
          </div>

          {currentList.map((item) => (
            <div key={item.id} className="list-item" style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
              <div className="list-item-icon">
                <CategoryIcon 
                  categoryName={activeTab === 'expense' ? (item as Expense).category : (item as Income).type} 
                  size={28}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="list-item-header">
                  <div className="list-item-title">
                    {activeTab === 'expense' 
                      ? (item as Expense).category 
                      : (item as Income).type}
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
                        color: 'var(--danger-color)',
                        cursor: deletingId === item.id ? 'not-allowed' : 'pointer',
                        padding: '4px 8px',
                        fontSize: '1.25rem',
                        opacity: deletingId === item.id ? 0.5 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '32px',
                        minHeight: '32px'
                      }}
                      title="删除"
                    >
                      {deletingId === item.id ? '⏳' : '🗑️'}
                    </button>
                  </div>
                </div>
                <div className="list-item-meta">
                  <div>
                    {activeTab === 'expense' && (item as Expense).description && (
                      <div style={{ marginTop: '4px', fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
                        {(item as Expense).description}
                      </div>
                    )}
                    <div style={{ marginTop: '4px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {formatDateTime(activeTab === 'expense' ? (item as Expense).expense_time : (item as Income).income_time)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      <BottomNav active="home" />

      {/* 浮动按钮 */}
      <button
        className="fab"
        onClick={() => navigate(activeTab === 'expense' ? '/expense/add' : '/income/add')}
        title={`添加${activeTab === 'expense' ? '支出' : '收入'}`}
      >
        +
      </button>

      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '16px' }}>
              确认删除
            </div>
            <div style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              确定要删除这条{activeTab === 'expense' ? '支出' : '收入'}记录吗？删除后无法恢复。
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleDeleteCancel}
                className="btn"
                style={{
                  flex: 1,
                  background: 'var(--card-bg)',
                  color: 'var(--text-primary)',
                  border: '2px solid var(--border-color)'
                }}
                disabled={deletingId !== null}
              >
                取消
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="btn btn-danger"
                style={{ flex: 1 }}
                disabled={deletingId !== null}
              >
                {deletingId !== null ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
