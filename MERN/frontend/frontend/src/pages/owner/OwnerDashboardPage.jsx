import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import ActivityTimeline from '../../components/owner/dashboard/ActivityTimeline';
import QuickActions from '../../components/owner/dashboard/QuickActions';
import OwnerStatsGrid from '../../components/owner/dashboard/OwnerStatsGrid';
import OwnerStatusBadge from '../../components/owner/OwnerStatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { assignmentApi, notificationApi, paymentApi, requestApi } from '../../services/api';
import { formatDate, getErrorMessage } from '../../utils/helpers';
import { deriveOwnerLifecycleState } from '../../utils/requestLifecycle';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import '../../styles/owner/dashboard.css';

const RevealWrapper = ({ children, className = '', delay = '' }) => {
  const [ref, isVisible] = useScrollReveal();
  return (
    <div ref={ref} className={`reveal-up ${isVisible ? 'is-visible' : ''} ${delay} ${className}`}>
      {children}
    </div>
  );
};

const getId = (v) => {
  if (!v) return null;
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && v._id) return v._id;
  return null;
};

const isDeadlineSoon = (v) => {
  if (!v) return false;
  const delta = new Date(v).getTime() - Date.now();
  return delta > 0 && delta <= 24 * 60 * 60 * 1000;
};

const deriveTimelineItems = (requests) =>
  [...requests]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
    .slice(0, 6)
    .map((r) => ({
      id: r._id,
      type: r._lifecycle,
      title: r.itemName || 'Untitled',
      description: String(r._lifecycle || '').replace(/_/g, ' '),
      timestamp: r.updatedAt || r.createdAt,
    }));

