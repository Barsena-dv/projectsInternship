import { useEffect, useRef, useState } from 'react';
import { FiBell, FiLogOut, FiMenu, FiMoon, FiSearch, FiSun, FiUser, FiX } from 'react-icons/fi';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { notificationApi } from '../../services/api';
import { formatDate } from '../../utils/helpers';
import { resolveNotificationTarget } from '../../utils/notificationRouting';

const NAV_LINKS = [
  { label: 'Dashboard',      to: '/owner/dashboard' },
  { label: 'My Requests',    to: '/owner/requests' },
  { label: 'Create Request', to: '/owner/create-request' },
  { label: 'Payments',       to: '/owner/payments' },
];

const OwnerNavbar = ({ darkMode, onToggleDark }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 2);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

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

  const initials = (name) => name ? name.trim().split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() : 'U';

  const navStyle = {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    background: scrolled ? 'rgba(15, 23, 42, 0.7)' : 'rgba(15, 23, 42, 0.3)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
    boxShadow: scrolled ? '0 10px 30px rgba(0,0,0,0.5)' : 'none',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    fontFamily: "'Inter', -apple-system, sans-serif",
  };

  const dropdownStyle = {
    position: 'absolute',
    right: 0,
    top: '56px',
    background: 'rgba(15, 23, 42, 0.85)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset',
    zIndex: 200,
    overflow: 'hidden',
    color: '#f8fafc',
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes navDropIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
        .onav-link:hover { color: #e2e8f0 !important; background: rgba(255,255,255,0.07) !important; }
        .onav-iconbtn:hover { background: rgba(255,255,255,0.08) !important; color: #e2e8f0 !important; }
        .onav-profile-btn:hover { background: rgba(255,255,255,0.07) !important; }
        .onav-dd-item:hover { background: #f9fafb; }
        .onav-notif-row:hover { background: #f9fafb; }
        .onav-notif-row { cursor:pointer; display:flex; align-items:flex-start; gap:0.625rem; padding:0.6rem 1rem; border:none; background:transparent; width:100%; text-align:left; transition:background 0.12s; }
      `}</style>

      <header style={navStyle}>
        <div style={{ maxWidth: '1440px', width: '100%', margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', gap: '0' }}>

          {/* Logo */}
          <Link to="/owner/dashboard" style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.03em', color: '#f1f5f9', textDecoration: 'none', flexShrink: 0, marginRight: '2rem', display: 'flex', alignItems: 'center', gap: '2px' }}>
            <span style={{ background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', borderRadius: '6px', width: '22px', height: '22px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', marginRight: '6px', fontWeight: 900, boxShadow: '0 2px 8px rgba(245,158,11,0.4)', color: '#1c1917' }}>P</span>
            Post<span style={{ color: '#fbbf24' }}>N</span>Find
          </Link>

          {/* Nav links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                style={({ isActive }) => ({
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#ffffff' : '#94a3b8',
                  textDecoration: 'none',
                  padding: '0.4rem 0.875rem',
                  borderRadius: '10px',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                  border: isActive ? '1px solid rgba(255,255,255,0.05)' : '1px solid transparent',
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
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.08)', borderRadius: '8px', padding: '0 0.7rem', border: '1px solid rgba(245,158,11,0.4)', gap: '0.4rem', height: '34px', minWidth: '200px' }}>
                <FiSearch size={13} color="#94a3b8" />
                <input
                  autoFocus
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  placeholder="Search…"
                  style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.82rem', color: '#f1f5f9', width: '100%', fontFamily: 'inherit' }}
                />
                <button type="button" onClick={() => { setSearchOpen(false); setSearchVal(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', padding: 0 }}>
                  <FiX size={13} />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setSearchOpen(true)}
                className="onav-iconbtn"
                style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', transition: 'all 0.15s' }}
              >
                <FiSearch size={15} />
              </button>
            )}

            {/* Dark mode */}
            <button type="button" onClick={onToggleDark}
              className="onav-iconbtn"
              style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', transition: 'all 0.15s' }}
            >
              {darkMode ? <FiSun size={15} /> : <FiMoon size={15} />}
            </button>

            {/* Notifications */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button type="button" onClick={() => { setNotifOpen((p) => !p); setProfileOpen(false); }}
                className="onav-iconbtn"
                style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: 'none', background: notifOpen ? 'rgba(255,255,255,0.08)' : 'transparent', color: notifOpen ? '#e2e8f0' : '#94a3b8', cursor: 'pointer', transition: 'all 0.15s', position: 'relative' }}
              >
                <FiBell size={15} />
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: '4px', right: '4px', width: '8px', height: '8px', background: '#f59e0b', borderRadius: '50%', border: '2px solid #131929' }} />
                )}
              </button>

              {notifOpen && (
                <div style={{ ...dropdownStyle, width: '340px', animation: 'navDropIn 180ms ease both' }}>
                  <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem' }}>{user.full_name}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>{user.email}</p>
                  </div>
                  <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>Notifications</span>
                      {unreadCount > 0 && <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', fontWeight: 700, color: '#1c1917', background: '#f59e0b', borderRadius: '100px', padding: '1px 6px' }}>{unreadCount}</span>}
                    </div>
                    <button type="button" onClick={() => { setNotifOpen(false); navigate('/notifications'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.775rem', color: '#fbbf24', fontWeight: 600, fontFamily: 'inherit' }}>
                      View all
                    </button>
                  </div>
                  <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                    {loading
                      ? <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.82rem', padding: '1.5rem 0', margin: 0 }}>Loading…</p>
                      : items.length === 0
                        ? <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.82rem', padding: '1.5rem 0', margin: 0 }}>No notifications yet</p>
                        : items.map((n) => (
                          <button
                            key={n._id}
                            type="button"
                            className="onav-notif-row"
                            style={{ background: n.isRead ? 'transparent' : '#fafafa' }}
                            onClick={() => { markRead(n._id); setNotifOpen(false); navigate(resolveNotificationTarget(n, user?.role)); }}
                          >
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.85rem' }}>🔔</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</p>
                              <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#9ca3af' }}>{formatDate(n.createdAt)}</p>
                            </div>
                            {!n.isRead && <span style={{ width: '6px', height: '6px', background: '#f59e0b', borderRadius: '50%', flexShrink: 0, marginTop: '6px' }} />}
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
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem 0.5rem', borderRadius: '8px', transition: 'background 0.15s' }}
              >
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fde68a', fontWeight: 700, fontSize: '0.75rem', border: '1px solid rgba(245,158,11,0.3)', flexShrink: 0 }}>
                  {initials(user?.full_name)}
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {(user?.full_name || user?.email || 'User').split(' ')[0]}
                </span>
              </button>

              {profileOpen && (
                <div style={{ ...dropdownStyle, width: '220px', animation: 'navDropIn 180ms ease both' }}>
                  <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem' }}>{user?.full_name || 'User'}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>{user?.email}</p>
                  </div>
                  <div style={{ padding: '0.4rem' }}>
                    <Link to="/owner/profile" onClick={() => setProfileOpen(false)} style={{ display: 'block', padding: '0.5rem 0.75rem', fontSize: '0.82rem', color: '#cbd5e1', textDecoration: 'none', borderRadius: '6px' }} onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.05)'; e.target.style.color = '#fff' }} onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#cbd5e1' }}>Profile Settings</Link>
                    <button onClick={() => { logout(); navigate('/login'); }} style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.82rem', color: '#fca5a5', background: 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '2px' }} onMouseEnter={(e) => { e.target.style.background = 'rgba(239,68,68,0.1)' }} onMouseLeave={(e) => { e.target.style.background = 'transparent' }}>
                      <FiLogOut size={14} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default OwnerNavbar;
