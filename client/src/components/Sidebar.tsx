import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/interviews', label: 'Interviews' },
  { to: '/practice', label: 'Practice' },
  { to: '/resume', label: 'Resume' },
];

export default function Sidebar({ open = false, onClose }: { open?: boolean; onClose?: () => void }) {
  const { pathname } = useLocation();
  const { logout, user } = useAuth();
  
  const handleLogout = async () => {
    await logout();
    if (onClose) onClose();
  };
  return (
    <>
    {open && <div className="backdrop" onClick={onClose} />}
    <aside className={`sidebar ${open ? 'open overlay' : ''}`}>
      <div className="sidebar-top">
        <div className="brand">PP</div>
        <div className="sidebar-user">
          <div className="sidebar-avatar">{user?.username?.[0]?.toUpperCase() || 'U'}</div>
          <span className="sidebar-username">{user?.username || 'User'}</span>
        </div>
        <nav className="side-nav">
          {navItems.map((item) => (
            <Link key={item.to} to={item.to} className={`side-link ${pathname === item.to ? 'active' : ''}`} onClick={onClose}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="sidebar-bottom">
        <button className="side-btn" type="button" onClick={onClose}>Settings</button>
        <button className="side-btn danger" type="button" onClick={handleLogout}>Logout</button>
      </div>
    </aside>
    </>
  );
}


