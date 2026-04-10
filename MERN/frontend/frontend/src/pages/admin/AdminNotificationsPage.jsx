import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiSend, FiTarget } from 'react-icons/fi';
import { toast } from 'react-toastify';
import EmptyState from '../../components/common/EmptyState';
import GlassModal from '../../components/common/GlassModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import { adminApi } from '../../services/api';
import { formatDate, getErrorMessage, titleCase } from '../../utils/helpers';

const AdminNotificationsPage = () => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({ unreadCount: 0, failedCount: 0, byType: [] });
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [broadcastModal, setBroadcastModal] = useState({ open: false, title: '', message: '', type: 'system' });

  const loadRows = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.notifications({ limit: 120, unreadOnly });
      const data = res?.data || {};
      setRows(data.rows || []);
      setStats({
        unreadCount: data.unreadCount || 0,
        failedCount: data.failedCount || 0,
        byType: data.byType || [],
      });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [unreadOnly]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const sendBroadcast = async () => {
    try {
      if (!broadcastModal.title.trim() || !broadcastModal.message.trim()) {
        toast.error('Title and message are required.');
        return;
      }

      await adminApi.broadcastNotification({
        title: broadcastModal.title,
        message: broadcastModal.message,
        type: broadcastModal.type,
      });

      toast.success('Broadcast notification sent.');
      setBroadcastModal({ open: false, title: '', message: '', type: 'system' });
      await loadRows();
    } catch (error) {
      toast.error(`Broadcast endpoint unavailable: ${getErrorMessage(error)}`);
    }
  };

  const topTypes = useMemo(() => stats.byType.slice(0, 5), [stats.byType]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification Control"
        subtitle="Observe delivery pipeline, send broadcast system alerts, and monitor unread pressure"
        actions={(
          <button
            type="button"
            onClick={() => setBroadcastModal({ open: true, title: '', message: '', type: 'system' })}
            className="px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-500/20"
          >
            <FiSend /> Broadcast Alert
          </button>
        )}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <article className="admin-card">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Unread Notifications</p>
          <p className="text-3xl text-amber-400 font-black mt-2">{stats.unreadCount}</p>
        </article>
        <article className="admin-card">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Delivery Failures</p>
          <p className="text-3xl text-rose-400 font-black mt-2">{stats.failedCount}</p>
        </article>
        <article className="admin-card">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Loaded Rows</p>
          <p className="text-3xl text-white font-black mt-2">{rows.length}</p>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <article className="admin-card xl:col-span-2 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Notification Stream</h3>
            <label className="text-xs text-slate-300 flex items-center gap-2">
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(event) => setUnreadOnly(event.target.checked)}
              />
              Unread only
            </label>
          </div>

          {loading ? <LoadingSpinner /> : null}
          {!loading && rows.length === 0 ? <EmptyState title="No notifications" description="No records found for current monitoring filters." /> : null}

          {!loading && rows.length > 0 ? (
            <div className="overflow-y-auto custom-scrollbar pr-2 space-y-2" style={{ maxHeight: '580px' }}>
              {rows.map((row) => (
                <section key={row._id} className="p-4 rounded-xl border border-white/5 bg-white/5">
                  <div className="flex justify-between items-center gap-3">
                    <div>
                      <p className="text-sm text-white font-black">{row.title}</p>
                      <p className="text-xs text-slate-400 mt-1">{row.message}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${row.isRead ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-amber-400 bg-amber-500/10 border border-amber-500/20'}`}>
                      {row.isRead ? 'Read' : 'Unread'}
                    </span>
                  </div>
                  <div className="mt-3 flex justify-between text-[10px] uppercase tracking-widest font-black text-slate-500">
                    <span>{titleCase(row.type)}</span>
                    <span>{formatDate(row.createdAt)}</span>
                  </div>
                </section>
              ))}
            </div>
          ) : null}
        </article>

        <article className="admin-card p-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Type Distribution</h3>
          {topTypes.length === 0 ? (
            <EmptyState title="No stats" description="Distribution appears once notification data is available." />
          ) : (
            <div className="space-y-3">
              {topTypes.map((row) => (
                <div key={row._id}>
                  <div className="flex justify-between items-center text-xs text-slate-300 mb-1">
                    <span className="font-bold">{titleCase(row._id || 'system')}</span>
                    <span>{row.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: `${Math.min((row.count / Math.max(topTypes[0].count || 1, 1)) * 100, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/20 text-xs text-slate-300">
            <p className="font-black text-indigo-300 uppercase tracking-wider mb-1 flex items-center gap-2">
              <FiTarget /> Control Notes
            </p>
            <p>
              Broadcast supports system-level communication; if the broadcast endpoint is not implemented on backend yet, this page reports a clear error without breaking monitoring.
            </p>
          </div>
        </article>
      </div>

      <GlassModal
        open={broadcastModal.open}
        onClose={() => setBroadcastModal({ open: false, title: '', message: '', type: 'system' })}
        onConfirm={sendBroadcast}
        title="Broadcast Notification"
        subtitle="Send a system-wide alert to target users through backend notification control."
        confirmText="Send Broadcast"
      >
        <div className="space-y-3">
          <input
            className="w-full bg-slate-900/80 border border-white/10 rounded-xl p-3 text-sm text-white outline-none"
            placeholder="Alert title"
            value={broadcastModal.title}
            onChange={(event) => setBroadcastModal((prev) => ({ ...prev, title: event.target.value }))}
          />
          <select
            className="w-full bg-slate-900/80 border border-white/10 rounded-xl p-3 text-sm text-white outline-none"
            value={broadcastModal.type}
            onChange={(event) => setBroadcastModal((prev) => ({ ...prev, type: event.target.value }))}
          >
            <option value="system">System</option>
            <option value="payment">Payment</option>
            <option value="dispute">Dispute</option>
            <option value="tracking">Tracking</option>
            <option value="account">Account</option>
          </select>
          <textarea
            className="w-full min-h-28 bg-slate-900/80 border border-white/10 rounded-xl p-3 text-sm text-white outline-none"
            placeholder="Alert message"
            value={broadcastModal.message}
            onChange={(event) => setBroadcastModal((prev) => ({ ...prev, message: event.target.value }))}
          />
        </div>
      </GlassModal>
    </div>
  );
};

export default AdminNotificationsPage;
