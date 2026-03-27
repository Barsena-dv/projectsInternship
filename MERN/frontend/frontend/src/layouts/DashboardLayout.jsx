import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import RoleSidebar from '../components/common/RoleSidebar';
import TopNavbar from '../components/common/TopNavbar';
import OwnerNavbar from '../components/layout/OwnerNavbar';
import { useAuth } from '../hooks/useAuth';

import '../styles/auth.css'; // Import the background mesh animations

const DashboardLayout = () => {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const isOwner = user?.role === 'owner';

  if (isOwner) {
    return (
      <div className="owner-dashboard-wrapper" style={{ minHeight: '100dvh', background: 'var(--bg)', color: 'var(--text-1)', position: 'relative' }}>
        <div className="pnf-auth-bg" />
        <OwnerNavbar darkMode={darkMode} onToggleDark={() => setDarkMode((p) => !p)} />
        <main style={{ position: 'relative', zIndex: 10, maxWidth: '1440px', margin: '0 auto', padding: '2rem 1.5rem' }}>
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      <TopNavbar />
      <div className="mx-auto grid max-w-300 gap-4 px-4 py-4 md:grid-cols-[240px_1fr] md:px-6">
        <RoleSidebar role={user?.role} />
        <main className="pnf-page-enter">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
