import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { expenseApi, incomeApi, authApi } from '../services/api';
import { storage } from '../utils/storage';
import { formatDateTime, formatMoney } from '../utils/format';
import { CategoryIcon } from '../utils/categoryIcons';
import type { Expense, Income } from '../types';

export default function Home() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [totalExpense, setTotalExpense] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);

  useEffect(() => {
    loadUser();
    loadData();
  }, [activeTab]);

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
      if (activeTab === 'expense') {
        const response = await expenseApi.getList({ page: 1, page_size: 20 });
        if (response.code === 200) {
          setExpenses(response.data.list);
          const total = response.data.list.reduce((sum, item) => sum + item.amount, 0);
          setTotalExpense(total);
        }
      } else {
        const response = await incomeApi.getList({ page: 1, page_size: 20 });
        if (response.code === 200) {
          setIncomes(response.data.list);
          const total = response.data.list.reduce((sum, item) => sum + item.amount, 0);
          setTotalIncome(total);
        }
      }
    } catch (err) {
      console.error('加载数据失败', err);
    } finally {
      setLoading(false);
    }
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
      <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', marginBottom: '20px' }}>
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
        <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '1.125rem', opacity: 0.9, marginBottom: '8px' }}>总支出</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{formatMoney(totalExpense)}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '1.125rem', opacity: 0.9, marginBottom: '8px' }}>总收入</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{formatMoney(totalIncome)}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '1.125rem', opacity: 0.9, marginBottom: '8px' }}>净收入</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {formatMoney(totalIncome - totalExpense)}
            </div>
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
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: activeTab === 'expense' ? 'var(--expense-color)' : 'var(--income-color)' }}>
              {formatMoney(total)}
            </div>
          </div>

          {currentList.map((item) => (
            <div key={item.id} className="list-item" style={{ display: 'flex', alignItems: 'flex-start' }}>
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
                  <div className={`amount-badge ${activeTab === 'expense' ? 'amount-expense' : 'amount-income'}`}>
                    {activeTab === 'expense' ? '-' : '+'}{formatMoney(item.amount)}
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

      {/* 底部导航 */}
      <div className="bottom-nav">
        <button
          className={`nav-item ${activeTab === 'expense' ? 'active' : ''}`}
          onClick={() => setActiveTab('expense')}
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <div className="nav-item-icon">💸</div>
          <div>支出</div>
        </button>
        <button
          className={`nav-item ${activeTab === 'income' ? 'active' : ''}`}
          onClick={() => setActiveTab('income')}
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <div className="nav-item-icon">💰</div>
          <div>收入</div>
        </button>
      </div>

      {/* 浮动按钮 */}
      <button
        className="fab"
        onClick={() => navigate(activeTab === 'expense' ? '/expense/add' : '/income/add')}
        title={`添加${activeTab === 'expense' ? '支出' : '收入'}`}
      >
        +
      </button>
    </div>
  );
}
