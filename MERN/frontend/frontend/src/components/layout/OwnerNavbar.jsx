import { useEffect, useRef, useState } from 'react';
import { FiBell, FiLogOut, FiMenu, FiMoon, FiSearch, FiSun, FiUser, FiX } from 'react-icons/fi';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import Avatar from '../common/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { notificationApi } from '../../services/api';
import { formatDate } from '../../utils/helpers';
import { resolveNotificationTarget } from '../../utils/notificationRouting';

const NAV_LINKS = [
  { label: 'Dashboard',      to: '/owner/dashboard' },
  { label: 'My Requests',    to: '/owner/requests' },
  { label: 'Create Request', to: '/owner/create-request' },
  { label: 'Chat',           to: '/chat' },
];

const OwnerNavbar = ({ darkMode, onToggleDark, scrolledOverride }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    if (scrolledOverride !== undefined) {
      setScrolled(scrolledOverride);
    } else {
      const fn = () => setScrolled(window.scrollY > 2);
      window.addEventListener('scroll', fn, { passive: true });
      return () => window.removeEventListener('scroll', fn);
    }
  }, [scrolledOverride]);

  useEffect(() => {
    const fn = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  useEffect(() => {
    notificationApi.unreadCount().then((r) => setUnreadCount(r?.data?.unreadCount || 0)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!notifOpen) return;
    setLoading(true);
    notificationApi.my({ page: 1, limit: 8 })
      .then((r) => setItems(r?.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [notifOpen]);

  const markRead = async (id) => {
    try {
      await notificationApi.markRead(id);
      setItems((p) => p.map((n) => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount((p) => Math.max(p - 1, 0));
    } catch { /* no-op */ }
  };

  const theme = darkMode
    ? {
        text: '#fffbeb',
        textMuted: '#a8a29e',
        textSoft: '#d6d3d1',
        surface: 'rgba(28, 25, 23, 0.85)',
        surfaceAlt: 'rgba(28, 25, 23, 0.95)',
        border: 'rgba(255, 255, 255, 0.1)',
        borderSoft: 'rgba(255, 255, 255, 0.06)',
        hover: 'rgba(255,255,255,0.06)',
        accent: '#f59e0b',
        accentSoft: 'rgba(245, 158, 11, 0.1)',
        navIdle: '#a8a29e',
      }
    : {
        text: '#0f172a',
        textMuted: '#475569',
        textSoft: '#334155',
        surface: 'rgba(255, 255, 255, 0.85)',
        surfaceAlt: 'rgba(255, 255, 255, 0.96)',
        border: 'rgba(100, 116, 139, 0.25)',
        borderSoft: 'rgba(100, 116, 139, 0.18)',
        hover: 'rgba(148,163,184,0.12)',
        accent: '#d97706',
        accentSoft: 'rgba(217, 119, 6, 0.12)',
        navIdle: '#475569',
      };


  const navStyle = {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    width: '100%',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    background: scrolled ? theme.surface : theme.surfaceAlt,
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderBottom: scrolled ? `1px solid ${theme.border}` : '1px solid transparent',
    boxShadow: scrolled ? '0 10px 30px rgba(0,0,0,0.5)' : 'none',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    fontFamily: "'Inter', -apple-system, sans-serif",
  };

  const dropdownStyle = {
    position: 'absolute',
    right: 0,
    top: '56px',
    background: theme.surfaceAlt,
    backdropFilter: 'blur(20px)',
    border: `1px solid ${theme.border}`,
    borderRadius: '16px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset',
    zIndex: 200,
    overflow: 'hidden',
    color: theme.text,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes navDropIn { from { opacity:0; transform:translateY(-8px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
        .onav-link:hover { color: #fff !important; background: rgba(255, 255, 255, 0.05) !important; }
        .onav-iconbtn:hover { background: rgba(255, 255, 255, 0.08) !important; color: #fbbf24 !important; }
        .onav-profile-btn:hover { background: rgba(255, 255, 255, 0.05) !important; }
        .onav-notif-row { 
          cursor: pointer; 
          display: flex; 
          align-items: flex-start; 
          gap: 0.75rem; 
          padding: 0.75rem 1rem; 
          border: none; 
          background: transparent; 
          width: 100%; 
          text-align: left; 
          transition: all 0.2s ease; 
          border-bottom: 1px solid rgba(255,255,255,0.03);
        }
        .onav-notif-row:hover { background: rgba(255, 255, 255, 0.04); transform: translateX(2px); }
        .onav-notif-row.unread { background: rgba(245, 158, 11, 0.03); }
        .onav-notif-icon {
          width: 32px; 
          height: 32px; 
          border-radius: 8px; 
          background: rgba(255,255,255,0.05); 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          flex-shrink: 1; 
          border: 1px solid rgba(255,255,255,0.05);
        }
        @media (max-width: 640px) {
          .onav-profile-name { display: none !important; }
          .onav-search-container { min-width: 140px !important; }
          .onav-header-inner { padding: 0 1rem !important; gap: 0.5rem !important; }
          .onav-logo-text { font-size: 0.95rem !important; margin-right: 0.5rem !important; }
        }
      `}</style>

      <header style={navStyle}>
        <div className="onav-header-inner" style={{ maxWidth: '1440px', width: '100%', margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>

          {/* Logo */}
          <Link to="/owner/dashboard" className="onav-logo-text" style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.03em', color: theme.text, textDecoration: 'none', flexShrink: 0, marginRight: '2rem', display: 'flex', alignItems: 'center', gap: '2px' }}>
            <span style={{ background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', borderRadius: '6px', width: '22px', height: '22px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', marginRight: '6px', fontWeight: 900, boxShadow: '0 2px 8px rgba(245,158,11,0.4)', color: '#1c1917' }}>P</span>
            Post<span style={{ color: '#fbbf24' }}>N</span>Find
          </Link>

          {/* Nav links (Desktop) */}
          <nav className="pnf-nav-desktop items-center gap-1">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                style={({ isActive }) => ({
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? theme.text : theme.navIdle,
                  textDecoration: 'none',
                  padding: '0.4rem 0.875rem',
                  borderRadius: '10px',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  background: isActive ? theme.accentSoft : 'transparent',
                  border: isActive ? `1px solid ${theme.borderSoft}` : '1px solid transparent',
                  whiteSpace: 'nowrap',
                  boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
                })}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div style={{ flex: 1 }} />

          {/* Right tools */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>



            {/* Search */}
            {searchOpen ? (
              <div className="onav-search-container" style={{ display: 'flex', alignItems: 'center', background: theme.hover, borderRadius: '8px', padding: '0 0.7rem', border: `1px solid ${theme.border}`, gap: '0.4rem', height: '34px', minWidth: '200px' }}>
                <FiSearch size={13} color={theme.navIdle} />
                <input
                  autoFocus
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  placeholder="Search…"
                  style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.82rem', color: theme.text, width: '100%', fontFamily: 'inherit' }}
                />
                <button type="button" onClick={() => { setSearchOpen(false); setSearchVal(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', padding: 0 }}>
                  <FiX size={13} />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setSearchOpen(true)}
                className="onav-iconbtn"
                style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: 'none', background: 'transparent', color: theme.navIdle, cursor: 'pointer', transition: 'all 0.15s' }}
              >
                <FiSearch size={15} />
              </button>
            )}

            {/* Dark mode */}
            <button type="button" onClick={onToggleDark}
              className="onav-iconbtn"
              style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: 'none', background: 'transparent', color: theme.navIdle, cursor: 'pointer', transition: 'all 0.15s' }}
            >
              {darkMode ? <FiSun size={15} /> : <FiMoon size={15} />}
            </button>

            {/* Notifications */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button type="button" onClick={() => { setNotifOpen((p) => !p); setProfileOpen(false); }}
                className="onav-iconbtn"
                style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: 'none', background: notifOpen ? theme.hover : 'transparent', color: notifOpen ? theme.text : theme.navIdle, cursor: 'pointer', transition: 'all 0.15s', position: 'relative' }}
              >
                <FiBell size={15} />
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: '4px', right: '4px', width: '8px', height: '8px', background: '#f59e0b', borderRadius: '50%', border: '2px solid #131929' }} />
                )}
              </button>

              {notifOpen && (
                <div style={{ ...dropdownStyle, width: '340px', animation: 'navDropIn 180ms ease both' }}>
                  <div style={{ padding: '0.75rem 1rem', borderBottom: `1px solid ${theme.border}`, background: theme.hover }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem' }}>{user?.full_name || 'User'}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: theme.navIdle }}>{user?.email}</p>
                  </div>
                  <div style={{ padding: '0.875rem 1rem', borderBottom: `1px solid ${theme.borderSoft}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: theme.hover }}>
                    <div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: theme.text }}>Notifications</span>
                      {unreadCount > 0 && <span style={{ marginLeft: '0.5rem', fontSize: '0.65rem', fontWeight: 800, color: '#1c1917', background: '#f59e0b', borderRadius: '6px', padding: '1px 5px', verticalAlign: 'middle' }}>{unreadCount}</span>}
                    </div>
                    <button type="button" onClick={() => { setNotifOpen(false); navigate('/notifications'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: theme.accent, fontWeight: 600, fontFamily: 'inherit' }}>
                      View all
                    </button>
                  </div>
                  <div className="pnf-sidebar-scroll" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {loading
                      ? <p style={{ textAlign: 'center', color: '#78716c', fontSize: '0.8rem', padding: '2rem 0', margin: 0 }}>Discovering updates…</p>
                      : items.length === 0
                        ? <p style={{ textAlign: 'center', color: '#78716c', fontSize: '0.8rem', padding: '2rem 0', margin: 0 }}>No alerts at the moment</p>
                        : items.map((n) => (
                          <button
                            key={n._id}
                            type="button"
                            className={`onav-notif-row ${!n.isRead ? 'unread' : ''}`}
                            onClick={() => { markRead(n._id); setNotifOpen(false); navigate(resolveNotificationTarget(n, user?.role)); }}
                          >
                            <div className="onav-notif-icon">
                              {n.type === 'message' ? '💬' : '🔔'}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: n.isRead ? 500 : 700, color: n.isRead ? '#d6d3d1' : '#fffbeb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</p>
                              <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#78716c' }}>{formatDate(n.createdAt)}</p>
                            </div>
                            {!n.isRead && <span style={{ width: '6px', height: '6px', background: '#f59e0b', borderRadius: '50%', flexShrink: 0, marginTop: '6px', boxShadow: '0 0 8px rgba(245,158,11,0.4)' }} />}
                          </button>
                        ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div ref={profileRef} style={{ position: 'relative', marginLeft: '0.25rem' }}>
              <button type="button" onClick={() => { setProfileOpen((p) => !p); setNotifOpen(false); }}
                className="onav-profile-btn"
                style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem 0.5rem', borderRadius: '10px', transition: 'all 0.2s' }}
              >
                <Avatar 
                  src={user?.profileImage?.url || user?.profileImage} 
                  name={user?.full_name || 'User'} 
                  size="sm" 
                />
                <span className="onav-profile-name" style={{ fontSize: '0.82rem', fontWeight: 600, color: theme.text, whiteSpace: 'nowrap' }}>
                  {user?.full_name || user?.email || 'Account'}
                </span>
              </button>

              {profileOpen && (
                <div style={{ ...dropdownStyle, width: '220px', animation: 'navDropIn 180ms ease both' }}>
                  <div style={{ padding: '0.75rem 1rem', borderBottom: `1px solid ${theme.border}`, background: theme.hover }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem' }}>{user?.full_name || 'User'}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: theme.navIdle }}>{user?.email}</p>
                  </div>
                  <div style={{ padding: '0.4rem' }}>
                    <Link to="/owner/profile" onClick={() => setProfileOpen(false)} style={{ display: 'block', padding: '0.5rem 0.75rem', fontSize: '0.82rem', color: theme.textSoft, textDecoration: 'none', borderRadius: '6px' }} onMouseEnter={(e) => { e.target.style.background = theme.hover; e.target.style.color = theme.text }} onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = theme.textSoft }}>Profile Settings</Link>
                    <button onClick={() => { logout(); navigate('/login'); }} style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.82rem', color: '#fca5a5', background: 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '2px' }} onMouseEnter={(e) => { e.target.style.background = 'rgba(239,68,68,0.1)' }} onMouseLeave={(e) => { e.target.style.background = 'transparent' }}>
                      <FiLogOut size={14} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              type="button" 
              className="pnf-nav-toggle onav-iconbtn"
              onClick={() => setMobileMenuOpen(true)}
              style={{ border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer', transition: 'all 0.15s' }}
            >
              <FiMenu size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex' }}>
          {/* Backdrop */}
          <div 
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', animation: 'navDropIn 0.2s ease both' }} 
            onClick={() => setMobileMenuOpen(false)} 
          />
          {/* Sidebar */}
          <div style={{ position: 'relative', marginLeft: 'auto', width: '280px', maxWidth: '80%', height: '100%', background: theme.surfaceAlt, borderLeft: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'col', padding: '1.5rem', animation: 'navDropIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
            <div className="flex flex-col w-full h-full">
              <div className="flex justify-between items-center mb-8">
                <span className="font-black text-lg tracking-tight" style={{ color: theme.text }}>Menu</span>
                <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                  <FiX size={24} />
                </button>
              </div>
              <nav className="flex flex-col gap-2">
                {NAV_LINKS.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    style={({ isActive }) => ({
                      fontSize: '1rem',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? '#fff' : '#a8a29e',
                      textDecoration: 'none',
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      background: isActive ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                      border: isActive ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid transparent',
                    })}
                  >
                    {link.label}
                  </NavLink>
                ))}
              </nav>

              <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
                <button 
                  onClick={() => { logout(); navigate('/login'); }}
                  style={{ 
                    width: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem', 
                    padding: '0.875rem 1rem', 
                    fontSize: '1rem', 
                    fontWeight: 600, 
                    color: '#fca5a5', 
                    background: 'rgba(239, 68, 68, 0.05)', 
                    border: '1px solid rgba(239, 68, 68, 0.1)', 
                    borderRadius: '12px', 
                    cursor: 'pointer' 
                  }}
                >
                  <FiLogOut size={18} /> Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OwnerNavbar;
