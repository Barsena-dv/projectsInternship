import { useState } from 'react';
import OwnerNavbar from './OwnerNavbar';
import '../../styles/owner/dashboard.css';

const OwnerLayout = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('owner-theme') === 'dark';
  });

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('owner-theme', next ? 'dark' : 'light');
  };

  return (
    <div className={darkMode ? 'dark' : ''} style={{ minHeight: '100dvh', background: darkMode ? '#0f172a' : 'var(--bg-soft, #f8fafc)' }}>
      <OwnerNavbar darkMode={darkMode} onToggleDark={toggleDark} />
      <main
        className="owner-page-enter"
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '2rem 1.5rem',
          color: darkMode ? '#f1f5f9' : '#0f172a',
        }}
      >
        {children}
      </main>
    </div>
  );
};

export default OwnerLayout;
