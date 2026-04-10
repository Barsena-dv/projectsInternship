import { useCallback, useEffect, useState } from 'react';
import { FiBarChart2, FiTrendingUp } from 'react-icons/fi';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import { adminApi } from '../../services/api';
import { formatCurrency, getErrorMessage } from '../../utils/helpers';

const tinyLinePath = (points = [], width = 480, height = 140) => {
  if (!points.length) return '';
  const maxValue = Math.max(...points.map((point) => Number(point.count || 0)), 1);
  const stepX = points.length > 1 ? width / (points.length - 1) : width;

  return points.map((point, index) => {
    const x = Math.round(index * stepX);
    const y = Math.round(height - ((Number(point.count || 0) / maxValue) * (height - 10)));
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
};

const AdminAnalyticsPage = () => {
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

  const core = dashboard?.coreMetrics || {};
  const trends = dashboard?.trends || {};

  const success = Number(trends.completionRate || 0);
  const failure = Number(trends.failureRate || 0);
  const dispute = Number(trends.disputeRate || 0);
  const successVsFailure = [
    { label: 'Success', value: success, color: 'bg-emerald-500' },
    { label: 'Failure', value: failure, color: 'bg-rose-500' },
    { label: 'Dispute', value: dispute, color: 'bg-amber-500' },
  ];

  if (loading) return <LoadingSpinner text="Computing analytics projections..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics Dashboard"
        subtitle="High-level and operational metrics across users, requests, payments, and outcome quality"
      />

      <div className="grid gap-4 md:grid-cols-4">
        <article className="admin-card">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Users</p>
          <p className="text-3xl text-white font-black mt-2">{core.totalUsers || 0}</p>
          <p className="text-xs text-slate-400 mt-1">Active: {core.activeUsers || 0}</p>
        </article>
        <article className="admin-card">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Requests</p>
          <p className="text-3xl text-white font-black mt-2">{core.totalRequests || 0}</p>
          <p className="text-xs text-slate-400 mt-1">Active assignments: {core.activeAssignments || 0}</p>
        </article>
        <article className="admin-card">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Payments Released</p>
          <p className="text-3xl text-emerald-400 font-black mt-2">{formatCurrency(core?.payments?.released?.totalAmount || 0)}</p>
          <p className="text-xs text-slate-400 mt-1">Count: {core?.payments?.released?.count || 0}</p>
        </article>
        <article className="admin-card border-amber-500/20">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Success Rate</p>
          <p className="text-3xl text-amber-300 font-black mt-2">{Number(trends.completionRate || 0).toFixed(1)}%</p>
          <p className="text-xs text-slate-400 mt-1">Disputes: {Number(trends.disputeRate || 0).toFixed(1)}%</p>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <article className="admin-card p-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
            <FiTrendingUp /> Request Volume Trend
          </h3>
          <div className="rounded-xl bg-slate-900/60 border border-white/5 p-4">
            {(trends.requestsPerDay || []).length ? (
              <svg viewBox="0 0 480 150" className="w-full h-40">
                <path d={tinyLinePath(trends.requestsPerDay)} fill="none" stroke="#6366f1" strokeWidth="3" />
              </svg>
            ) : (
              <p className="text-xs text-slate-500">No trend data available.</p>
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(trends.requestsPerDay || []).slice(-6).map((point) => (
              <div key={point._id} className="text-xs p-2 rounded-lg bg-white/5 border border-white/5 flex justify-between">
                <span className="text-slate-400">{point._id}</span>
                <span className="text-white font-bold">{point.count}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-card p-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
            <FiBarChart2 /> Success vs Failure
          </h3>
          <div className="space-y-4">
            {successVsFailure.map((row) => (
              <div key={row.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-bold">{row.label}</span>
                  <span className="text-white">{row.value.toFixed(1)}%</span>
                </div>
                <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                  <div className={`h-full ${row.color}`} style={{ width: `${Math.min(row.value, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 text-xs text-slate-300">
            Analytics combine platform metrics with assignment outcomes, payment settlement states, and dispute friction rates to support strategic admin decisions.
          </div>
        </article>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
