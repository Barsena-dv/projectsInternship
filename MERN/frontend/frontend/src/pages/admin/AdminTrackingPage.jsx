import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FiActivity, FiAlertTriangle, FiMapPin, FiRefreshCcw, FiSearch } from 'react-icons/fi';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { adminApi } from '../../services/api';
import { formatDate, getErrorMessage } from '../../utils/helpers';

const AdminTrackingPage = () => {
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [analytics, setAnalytics] = useState(null);

  const loadAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.assignments({ limit: 100 });
      setAssignments(res?.data?.rows || []);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAnalytics = useCallback(async (assignmentId) => {
    if (!assignmentId) return;
    try {
      const res = await adminApi.trackingAnalytics(assignmentId);
      setAnalytics(res?.data || null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const filteredAssignments = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return assignments;
    return assignments.filter((row) => (
      String(row?.request?.itemName || '').toLowerCase().includes(q)
      || String(row?.finder?.full_name || '').toLowerCase().includes(q)
      || String(row?._id || '').toLowerCase().includes(q)
    ));
  }, [assignments, query]);

  const staleRows = useMemo(() => {
    const now = Date.now();
    return assignments.filter((row) => {
      const lastActivity = new Date(row.lastActivityAt || row.updatedAt || row.createdAt).getTime();
      if (!Number.isFinite(lastActivity)) return false;
      const diffMinutes = (now - lastActivity) / (1000 * 60);
      return ['active', 'inactive', 'paused'].includes(String(row.status || '').toLowerCase()) && diffMinutes > 90;
    });
  }, [assignments]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tracking Monitoring"
        subtitle="Live location telemetry, stale-update detection, and movement integrity checks"
        actions={(
          <button
            type="button"
            onClick={loadAssignments}
            className="px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-500/20"
          >
            <FiRefreshCcw /> Refresh Feed
          </button>
        )}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <article className="admin-card">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Monitored Assignments</p>
          <p className="text-3xl font-black text-white mt-2">{assignments.length}</p>
        </article>
        <article className="admin-card border-amber-500/20">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Missing Updates</p>
          <p className="text-3xl font-black text-amber-400 mt-2">{staleRows.length}</p>
        </article>
        <article className="admin-card border-rose-500/20">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Current Jump Alerts</p>
          <p className="text-3xl font-black text-rose-400 mt-2">{analytics?.analytics?.suspiciousJumps || 0}</p>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <article className="admin-card h-170 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Assignment Feed</h3>
            <div className="relative w-56">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:border-indigo-500/40 outline-none"
                placeholder="Search assignment"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
            {loading ? <div className="py-32"><LoadingSpinner /></div> : null}
            {!loading && filteredAssignments.length === 0 ? (
              <EmptyState title="No tracking rows" description="No assignments matched your filter." />
            ) : null}
            {!loading && filteredAssignments.map((row) => {
              const isSelected = selectedAssignmentId === row._id;
              const isStale = staleRows.some((stale) => stale._id === row._id);
              return (
                <button
                  type="button"
                  key={row._id}
                  onClick={() => {
                    setSelectedAssignmentId(row._id);
                    loadAnalytics(row._id);
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${isSelected ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-white/5 border-white/5 hover:bg-white/8'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-white uppercase tracking-wide truncate">{row?.request?.itemName || 'Unknown Request'}</p>
                    <StatusBadge value={row.status} />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Finder: {row?.finder?.full_name || '-'}</p>
                  <div className="mt-3 flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                    <span className="text-slate-500">Last activity: {formatDate(row.lastActivityAt || row.updatedAt)}</span>
                    {isStale ? <span className="text-amber-400">Missing Updates</span> : <span className="text-emerald-400">Healthy</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </article>

        <article className="admin-card h-170 flex flex-col">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Tracking Intelligence</h3>
          {!analytics ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState title="Select an assignment" description="Choose a row to inspect movement path and anomalies." />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-5">
              <div className="grid gap-3 grid-cols-2">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Total Updates</p>
                  <p className="text-2xl font-black text-white">{analytics?.analytics?.totalUpdates || 0}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Max Gap (min)</p>
                  <p className="text-2xl font-black text-amber-400">{analytics?.analytics?.maxGapMinutes || 0}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Suspicious Jumps</p>
                  <p className="text-2xl font-black text-rose-400">{analytics?.analytics?.suspiciousJumps || 0}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">No-Movement Gaps</p>
                  <p className="text-2xl font-black text-indigo-400">{analytics?.analytics?.noMovementLongGap || 0}</p>
                </div>
              </div>

              <section className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <h4 className="text-xs text-white font-black uppercase tracking-wider mb-4">Recent Location Stream</h4>
                {(analytics?.updates || []).slice(-12).reverse().map((event) => (
                  <div key={event._id} className="flex items-center justify-between py-2 border-b border-white/5 text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                      <FiMapPin className="text-indigo-400" />
                      <span>{Number(event.currentLat || 0).toFixed(4)}, {Number(event.currentLng || 0).toFixed(4)}</span>
                    </div>
                    <span className="text-slate-500">{formatDate(event.createdAt)}</span>
                  </div>
                ))}
                {!(analytics?.updates || []).length ? (
                  <p className="text-xs text-slate-500 italic">No tracking updates for this assignment.</p>
                ) : null}
              </section>

              <section className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20">
                <h4 className="text-xs text-rose-400 font-black uppercase tracking-wider mb-2 flex items-center gap-2">
                  <FiAlertTriangle /> Signal Summary
                </h4>
                <p className="text-xs text-slate-300">
                  {analytics?.fraudSignals?.randomLocationJumps ? 'Random location jumps detected. ' : 'No random location jumps. '}
                  {analytics?.fraudSignals?.noMovementForLongTime ? 'Long inactivity windows are present.' : 'No long inactivity windows.'}
                </p>
              </section>
            </div>
          )}
        </article>
      </div>
    </div>
  );
};

export default AdminTrackingPage;
