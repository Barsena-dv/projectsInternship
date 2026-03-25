import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { assignmentApi, notificationApi, payoutApi } from '../../services/api';
import { deriveFinderLifecycleState } from '../../utils/finderLifecycle';
import { formatCurrency, formatDate, getErrorMessage } from '../../utils/helpers';

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
  const [payouts, setPayouts] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [assignmentRes, payoutRes, notificationRes] = await Promise.all([
          assignmentApi.my(),
          payoutApi.my().catch(() => ({ data: [] })),
          notificationApi.my({ page: 1, limit: 20 }).catch(() => ({ data: [] })),
        ]);

        setAssignments(assignmentRes?.data || []);
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
    const completed = assignments.filter((row) => deriveFinderLifecycleState({ assignment: row }) === 'completed').length;
    const active = Math.max(total - completed, 0);
    const totalEarnings = payouts
      .filter((row) => String(row?.payoutStatus || '').toLowerCase() === 'processed')
      .reduce((sum, row) => sum + Number(row?.payoutAmount || 0), 0);

    return { total, active, completed, totalEarnings };
  }, [assignments, payouts]);

  if (loading) {
    return <LoadingSpinner text="Loading finder dashboard..." />;
  }

  return (
    <div>
      <PageHeader
        title="Finder Dashboard"
        subtitle="Open Requests -> Apply -> Assigned -> Tracking -> Evidence -> Chat -> Completed"
        actions={(
          <div className="flex flex-wrap gap-2">
            <Link className="pnf-btn-outline rounded-lg px-3 py-2 text-sm" to="/finder/requests">Browse Requests</Link>
            <Link className="pnf-btn-primary rounded-lg px-3 py-2 text-sm" to="/finder/assignments">My Assignments</Link>
          </div>
        )}
      />

      <section className="grid gap-3 md:grid-cols-4">
        <StatCard title="Total earnings" value={formatCurrency(stats.totalEarnings)} helper="Processed payouts" />
        <StatCard title="Active assignments" value={stats.active} helper="Currently in progress" />
        <StatCard title="Completed assignments" value={stats.completed} helper="Successfully closed tasks" />
        <StatCard title="Ratings" value={`${Number(user?.ratingAvg || 0).toFixed(1)} / 5`} helper={`${user?.ratingCount || 0} reviews`} />
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
