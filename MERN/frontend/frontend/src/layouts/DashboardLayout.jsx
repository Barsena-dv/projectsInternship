import { useEffect, useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import RoleSidebar from '../components/common/RoleSidebar';
import TopNavbar from '../components/common/TopNavbar';
import OwnerNavbar from '../components/layout/OwnerNavbar';
import FinderNavbar from '../components/layout/FinderNavbar';
import { useAuth } from '../hooks/useAuth';
import RoleBackground from '../components/layout/RoleBackground';

import '../styles/auth.css'; // Import the background mesh animations
import '../styles/owner/dashboard.css';
import '../styles/finder/dashboard.css';

const DashboardLayout = () => {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';
  const isFinder = user?.role === 'finder';

  const roleThemeKey = useMemo(() => `pnf-theme-${user?.role || 'default'}`, [user?.role]);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(roleThemeKey) !== 'light';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(roleThemeKey);
    if (!saved) {
      setDarkMode(true);
      return;
    }
    setDarkMode(saved !== 'light');
  }, [roleThemeKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(roleThemeKey, darkMode ? 'dark' : 'light');
  }, [roleThemeKey, darkMode]);

  const [scrolled, setScrolled] = useState(false);

  const handleScroll = (e) => {
    setScrolled(e.target.scrollTop > 5);
  };

  if (isOwner) {
    return (
      <div 
        className={`owner-dashboard-wrapper pnf-dark-scrollbar ${darkMode ? 'owner-theme-dark' : 'owner-theme-light'}`}
        onScroll={handleScroll}
        style={{ height: '100vh', overflowY: 'auto', color: 'var(--role-text-primary)', position: 'relative' }}
      >
        <RoleBackground />
        <OwnerNavbar 
          darkMode={darkMode} 
          onToggleDark={() => setDarkMode((p) => !p)} 
          scrolledOverride={scrolled}
        />
        <main className="owner-page-enter pnf-dashboard-main" style={{ position: 'relative', zIndex: 10 }}>
          <Outlet />
        </main>
      </div>
    );
  }

  if (isFinder) {
    return (
      <div 
        className={`finder-dashboard-wrapper pnf-dark-scrollbar ${darkMode ? 'finder-theme-dark' : 'finder-theme-light'}`}
        onScroll={handleScroll}
        style={{ height: '100vh', overflowY: 'auto', color: 'var(--role-text-primary)', position: 'relative' }}
      >
        <RoleBackground />
        <FinderNavbar 
          darkMode={darkMode} 
          onToggleDark={() => setDarkMode((p) => !p)} 
          scrolledOverride={scrolled}
        />
        <main className="finder-page-enter pnf-dashboard-main" style={{ position: 'relative', zIndex: 10 }}>
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh pnf-default-shell">
      <TopNavbar />
      <div className="mx-auto grid max-w-300 gap-4 px-4 py-4 md:grid-cols-[240px_1fr] md:px-6">
        <RoleSidebar role={user?.role} />
        <main className="pnf-page-enter pnf-default-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
