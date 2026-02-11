import { useNavigate } from 'react-router-dom';

export type BottomNavKey = 'home' | 'stats' | 'ai';

export default function BottomNav({
  active,
  addTarget = 'expense'
}: {
  active: BottomNavKey;
  addTarget?: 'expense' | 'income';
}) {
  const navigate = useNavigate();

  const handleAddClick = () => {
    navigate(addTarget === 'income' ? '/income/add' : '/expense/add');
  };

  return (
    <nav className="bottom-nav">
      <button
        className={`nav-item ${active === 'home' ? 'active' : ''}`}
        onClick={() => navigate('/home')}
      >
        <i className="fa-solid fa-chart-pie nav-item-icon" />
        <span>明细</span>
      </button>

      <button
        className={`nav-item ${active === 'stats' ? 'active' : ''}`}
        onClick={() => navigate('/stats')}
      >
        <i className="fa-solid fa-chart-line nav-item-icon" />
        <span>统计</span>
      </button>

      <button
        className="nav-center-btn metal-shimmer"
        onClick={handleAddClick}
        title="添加记录"
      >
        <i className="fa-solid fa-plus" />
      </button>

      <button
        className={`nav-item ${active === 'ai' ? 'active' : ''}`}
        onClick={() => navigate('/ai')}
      >
        <i className="fa-solid fa-robot nav-item-icon" />
        <span>AI</span>
      </button>
    </nav>
  );
}