const OwnerDashboardPage = () => {
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const requestsRes = await requestApi.my();
      const requestRows = requestsRes?.data || [];

      const [paymentsRes, notificationsRes, assignmentEntries] = await Promise.all([
        paymentApi.my().catch(() => ({ data: [] })),
        notificationApi.my({ page: 1, limit: 30 }).catch(() => ({ data: [] })),
        Promise.all(requestRows.map(async (req) => {
          try { 
            const r = await assignmentApi.byRequest(req._id); 
            const assignment = r?.data?.assignment || r?.data || r || null;
            return [req._id, assignment]; 
          }
          catch { return [req._id, null]; }
        })),
      ]);

      const assignmentMap = Object.fromEntries(assignmentEntries);
      const paymentMap = (paymentsRes?.data || []).reduce((acc, p) => {
        const rid = getId(p.requestId);
        if (!rid) return acc;
        const ex = acc[rid];
        if (!ex || new Date(p.updatedAt || p.createdAt || 0) >= new Date(ex.updatedAt || ex.createdAt || 0)) acc[rid] = p;
        return acc;
      }, {});

      const enriched = requestRows.map((req) => {
        const assignment = assignmentMap[req._id] || null;
        const payment = paymentMap[req._id] || null;
        const lifecycle = deriveOwnerLifecycleState({ request: req, payment, assignment, evidence: null });
        return { ...req, _assignment: assignment, _payment: payment, _lifecycle: lifecycle };
      });

      setRequests(enriched);
      setNotifications(notificationsRes?.data || []);
      if (isManual) toast.success('Dashboard updated.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => [
    { title: 'Total',           value: requests.length,                                                                                  icon: '📋', helper: undefined },
    { title: 'Draft / Pending', value: requests.filter((r) => ['draft','pending_payment'].includes(r._lifecycle)).length,                icon: '🕐', helper: 'Not published' },
    { title: 'Open',            value: requests.filter((r) => r._lifecycle === 'open').length,                                           icon: '🔓', helper: 'Visible to finders' },
    { title: 'Active',          value: requests.filter((r) => ['assigned','evidence_submitted','verified','inactive'].includes(r._lifecycle)).length, icon: '✅', helper: undefined },
    { title: 'Completed',       value: requests.filter((r) => r._lifecycle === 'completed').length,                                      icon: '🏁', helper: undefined },
    { title: 'Deadline Soon',   value: requests.filter((r) => !['completed','cancelled','failed'].includes(r._lifecycle) && isDeadlineSoon(r.serviceDeadline)).length, icon: '⏰', helper: '≤ 24h' },
    { title: 'Needs Attention', value: requests.filter((r) => ['inactive','expired','failed'].includes(r._lifecycle)).length,            icon: '⚠️', helper: 'Check status' },
  ], [requests]);

  const timelineItems = useMemo(() => deriveTimelineItems(requests), [requests]);
  const recentRequests = useMemo(() => requests.slice(0, 6), [requests]);
  const topApplicant = useMemo(() =>
    [...requests]
      .map((r) => ({ ...r, count: Array.isArray(r.finders) ? r.finders.length : 0 }))
      .filter((r) => ['open','assigned','evidence_submitted','verified','inactive'].includes(r._lifecycle))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
  [requests]);

  if (loading) return <LoadingSpinner text="Assembling your dashboard..." />;

  return (
    <div className="owner-page-enter">
      {/* Page header */}
      <div className="owner-page-header flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="owner-page-title">Management Dashboard</h1>
          <p className="owner-page-subtitle">Real-time overview of your recovery operations</p>
        </div>
        <div className="flex items-center gap-2">
           <button 
             onClick={() => load(true)} 
             className={`p-2 rounded-lg bg-white/5 border border-white/10 text-stone-400 hover:text-amber-400 transition-all ${refreshing ? 'animate-spin' : ''}`}
             title="Refresh Dashboard"
           >
             🔄
           </button>
           <QuickActions />
        </div>
      </div>

      {/* Stats Section */}
      <section className="mb-8">
        <RevealWrapper delay="reveal-delay-100">
          <OwnerStatsGrid stats={stats} />
        </RevealWrapper>
      </section>

      {/* Main Dashboard Grid */}
      <div className="owner-dashboard-grid">
        
        {/* Recent Requests Widget */}
        <div className="grid-span-8">
          <RevealWrapper className="h-full" delay="reveal-delay-200">
            <div className="owner-section-card h-full">
            <div className="owner-section-header">
              <span className="owner-section-title">Timeline Updates</span>
              <Link to="/owner/requests" className="owner-section-link">Explore all requests</Link>
            </div>
            
            <div className="pnf-scroll-limited px-1">
              {recentRequests.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-stone-500">No requests found. Start by creating one!</p>
                  <Link to="/owner/create-request" className="mt-3 inline-block pnf-btn-primary px-4 py-2 rounded-lg text-xs">Create New Request</Link>
                </div>
              ) : (
                recentRequests.map((item) => (
                  <Link key={item._id} to={`/owner/requests/${item._id}`} className="block text-inherit no-underline">
                    <div className="dash-list-item">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{item.itemName || 'Untitled'}</p>
                        <p className="text-[11px] text-stone-500 mt-0.5">{item.itemCategory || 'General'} • {formatDate(item.createdAt)}</p>
                      </div>
                      <OwnerStatusBadge value={item._lifecycle} />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
          </RevealWrapper>
        </div>

      {/* Activity Widget */}
        <div className="grid-span-4">
          <RevealWrapper className="h-full" delay="reveal-delay-300">
            <div className="owner-section-card h-full">
            <div className="owner-section-header">
              <span className="owner-section-title">System Activity</span>
            </div>
            <div className="pnf-scroll-limited">
              <ActivityTimeline items={timelineItems} />
            </div>
          </div>
          </RevealWrapper>
        </div>

        {/* High Interest Widget */}
        <div className="grid-span-6">
          <RevealWrapper className="h-full" delay="reveal-delay-400">
            <div className="owner-section-card h-full">
            <div className="owner-section-header">
              <div>
                <span className="owner-section-title">Trending Requests</span>
                <p className="text-[10px] text-stone-500 mt-0.5">Ranked by finder engagement</p>
              </div>
            </div>
            <div className="pnf-scroll-limited px-1">
              {topApplicant.length === 0 ? (
                <div className="py-12 text-center text-stone-500 text-sm">No engagement meta yet.</div>
              ) : (
                topApplicant.map((item, idx) => (
                  <Link key={item._id} to={`/owner/requests/${item._id}`} className="dash-list-item no-underline">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-black text-xs border border-amber-500/20">
                        #{idx + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{item.itemName || 'Untitled'}</p>
                        <p className="text-[11px] text-stone-500 mt-0.5">{item.count} Active Applicants</p>
                      </div>
                    </div>
                    <OwnerStatusBadge value={item._lifecycle} />
                  </Link>
                ))
              )}
            </div>
          </div>
          </RevealWrapper>
        </div>

        {/* Notifications Widget */}
        <div className="grid-span-6">
          <RevealWrapper className="h-full" delay="reveal-delay-500">
            <div className="owner-section-card h-full">
            <div className="owner-section-header">
              <span className="owner-section-title">Live Notifications</span>
              <Link to="/notifications" className="owner-section-link">View all alerts</Link>
            </div>
            <div className="pnf-scroll-limited px-1">
              {notifications.length === 0 ? (
                <div className="py-12 text-center text-stone-500 text-sm">No recent notifications.</div>
              ) : (
                notifications.slice(0, 15).map((n) => (
                  <div key={n._id} className={`dash-list-item ${n.isRead ? 'opacity-60' : 'border-l-2 border-l-amber-500 bg-amber-500/5'}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-sm">
                        {n.type === 'message' ? '💬' : '🔔'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{n.title || 'Update'}</p>
                        <p className="text-[11px] text-stone-500 mt-0.5 truncate">{n.message || formatDate(n.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          </RevealWrapper>
        </div>

      </div>
    </div>
  );
};

export default OwnerDashboardPage;
