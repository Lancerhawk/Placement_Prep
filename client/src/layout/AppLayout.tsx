import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useState } from 'react';
import './layout.css';

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div>
      <Sidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <Navbar onMenuClick={() => setMobileOpen(true)} />
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}


