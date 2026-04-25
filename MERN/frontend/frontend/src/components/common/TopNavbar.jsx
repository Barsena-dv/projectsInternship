import { useEffect, useState } from 'react';
import { FaBell } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { notificationApi } from '../../services/api';
import { formatDate } from '../../utils/helpers';
import { resolveNotificationTarget } from '../../utils/notificationRouting';

const TopNavbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnread = async () => {
    try {
      const res = await notificationApi.unreadCount();
      setUnreadCount(res?.data?.unreadCount || 0);
    } catch {
      setUnreadCount(0);
    }
  };

  const loadRecent = async () => {
    try {
      setLoading(true);
      const res = await notificationApi.my({ page: 1, limit: 6 });
      setItems(res?.data || []);
      setUnreadCount(res?.unreadCount || 0);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUnread();
  }, []);

  useEffect(() => {
    if (open) {
      loadRecent();
    }
  }, [open]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const markRead = async (id) => {
    try {
      await notificationApi.markRead(id);
      setItems((prev) => prev.map((item) => (item._id === id ? { ...item, isRead: true } : item)));
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch {
      // no-op
    }
  };

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/60 px-4 py-3 backdrop-blur-xl md:px-6">
      <div className="mx-auto flex max-w-300 items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-lg font-black tracking-tight text-cyan-300"
        >
          PostNFind
        </button>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              className="relative rounded-lg border border-white/15 bg-white/5 p-2 text-slate-200 hover:bg-white/10"
              onClick={() => setOpen((prev) => !prev)}
              aria-label="Open notifications"
            >
              <FaBell className="text-sm" />
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 rounded-full bg-rose-600 px-1.5 text-[10px] font-semibold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              ) : null}
            </button>

            {open ? (
              <div className="absolute right-0 top-11 z-30 w-90 rounded-xl border border-white/10 bg-slate-950/90 p-3 shadow-2xl backdrop-blur-xl">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-100">Notifications</h3>
                  <button
                    type="button"
                    className="text-xs font-medium text-cyan-300 hover:underline"
                    onClick={() => {
                      setOpen(false);
                      navigate('/notifications');
                    }}
                  >
                    View all
                  </button>
                </div>

                {loading ? <p className="py-4 text-center text-xs text-slate-400">Loading...</p> : null}

                {!loading && items.length === 0 ? <p className="py-4 text-center text-xs text-slate-400">No notifications</p> : null}

                {!loading && items.length > 0 ? (
                  <div className="max-h-90 space-y-2 overflow-auto">
                    {items.map((item) => (
                      <button
                        key={item._id}
                        type="button"
                        className={`w-full rounded-lg border p-2 text-left ${item.isRead ? 'border-white/10 bg-white/0' : 'border-cyan-300/30 bg-cyan-300/10'}`}
                        onClick={() => {
                          markRead(item._id);
                          setOpen(false);
                          navigate(resolveNotificationTarget(item, user?.role));
                        }}
                      >
                        <p className="text-xs font-semibold text-slate-100">{item.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-slate-300">{item.message}</p>
                        <p className="mt-1 text-[11px] text-slate-500">{formatDate(item.createdAt)}</p>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="text-right">
            <p className="text-sm font-medium text-slate-100">{user?.full_name || 'User'}</p>
            <p className="text-xs text-slate-400">{String(user?.role || '').toUpperCase()}</p>
          </div>
          <button
            type="button"
            className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/10"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
