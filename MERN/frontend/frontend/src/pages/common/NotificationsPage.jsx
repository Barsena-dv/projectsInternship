import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import { notificationApi } from '../../services/api';
import { formatDate, getErrorMessage } from '../../utils/helpers';

const NotificationsPage = () => {
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

  const markAll = async () => {
    try {
      await notificationApi.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Stay updated with assignment and payment events"
        actions={(
          <button className="pnf-btn-outline rounded-lg px-3 py-2 text-sm" onClick={markAll} type="button">
            Mark all as read
          </button>
        )}
      />

      {loading ? <LoadingSpinner text="Loading notifications..." /> : null}

      {!loading && items.length === 0 ? (
        <EmptyState title="No notifications yet" description="You are all caught up." />
      ) : null}

      {!loading && items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <article
              key={item._id}
              className={`pnf-card p-4 ${item.isRead ? 'opacity-80' : 'border-blue-200 bg-blue-50/30'}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                  <p className="mt-2 text-xs text-slate-500">{formatDate(item.createdAt)}</p>
                </div>

                {!item.isRead ? (
                  <button
                    className="pnf-btn-outline rounded-lg px-3 py-1.5 text-xs"
                    type="button"
                    onClick={() => markRead(item._id)}
                  >
                    Mark as read
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
