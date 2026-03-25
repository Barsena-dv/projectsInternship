import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { assignmentApi, evidenceApi, notificationApi, payoutApi, requestApi } from '../../services/api';
import { deriveFinderLifecycleState, isDeadlineMissed } from '../../utils/finderLifecycle';
import { formatCurrency, formatDate, getErrorMessage } from '../../utils/helpers';

const HOURS_24_MS = 24 * 60 * 60 * 1000;

const isDeadlineSoon = (deadlineValue) => {
  if (!deadlineValue) return false;
  const deadlineMs = new Date(deadlineValue).getTime();
  if (!Number.isFinite(deadlineMs)) return false;
  const delta = deadlineMs - Date.now();
  return delta > 0 && delta <= HOURS_24_MS;
};

const isWorkflowNotification = (notification = {}) => {
  const text = `${notification?.title || ''} ${notification?.message || ''}`.toLowerCase();
  return (
    text.includes('application accepted')
    || text.includes('application rejected')
    || text.includes('finder assigned')
    || text.includes('proof rejected')
    || text.includes('evidence rejected')
    || text.includes('proof verified')
    || text.includes('evidence verified')
    || text.includes('payment released')
    || text.includes('payout processed')
  );
};

const FinderDashboardPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [applications, setApplications] = useState([]);
  const [availableRequests, setAvailableRequests] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [assignmentRes, applicationRes, availableRes, payoutRes, notificationRes] = await Promise.all([
          assignmentApi.my(),
          assignmentApi.myApplications().catch(() => ({ data: [] })),
          requestApi.available().catch(() => ({ data: [] })),
          payoutApi.my().catch(() => ({ data: [] })),
          notificationApi.my({ page: 1, limit: 20 }).catch(() => ({ data: [] })),
        ]);

        const assignmentRows = assignmentRes?.data || [];

        const evidenceEntries = await Promise.all(
          assignmentRows.map(async (assignment) => {
            try {
              const evidenceRes = await evidenceApi.byAssignment(assignment._id);
              return [assignment._id, evidenceRes?.data || null];
            } catch {
              return [assignment._id, null];
            }
          })
        );

        const evidenceByAssignmentId = Object.fromEntries(evidenceEntries);

        const enrichedAssignments = assignmentRows.map((assignment) => ({
          ...assignment,
          _evidence: evidenceByAssignmentId[assignment._id] || null,
        }));

        setAssignments(enrichedAssignments);
        setApplications(applicationRes?.data || []);
        setAvailableRequests(availableRes?.data || []);
        setPayouts(payoutRes?.data || []);
        setNotifications((notificationRes?.data || []).filter(isWorkflowNotification));
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const stats = useMemo(() => {
    const total = assignments.length;
    const completed = assignments.filter((row) => deriveFinderLifecycleState({ assignment: row, evidence: row._evidence }) === 'completed').length;
    const active = assignments.filter((row) => {
      const lifecycle = deriveFinderLifecycleState({ assignment: row, evidence: row._evidence });
      return ['assigned', 'evidence_submitted', 'verified', 'inactive'].includes(lifecycle);
    }).length;
    const waitingVerification = assignments.filter((row) => {
      const lifecycle = deriveFinderLifecycleState({ assignment: row, evidence: row._evidence });
      return lifecycle === 'evidence_submitted';
    }).length;
    const deadlinesSoon = assignments.filter((row) => {
      const deadline = row?.deadlineAt || row?.request?.serviceDeadline;
      return isDeadlineSoon(deadline);
    }).length;

    const pendingApplications = applications.filter((row) => String(row?.status || '').toLowerCase() === 'pending').length;
    const acceptedApplications = applications.filter((row) => String(row?.status || '').toLowerCase() === 'accepted').length;

    const totalEarnings = payouts
      .filter((row) => String(row?.payoutStatus || '').toLowerCase() === 'processed')
      .reduce((sum, row) => sum + Number(row?.payoutAmount || 0), 0);

    const pendingPayout = payouts
      .filter((row) => String(row?.payoutStatus || '').toLowerCase() === 'pending')
      .reduce((sum, row) => sum + Number(row?.payoutAmount || 0), 0);

    const unreadNotifications = notifications.filter((row) => !row?.isRead).length;

    return {
      total,
      active,
      completed,
      waitingVerification,
      deadlinesSoon,
      pendingApplications,
      acceptedApplications,
      totalEarnings,
      pendingPayout,
      unreadNotifications,
      openRequestPool: availableRequests.length,
    };
  }, [assignments, applications, availableRequests.length, notifications, payouts]);

  const activeAssignments = useMemo(() => {
    return assignments
      .map((row) => {
        const lifecycle = deriveFinderLifecycleState({ assignment: row, evidence: row._evidence });
        const deadline = row?.deadlineAt || row?.request?.serviceDeadline;
        return {
          ...row,
          _lifecycle: lifecycle,
          _deadline: deadline,
          _deadlineMissed: isDeadlineMissed(deadline),
        };
      })
      .filter((row) => ['assigned', 'evidence_submitted', 'verified', 'inactive'].includes(row._lifecycle))
      .sort((a, b) => {
        const aTime = new Date(a._deadline || 0).getTime();
        const bTime = new Date(b._deadline || 0).getTime();
        return aTime - bTime;
      })
      .slice(0, 6);
  }, [assignments]);

  const recentPendingApplications = useMemo(() => {
    return applications
      .filter((row) => String(row?.status || '').toLowerCase() === 'pending')
      .slice(0, 5);
  }, [applications]);

  if (loading) {
    return <LoadingSpinner text="Loading finder dashboard..." />;
  }

  return (
    <div>
      <PageHeader
        title="Finder Dashboard"
        subtitle="Detailed workbench for applications, assignments, evidence milestones, and payouts"
        actions={(
          <div className="flex flex-wrap gap-2">
            <Link className="pnf-btn-outline rounded-lg px-3 py-2 text-sm" to="/finder/requests">Browse Requests</Link>
            <Link className="pnf-btn-primary rounded-lg px-3 py-2 text-sm" to="/finder/assignments">My Assignments</Link>
          </div>
        )}
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total earnings" value={formatCurrency(stats.totalEarnings)} helper="Processed payouts" />
        <StatCard title="Pending payout" value={formatCurrency(stats.pendingPayout)} helper="Awaiting owner release" />
        <StatCard title="Active assignments" value={stats.active} helper="Currently in progress" />
        <StatCard title="Completed assignments" value={stats.completed} helper="Successfully closed tasks" />
        <StatCard title="Waiting verification" value={stats.waitingVerification} helper="Evidence submitted" />
        <StatCard title="Deadlines in 24h" value={stats.deadlinesSoon} helper="Prioritize these first" />
        <StatCard title="Pending applications" value={stats.pendingApplications} helper={`${stats.acceptedApplications} accepted so far`} />
        <StatCard title="Open request pool" value={stats.openRequestPool} helper={`${stats.unreadNotifications} unread workflow alerts`} />
        <StatCard title="Ratings" value={`${Number(user?.ratingAvg || 0).toFixed(1)} / 5`} helper={`${user?.ratingCount || 0} reviews`} />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-2">
        <article className="pnf-card p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Active Assignment Snapshot</h2>
            <Link to="/finder/assignments" className="text-sm font-medium text-blue-600 hover:underline">Open all</Link>
          </div>

          {activeAssignments.length === 0 ? (
            <EmptyState title="No active assignments" description="Apply to open requests to start new work." />
          ) : (
            <div className="space-y-2">
              {activeAssignments.map((row) => (
                <article key={row._id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{row?.request?.itemName || 'Assignment'}</p>
                    <StatusBadge value={row._lifecycle} />
                  </div>
                  <div className="mt-1 grid gap-1 text-xs text-slate-600 md:grid-cols-2">
                    <p>Location: {row?.request?.lastSeenLocation || '-'}</p>
                    <p>Deadline: {formatDate(row._deadline)}</p>
                  </div>
                  {row._deadlineMissed ? (
                    <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700">Deadline passed - requires retry or owner action.</p>
                  ) : null}
                  <div className="mt-2 flex justify-end">
                    <Link to={`/finder/assignments/${row._id}`} className="text-sm font-medium text-blue-600 hover:underline">Open assignment</Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>

        <article className="pnf-card p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Application Pipeline</h2>
            <Link to="/finder/assignments" className="text-sm font-medium text-blue-600 hover:underline">Track all</Link>
          </div>

          {recentPendingApplications.length === 0 ? (
            <p className="text-sm text-slate-600">No pending applications right now.</p>
          ) : (
            <div className="space-y-2">
              {recentPendingApplications.map((row) => (
                <div key={row._id} className="rounded-lg border border-slate-200 px-3 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900">{row?.request?.itemName || 'Request'}</p>
                    <StatusBadge value={row.status || 'pending'} />
                  </div>
                  <p className="mt-1 text-xs text-slate-600">Applied: {formatDate(row.createdAt)}</p>
                  <p className="mt-1 text-xs text-slate-600">Region: {row.finderRegion || '-'}</p>
                  <div className="mt-2 flex justify-end">
                    <Link to={`/finder/requests/${row?.request?._id}`} className="text-sm font-medium text-blue-600 hover:underline">Open request</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="pnf-card mt-4 p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Workflow Notifications</h2>
          <Link to="/notifications" className="text-sm font-medium text-blue-600 hover:underline">View all</Link>
        </div>

        {notifications.length === 0 ? (
          <EmptyState
            title="No workflow notifications"
            description="You will see assignment received, evidence verification updates, and payment release alerts here."
          />
        ) : (
          <div className="space-y-3">
            {notifications.slice(0, 6).map((item) => (
              <article key={item._id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <StatusBadge value={item.type} />
                </div>
                <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                <p className="mt-2 text-xs text-slate-500">{formatDate(item.createdAt)}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default FinderDashboardPage;
