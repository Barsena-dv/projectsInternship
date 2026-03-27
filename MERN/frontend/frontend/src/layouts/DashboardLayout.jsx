import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import RoleSidebar from '../components/common/RoleSidebar';
import TopNavbar from '../components/common/TopNavbar';
import OwnerNavbar from '../components/layout/OwnerNavbar';
import { useAuth } from '../hooks/useAuth';

import '../styles/auth.css'; // Import the background mesh animations

import '../styles/owner/dashboard.css';

const DashboardLayout = () => {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(true); // Default dark for owner
  const isOwner = user?.role === 'owner';

  const [scrolled, setScrolled] = useState(false);

  const handleScroll = (e) => {
    setScrolled(e.target.scrollTop > 5);
  };

  if (isOwner) {
    return (
      <div 
        className="owner-dashboard-wrapper" 
        onScroll={handleScroll}
        style={{ height: '100vh', overflowY: 'auto', background: '#1c1917', color: '#fffbeb', position: 'relative' }}
      >
        <div className="pnf-auth-bg" />
        <OwnerNavbar 
          darkMode={darkMode} 
          onToggleDark={() => setDarkMode((p) => !p)} 
          scrolledOverride={scrolled}
        />
        <main className="owner-page-enter" style={{ position: 'relative', zIndex: 10, maxWidth: '1440px', margin: '0 auto', padding: '2rem 1.5rem' }}>
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
