import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiBell, FiCheckCircle, FiMessageSquare } from 'react-icons/fi';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../hooks/useAuth';
import { notificationApi } from '../../services/api';
import { formatDate, getErrorMessage } from '../../utils/helpers';
import { resolveNotificationTarget } from '../../utils/notificationRouting';
import '../../styles/owner/dashboard.css';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationApi.my();
      setItems(res.data || []);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markRead = async (id) => {
    try {
      await notificationApi.markRead(id);
      setItems((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const openNotification = async (item) => {
    try {
      if (!item?.isRead && item?._id) {
        await notificationApi.markRead(item._id);
        setItems((prev) => prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n)));
      }
    } catch {
      // Navigate even if mark read fails.
    }

    navigate(resolveNotificationTarget(item, user?.role));
  };

  const markAll = async () => {
    try {
      await notificationApi.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (loading) return <LoadingSpinner text="Loading notifications..." />;

  return (
    <div className="owner-page-enter">
      <PageHeader
        title="Notifications"
        subtitle="Stay updated with assignment and payment events"
        actions={(
          <button 
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-stone-300 hover:text-amber-400 hover:border-amber-500/50 transition-all text-sm font-bold" 
            onClick={markAll} 
            type="button"
          >
            <FiCheckCircle size={16} />
            Mark all read
          </button>
        )}
      />

      {!loading && items.length === 0 ? (
        <div className="mt-12">
          <EmptyState title="No notifications yet" description="You are all caught up with your alerts." />
        </div>
      ) : null}

      {!loading && items.length > 0 ? (
        <div className="grid gap-3 owner-stagger max-w-4xl mx-auto mt-6">
          {items.map((item) => (
            <article
              key={item._id}
              className={`owner-section-card cursor-pointer p-4 group transition-all hover:translate-x-1 ${item.isRead ? 'opacity-60' : 'border-amber-500/30 bg-amber-500/5'}`}
              onClick={() => openNotification(item)}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${item.isRead ? 'bg-white/5 border-white/10 text-stone-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
                  {item.type === 'message' ? <FiMessageSquare size={18} /> : <FiBell size={18} />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className={`font-bold text-base truncate ${item.isRead ? 'text-stone-300' : 'text-white'}`}>{item.title}</h3>
                    <span className="text-[10px] uppercase tracking-wider text-stone-500 font-bold whitespace-nowrap mt-1">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-stone-400 line-clamp-2 leading-relaxed">{item.message}</p>
                </div>

                {!item.isRead ? (
                  <button
                    className="self-center p-2 rounded-lg bg-white/5 border border-white/10 text-stone-400 hover:text-amber-400 hover:border-amber-500/50 transition-all opacity-0 group-hover:opacity-100"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      markRead(item._id);
                    }}
                    title="Mark as read"
                  >
                    <FiCheckCircle size={14} />
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default NotificationsPage;
