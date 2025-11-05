import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user } = useAuth();
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="burger" aria-label="Open menu" onClick={onMenuClick}>
          <span />
          <span />
          <span />
        </button>
        <span>PlacementPrep</span>
      </div>
      <div className="topbar-center">
        <input className="search" placeholder="Search interviews, companies..." />
      </div>
      <div className="topbar-right">
        <button className="icon-btn" aria-label="Notifications">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 17h5l-1.4-1.4A2 2 0 0118 14.172V11a6 6 0 10-12 0v3.172a2 2 0 01-.6 1.428L4 17h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M9 17a3 3 0 006 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <div className="user-pill">
          <div className="avatar">{user?.username?.[0]?.toUpperCase() || 'U'}</div>
          <span className="name">{user?.username || 'User'}</span>
        </div>
      </div>
    </header>
  );
}


