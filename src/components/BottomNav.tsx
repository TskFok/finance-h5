import { useNavigate } from 'react-router-dom';

export type BottomNavKey = 'home' | 'stats' | 'ai';

export default function BottomNav({ active }: { active: BottomNavKey }) {
  const navigate = useNavigate();
  return (
    <div className="bottom-nav">
      <button
        className={`nav-item ${active === 'home' ? 'active' : ''}`}
        onClick={() => navigate('/home')}
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <div className="nav-item-icon">💸</div>
        <div>明细</div>
      </button>
      <button
        className={`nav-item ${active === 'stats' ? 'active' : ''}`}
        onClick={() => navigate('/stats')}
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <div className="nav-item-icon">📊</div>
        <div>统计</div>
      </button>
      <button
        className={`nav-item ${active === 'ai' ? 'active' : ''}`}
        onClick={() => navigate('/ai')}
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <div className="nav-item-icon">🤖</div>
        <div>AI</div>
      </button>
    </div>
  );
}

