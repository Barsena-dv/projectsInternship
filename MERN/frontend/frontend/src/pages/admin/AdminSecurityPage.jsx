import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiShield, FiUserX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import EmptyState from '../../components/common/EmptyState';
import GlassModal from '../../components/common/GlassModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import { adminApi } from '../../services/api';
import { getErrorMessage } from '../../utils/helpers';

const AdminSecurityPage = () => {
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState(50);
  const [signals, setSignals] = useState([]);
  const [modal, setModal] = useState({ open: false, userId: '', status: 'suspended', reason: '' });

  const loadSignals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.fraudSignals({ threshold });
      setSignals(res?.data || []);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [threshold]);

  useEffect(() => {
    loadSignals();
  }, [loadSignals]);

  const severity = useMemo(() => {
    const high = signals.filter((row) => row.riskScore >= 80).length;
    const medium = signals.filter((row) => row.riskScore >= 60 && row.riskScore < 80).length;
    return { high, medium };
  }, [signals]);

  const applyAction = async () => {
    try {
      if (!modal.userId) return;
      await adminApi.updateUserStatus(modal.userId, { status: modal.status, reason: modal.reason || 'Security risk action' });
      toast.success('User risk action applied.');
      setModal({ open: false, userId: '', status: 'suspended', reason: '' });
      await loadSignals();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security Signals"
        subtitle="Detect suspicious user behavior, monitor risk scores, and enforce account controls"
      />

      <div className="grid gap-4 md:grid-cols-4">
        <article className="admin-card">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Flagged Users</p>
          <p className="text-3xl text-white font-black mt-2">{signals.length}</p>
        </article>
        <article className="admin-card border-rose-500/20">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">High Risk</p>
          <p className="text-3xl text-rose-400 font-black mt-2">{severity.high}</p>
        </article>
        <article className="admin-card border-amber-500/20">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Medium Risk</p>
          <p className="text-3xl text-amber-400 font-black mt-2">{severity.medium}</p>
        </article>
        <article className="admin-card">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Threshold</p>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="range"
              min="30"
              max="90"
              value={threshold}
              onChange={(event) => setThreshold(Number(event.target.value))}
              className="w-full"
            />
            <span className="text-xs text-indigo-300 font-black">{threshold}</span>
          </div>
        </article>
      </div>

      <article className="admin-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Risk Registry</h3>
          <button
            type="button"
            onClick={loadSignals}
            className="px-3 py-2 rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-300 text-[10px] uppercase tracking-widest font-black"
          >
            Refresh Risk Scan
          </button>
        </div>

        {loading ? <LoadingSpinner /> : null}
        {!loading && signals.length === 0 ? <EmptyState title="No suspicious users" description="No users cross the selected risk threshold." /> : null}

        {!loading && signals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Risk Score</th>
                  <th>Failed Assignments</th>
                  <th>Disputes</th>
                  <th>Tracking Signals</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {signals.map((row) => (
                  <tr key={row.userId}>
                    <td>
                      <p className="text-xs text-white font-bold">{row.full_name}</p>
                      <p className="text-[10px] text-slate-500">{row.email}</p>
                    </td>
                    <td>
                      <div className="w-28 h-2 rounded-full bg-white/5 overflow-hidden mb-1">
                        <div className={`${row.riskScore >= 80 ? 'bg-rose-500' : 'bg-amber-500'} h-full`} style={{ width: `${row.riskScore}%` }} />
                      </div>
                      <span className="text-xs text-white font-black">{row.riskScore}</span>
                    </td>
                    <td className="text-xs text-slate-300">{row.assignmentStats?.failed || 0} / {row.assignmentStats?.total || 0}</td>
                    <td className="text-xs text-slate-300">{row.disputeCount || 0}</td>
                    <td className="text-xs text-slate-300">Jumps: {row.trackingSignals?.suspiciousJumps || 0}, Repeat: {row.trackingSignals?.repeatedLocationRuns || 0}</td>
                    <td className="text-xs text-slate-300 uppercase">{row.accountStatus}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => setModal({ open: true, userId: row.userId, status: 'suspended', reason: '' })}
                        className="px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px] uppercase tracking-widest font-black flex items-center gap-1"
                      >
                        <FiUserX /> Restrict
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </article>

      <article className="admin-card border-amber-500/20">
        <h3 className="text-xs font-black uppercase tracking-widest text-amber-400 mb-2 flex items-center gap-2">
          <FiShield /> Security Posture
        </h3>
        <p className="text-xs text-slate-300">
          Risk scores combine assignment failure patterns, disputes, and suspicious tracking behavior. Use restrictions only with clear audit reasons and policy alignment.
        </p>
      </article>

      <GlassModal
        open={modal.open}
        onClose={() => setModal({ open: false, userId: '', status: 'suspended', reason: '' })}
        onConfirm={applyAction}
        title="Apply Security Restriction"
        subtitle="Suspend or block this user based on security signal confidence."
        confirmText="Apply Restriction"
      >
        <div className="space-y-3">
          <select
            className="w-full bg-slate-900/80 border border-white/10 rounded-xl p-3 text-sm text-white outline-none"
            value={modal.status}
            onChange={(event) => setModal((prev) => ({ ...prev, status: event.target.value }))}
          >
            <option value="suspended">Suspended</option>
            <option value="blocked">Blocked</option>
          </select>
          <textarea
            className="w-full min-h-28 bg-slate-900/80 border border-white/10 rounded-xl p-3 text-sm text-white outline-none"
            value={modal.reason}
            onChange={(event) => setModal((prev) => ({ ...prev, reason: event.target.value }))}
            placeholder="Provide a clear security reason for this action"
          />
        </div>
      </GlassModal>
    </div>
  );
};

export default AdminSecurityPage;
