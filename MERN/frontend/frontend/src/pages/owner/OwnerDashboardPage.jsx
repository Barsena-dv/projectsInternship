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
import '../../styles/owner/dashboard.css';

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

const divider = { borderTop: '1px solid rgba(255,255,255,0.06)', margin: '0' };

const OwnerDashboardPage = () => {
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const requestsRes = await requestApi.my();
        const requestRows = requestsRes?.data || [];

        const [paymentsRes, notificationsRes, assignmentEntries] = await Promise.all([
          paymentApi.my().catch(() => ({ data: [] })),
          notificationApi.my({ page: 1, limit: 30 }).catch(() => ({ data: [] })),
          Promise.all(requestRows.map(async (req) => {
            try { const r = await assignmentApi.byRequest(req._id); return [req._id, r.data || null]; }
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
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = useMemo(() => [
    { title: 'Total',           value: requests.length,                                                                                  icon: '📋', helper: undefined },
    { title: 'Draft / Pending', value: requests.filter((r) => ['draft','pending_payment'].includes(r._lifecycle)).length,                icon: '🕐', helper: 'Not published' },
    { title: 'Open',            value: requests.filter((r) => r._lifecycle === 'open').length,                                           icon: '🔓', helper: 'Visible to finders' },
    { title: 'Active',          value: requests.filter((r) => ['assigned','evidence_submitted','verified','inactive'].includes(r._lifecycle)).length, icon: '✅', helper: undefined },
    { title: 'Completed',       value: requests.filter((r) => r._lifecycle === 'completed').length,                                      icon: '🏁', helper: undefined },
    { title: 'Deadline Soon',   value: requests.filter((r) => !['completed','cancelled','failed'].includes(r._lifecycle) && isDeadlineSoon(r.serviceDeadline)).length, icon: '⏰', helper: '≤ 24h' },
    { title: 'Needs Attention', value: requests.filter((r) => ['inactive','expired','failed'].includes(r._lifecycle)).length,            icon: '⚠️', helper: 'Inactive / expired / failed' },
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

  if (loading) return <LoadingSpinner text="Loading…" />;

  const text = (s, c = '#fffbeb', w = 400) => ({ margin: 0, fontSize: s, color: c, fontWeight: w });

  return (
    <div className="owner-page-enter" style={{ minHeight: '100%' }}>
      {/* Page header */}
      <div className="owner-page-header">
        <h1 className="owner-page-title">Dashboard</h1>
        <p className="owner-page-subtitle">Request overview, assignments and activity</p>
        <QuickActions />
      </div>

      {/* Stats */}
      <OwnerStatsGrid stats={stats} />

      {/* Main two-col layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.25rem', marginTop: '1.5rem' }}>

        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: 0 }}>

          {/* Recent requests */}
          <div className="owner-section-card">
            <div className="owner-section-header">
              <span className="owner-section-title">Recent Requests</span>
              <Link to="/owner/requests" className="owner-section-link">View all →</Link>
            </div>
            <div className="pnf-scroll-limited">
              {recentRequests.length === 0
                ? <p style={text('0.825rem', '#a8a29e')}>Nothing yet — create your first request.</p>
                : recentRequests.map((item) => (
                  <Link key={item._id} to={`/owner/requests/${item._id}`} style={{ display: 'block', textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', gap: '0.75rem', transition: 'all 0.15s' }}
                      onMouseEnter={(e) => { e.currentTarget.closest('a').style.opacity = '0.8'; }}
                      onMouseLeave={(e) => { e.currentTarget.closest('a').style.opacity = '1'; }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <p style={{ ...text('0.85rem', '#e8eaf0', 600), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.itemName || 'Untitled'}</p>
                        <p style={{ ...text('0.75rem', '#a8a29e'), marginTop: '2px' }}>{item.itemCategory || '—'} · {formatDate(item.createdAt)}</p>
                      </div>
                      <OwnerStatusBadge value={item._lifecycle} />
                    </div>
                  </Link>
                ))}
            </div>
          </div>

          {/* High interest */}
          <div className="owner-section-card">
            <div className="owner-section-header">
              <span className="owner-section-title">High-Interest Requests</span>
              <span style={{ fontSize: '0.72rem', color: '#a8a29e' }}>By applicant count</span>
            </div>
            <div className="pnf-scroll-limited">
              {topApplicant.length === 0
                ? <p style={text('0.825rem', '#a8a29e')}>No applicant activity yet.</p>
                : topApplicant.map((item, idx) => (
                  <Link key={item._id} to={`/owner/requests/${item._id}`} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.625rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', textDecoration: 'none' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'rgba(245,158,11,0.15)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.72rem', flexShrink: 0 }}>
                      {idx + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ ...text('0.83rem', '#e8eaf0', 600), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.itemName || 'Untitled'}</p>
                      <p style={{ ...text('0.72rem', '#a8a29e'), marginTop: '1px' }}>{item.count} applicant{item.count !== 1 ? 's' : ''}</p>
                    </div>
                    <OwnerStatusBadge value={item._lifecycle} />
                  </Link>
                ))}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Activity */}
          <div className="owner-section-card">
            <div className="owner-section-header">
              <span className="owner-section-title">Activity</span>
            </div>
            <div className="pnf-scroll-limited">
              <ActivityTimeline items={timelineItems} />
            </div>
          </div>

          {/* Notifications */}
          <div className="owner-section-card">
            <div className="owner-section-header">
              <span className="owner-section-title">Notifications</span>
              <Link to="/notifications" className="owner-section-link">All →</Link>
            </div>
            <div className="pnf-scroll-limited">
              {notifications.length === 0
                ? <p style={text('0.8rem', '#a8a29e')}>No recent alerts.</p>
                : notifications.slice(0, 15).map((n) => (
                  <div key={n._id} className={`owner-notif-item${n.isRead ? '' : ' unread'}`}>
                    <div className="owner-notif-icon">🔔</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ ...text('0.78rem', '#e8eaf0', 600), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title || 'Notification'}</p>
                      <p style={{ ...text('0.7rem', '#a8a29e'), marginTop: '2px' }}>{formatDate(n.createdAt)}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 900px) {
          .owner-dash-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default OwnerDashboardPage;
