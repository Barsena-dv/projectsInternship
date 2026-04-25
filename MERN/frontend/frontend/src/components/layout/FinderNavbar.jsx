import { useEffect, useRef, useState } from 'react';
import { FiBell, FiLogOut, FiMenu, FiMoon, FiSearch, FiSun, FiX } from 'react-icons/fi';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import Avatar from '../common/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { notificationApi } from '../../services/api';
import { formatDate } from '../../utils/helpers';
import { resolveNotificationTarget } from '../../utils/notificationRouting';

const NAV_LINKS = [
  { label: 'Discovery',      to: '/finder/dashboard' },
  { label: 'Available Jobs', to: '/finder/requests' },
  { label: 'My Assignments', to: '/finder/assignments' },
  { label: 'Secure Chat',    to: '/chat' },
];

const FinderNavbar = ({ darkMode, onToggleDark, scrolledOverride }) => {
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
        text: '#ecfeff',
        textMuted: '#cbd5e1',
        textSoft: '#94a3b8',
        surface: 'rgba(15, 23, 42, 0.9)',
        surfaceAlt: 'rgba(15, 23, 42, 0.96)',
        border: 'rgba(16, 185, 129, 0.2)',
        hover: 'rgba(16, 185, 129, 0.12)',
        accent: '#10b981',
        navIdle: '#94a3b8',
      }
    : {
        text: '#0f172a',
        textMuted: '#334155',
        textSoft: '#475569',
        surface: 'rgba(255, 255, 255, 0.88)',
        surfaceAlt: 'rgba(255, 255, 255, 0.96)',
        border: 'rgba(100, 116, 139, 0.28)',
        hover: 'rgba(148, 163, 184, 0.12)',
        accent: '#059669',
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
  };

  const dropdownStyle = {
    position: 'absolute',
    right: 0,
    top: '56px',
    background: theme.surfaceAlt,
    backdropFilter: 'blur(20px)',
    border: `1px solid ${theme.border}`,
    borderRadius: '16px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(16, 185, 129, 0.05) inset',
    zIndex: 200,
    overflow: 'hidden',
  };

  return (
    <>
      <style>{`
        @keyframes fNavDrop { from { opacity:0; transform:translateY(-8px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
        .fnav-link:hover { color: #fff !important; background: rgba(16, 185, 129, 0.08) !important; }
        .fnav-iconbtn:hover { background: rgba(16, 185, 129, 0.12) !important; color: #10b981 !important; }
        .fnav-notif-row { 
          cursor: pointer; display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.75rem 1rem; 
          border: none; background: transparent; width: 100%; text-align: left; transition: all 0.2s ease; 
          border-bottom: 1px solid rgba(16, 185, 129, 0.05);
        }
        .fnav-notif-row:hover { background: rgba(16, 185, 129, 0.05); transform: translateX(2px); }
        .fnav-notif-row.unread { background: rgba(16, 185, 129, 0.04); }
        .fnav-accent-dot { width: 6px; height: 6px; background: #10b981; border-radius: 50%; box-shadow: 0 0 8px rgba(16,185,129,0.6); }
        @media (max-width: 640px) {
          .fnav-profile-name { display: none !important; }
          .fnav-search-container { min-width: 140px !important; }
          .fnav-header-inner { padding: 0 1rem !important; gap: 0.5rem !important; }
          .fnav-logo-text { font-size: 1rem !important; margin-right: 0.5rem !important; }
        }
      `}</style>

      <header style={navStyle}>
        <div className="fnav-header-inner" style={{ maxWidth: '1440px', width: '100%', margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          
          <Link to="/finder/dashboard" className="fnav-logo-text" style={{ fontWeight: 900, fontSize: '1.2rem', color: theme.text, textDecoration: 'none', marginRight: '2.5rem', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.02em' }}>
            <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', width: '24px', height: '24px', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', fontSize: '0.75rem', fontWeight: 900 }}>F</div>
            Post<span style={{ color: '#10b981' }}>N</span>Find
          </Link>

          <nav className="pnf-nav-desktop items-center gap-1">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className="fnav-link"
                style={({ isActive }) => ({
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? theme.text : theme.navIdle,
                  textDecoration: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '12px',
                  transition: 'all 0.2s',
                  background: isActive ? theme.hover : 'transparent',
                  border: isActive ? `1px solid ${theme.border}` : '1px solid transparent',
                })}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div style={{ flex: 1 }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>


            {/* Search */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
               {searchOpen ? (
                  <div className="fnav-search-container" style={{ display: 'flex', alignItems: 'center', background: theme.hover, borderRadius: '10px', padding: '0 0.75rem', border: `1px solid ${theme.border}`, gap: '0.5rem', height: '36px', minWidth: '220px', animation: 'fNavDrop 0.2s ease' }}>
                    <FiSearch size={14} color={theme.accent} />
                    <input autoFocus placeholder="Find request..." style={{ background: 'transparent', border: 'none', outline: 'none', color: theme.text, fontSize: '0.85rem', width: '100%' }} value={searchVal} onChange={(e) => setSearchVal(e.target.value)} />
                    <FiX size={14} color="#64748b" style={{ cursor: 'pointer' }} onClick={() => {setSearchOpen(false); setSearchVal('');}} />
                 </div>
               ) : (
                  <button onClick={() => setSearchOpen(true)} className="fnav-iconbtn" style={{ background: 'transparent', border: 'none', color: theme.navIdle, padding: '8px', cursor: 'pointer', borderRadius: '10px' }}>
                    <FiSearch size={18} />
                 </button>
               )}
            </div>

            {/* Dark Mode */}
              <button onClick={onToggleDark} className="fnav-iconbtn" style={{ background: 'transparent', border: 'none', color: theme.navIdle, padding: '8px', cursor: 'pointer', borderRadius: '10px' }}>
               {darkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>

            {/* Notifications */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button onClick={() => setNotifOpen(!notifOpen)} className="fnav-iconbtn" style={{ background: 'transparent', border: 'none', color: notifOpen ? theme.accent : theme.navIdle, padding: '8px', cursor: 'pointer', borderRadius: '10px', position: 'relative' }}>
                <FiBell size={18} />
                {unreadCount > 0 && <span style={{ position: 'absolute', top: 6, right: 6, width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', border: '2px solid #0f172a' }} />}
              </button>
              {notifOpen && (
                <div style={{ ...dropdownStyle, width: '320px', animation: 'fNavDrop 0.2s ease' }}>
                  <div style={{ padding: '1rem', borderBottom: `1px solid ${theme.border}`, background: theme.hover }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: theme.text, display: 'flex', justifyContent: 'space-between' }}>
                      <span>Alert Center</span>
                      <Link to="/notifications" onClick={() => setNotifOpen(false)} style={{ color: theme.accent, textDecoration: 'none', fontSize: '0.75rem' }}>View All</Link>
                    </div>
                  </div>
                  <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                    {loading ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>Gathering intel...</div>
                    ) : items.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>All quiet on the radar</div>
                    ) : items.map(n => (
                      <button key={n._id} onClick={() => { markRead(n._id); setNotifOpen(false); navigate(resolveNotificationTarget(n, 'finder')); }} className={`fnav-notif-row ${!n.isRead ? 'unread' : ''}`}>
                        <div style={{ background: 'rgba(16,185,129,0.1)', width: '30px', height: '30px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0 }}>
                          {n.type === 'message' ? '💬' : '🛰️'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: n.isRead ? 500 : 700, color: n.isRead ? '#94a3b8' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>{formatDate(n.createdAt)}</div>
                        </div>
                        {!n.isRead && <div className="fnav-accent-dot" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div ref={profileRef} style={{ position: 'relative' }}>
              <button onClick={() => setProfileOpen(!profileOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Avatar src={user?.profileImage?.url || user?.profileImage} name={user?.full_name} size="sm" className="border border-emerald-500/20" />
                 <span className="fnav-profile-name" style={{ fontSize: '0.85rem', fontWeight: 600, color: theme.text }}>{user?.full_name?.split(' ')[0]}</span>
              </button>
              {profileOpen && (
                <div style={{ ...dropdownStyle, width: '200px', padding: '6px', animation: 'fNavDrop 0.2s ease' }}>
                   <div style={{ padding: '0.75rem', borderBottom: `1px solid ${theme.border}` }}>
                     <div style={{ fontSize: '0.85rem', fontWeight: 700, color: theme.text }}>{user?.full_name}</div>
                     <div style={{ fontSize: '0.7rem', color: theme.navIdle }}>{user?.role?.toUpperCase()}</div>
                   </div>
                   <div style={{ padding: '4px 0' }}>
                     <Link to="/profile" onClick={() => setProfileOpen(false)} style={{ display: 'block', padding: '8px 12px', color: theme.textMuted, textDecoration: 'none', fontSize: '0.8rem', borderRadius: '8px' }}>Discovery Settings</Link>
                      <button onClick={() => { logout(); navigate('/login'); }} style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '8px 12px', color: '#fca5a5', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                         <FiLogOut size={14} /> De-authenticate
                      </button>
                   </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              type="button" 
              className="pnf-nav-toggle fnav-iconbtn"
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
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', animation: 'fNavDrop 0.2s ease both' }} 
            onClick={() => setMobileMenuOpen(false)} 
          />
          {/* Sidebar */}
          <div style={{ position: 'relative', marginLeft: 'auto', width: '280px', maxWidth: '80%', height: '100%', background: theme.surfaceAlt, borderLeft: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', padding: '1.5rem', animation: 'fNavDrop 0.3s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
            <div className="flex flex-col w-full h-full">
              <div className="flex justify-between items-center mb-8">
                <span className="font-black text-white text-lg tracking-tight">Menu</span>
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
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? '#fff' : '#94a3b8',
                      textDecoration: 'none',
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      background: isActive ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                      border: isActive ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid transparent',
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
                    fontWeight: 700, 
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

export default FinderNavbar;
