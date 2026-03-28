import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { adminApi } from '../../services/api';
import { formatCurrency, getErrorMessage } from '../../utils/helpers';
import { FiActivity, FiAlertCircle, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

const AdminOverviewPage = () => {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.dashboard();
      setDashboard(res?.data || null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return <LoadingSpinner text="Synchronizing global entity states..." />;

  const coreMetrics = dashboard?.coreMetrics || {};
  const trends = dashboard?.trends || {};
  const alerts = dashboard?.alerts || {};

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Command Overview" 
        subtitle="Real-time system metrics, throughput, and risk heuristics" 
        actions={(
          <button 
            onClick={loadData}
            className="px-4 py-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 transition-all font-bold text-xs uppercase tracking-widest"
          >
            Refresh Engine
          </button>
        )}
      />

      {/* Core Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="admin-card">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Users</p>
          <h3 className="text-3xl font-black text-white">{coreMetrics.totalUsers || 0}</h3>
          <p className="text-xs text-indigo-400 mt-2 flex items-center gap-1 font-bold">
            <FiActivity size={12} /> {coreMetrics.activeUsers || 0} active now
          </p>
        </div>
        <div className="admin-card">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Requests</p>
          <h3 className="text-3xl font-black text-white">{coreMetrics.totalRequests || 0}</h3>
          <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1 font-bold">
            <FiTrendingUp size={12} /> {coreMetrics.activeAssignments || 0} assignments
          </p>
        </div>
        <div className="admin-card text-amber-500">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Disputes</p>
          <h3 className="text-3xl font-black">{coreMetrics.activeDisputes || 0}</h3>
          <p className="text-xs text-amber-500/60 mt-2 flex items-center gap-1 font-bold italic">
            <FiAlertCircle size={12} /> Priority resolution required
          </p>
        </div>
        <div className="admin-card text-emerald-500">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Released Payouts</p>
          <h3 className="text-3xl font-black">{formatCurrency(coreMetrics?.payments?.released?.totalAmount || 0)}</h3>
          <p className="text-xs text-emerald-500/60 mt-2 flex items-center gap-1 font-bold">
             {coreMetrics?.payments?.released?.count || 0} successfully settled
          </p>
        </div>
      </div>

      {/* Performance Trends */}
      <div className="grid gap-4 md:grid-cols-3">
        <article className="admin-card">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Mission Completion Rate</h3>
          <div className="flex items-end gap-3">
            <p className="text-4xl font-black text-emerald-500">{Number(trends.completionRate || 0).toFixed(1)}%</p>
            <FiTrendingUp className="text-emerald-500 mb-2" size={24} />
          </div>
        </article>
        <article className="admin-card">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Failed/Expired Rate</h3>
          <div className="flex items-end gap-3">
            <p className="text-4xl font-black text-rose-500">{Number(trends.failureRate || 0).toFixed(1)}%</p>
            <FiTrendingDown className="text-rose-500 mb-2" size={24} />
          </div>
        </article>
        <article className="admin-card border-amber-500/30">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Escrow Friction (Disputes)</h3>
          <div className="flex items-end gap-3">
            <p className="text-4xl font-black text-amber-500">{Number(trends.disputeRate || 0).toFixed(1)}%</p>
            <FiAlertCircle className="text-amber-500 mb-2" size={24} />
          </div>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <article className="admin-card">
          <h3 className="text-sm font-black text-white mb-6 uppercase tracking-wider flex items-center gap-2">
            <FiActivity className="text-indigo-400" /> Throughput History
          </h3>
          {!Array.isArray(trends.requestsPerDay) || trends.requestsPerDay.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No mission telemetry recorded recently.</p>
          ) : (
            <div className="space-y-3">
              {trends.requestsPerDay.map((row) => (
                <div key={row._id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all">
                  <span className="text-sm font-bold text-slate-300">{row._id}</span>
                  <div className="flex items-center gap-4">
                    <div className="h-1.5 w-32 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" 
                        style={{ width: `${Math.min(row.count * 10, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-black text-white">{row.count} missions</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="admin-card border-rose-500/20">
          <h3 className="text-sm font-black text-white mb-6 uppercase tracking-wider flex items-center gap-2">
            <FiAlertCircle className="text-rose-400" /> System Alerts & Integrity
          </h3>
          <div className="space-y-3 text-xs">
            <div className={`p-4 rounded-xl border ${alerts?.inactiveAssignmentsSpike?.isSpike ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-white/5 border-white/5 text-slate-400'}`}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold uppercase tracking-widest">Inactivity Spikes</span>
                {alerts?.inactiveAssignmentsSpike?.isSpike ? <span className="px-2 py-0.5 bg-rose-500 text-white rounded-full text-[8px] font-black">CRITICAL</span> : <span className="text-[9px] font-bold opacity-30 tracking-widest">STABLE</span>}
              </div>
              <p className="italic opacity-80">Heuristics detection for abandoned discovery workflows.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <span className="font-bold text-white block mb-1">High-Dispute Users</span>
                <span className="text-2xl font-black text-amber-500">{(alerts.highDisputeUsers || []).length}</span>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <span className="font-bold text-white block mb-1">Suspicious Tracking</span>
                <span className="text-2xl font-black text-indigo-400">{(alerts.suspiciousFinderActivity || []).length}</span>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <span className="font-bold text-white block mb-1">Finder Failures</span>
                <span className="text-2xl font-black text-rose-400">{(alerts.repeatedFinderFailures || []).length}</span>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <span className="font-bold text-white block mb-1">Payment Flags</span>
                <span className="text-2xl font-black text-emerald-400">{(alerts.paymentIssues || []).length}</span>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};

export default AdminOverviewPage;
