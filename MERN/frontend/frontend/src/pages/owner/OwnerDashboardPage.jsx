import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import { assignmentApi, notificationApi, paymentApi, requestApi } from '../../services/api';
import { formatDate, getErrorMessage } from '../../utils/helpers';
import { deriveOwnerLifecycleState } from '../../utils/requestLifecycle';

const getId = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value._id) return value._id;
  return null;
};

const HOURS_24_MS = 24 * 60 * 60 * 1000;

const isDeadlineSoon = (value) => {
  if (!value) return false;
  const deadlineMs = new Date(value).getTime();
  if (!Number.isFinite(deadlineMs)) return false;
  const delta = deadlineMs - Date.now();
  return delta > 0 && delta <= HOURS_24_MS;
};

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
          Promise.all(
            requestRows.map(async (request) => {
              try {
                const assignmentRes = await assignmentApi.byRequest(request._id);
                return [request._id, assignmentRes.data || null];
              } catch {
                return [request._id, null];
              }
            })
          ),
        ]);

        const assignmentByRequestId = Object.fromEntries(assignmentEntries);

        const paymentByRequestId = (paymentsRes?.data || []).reduce((acc, payment) => {
          const requestId = getId(payment.requestId);
          if (!requestId) return acc;
          const previous = acc[requestId];
          if (!previous) {
            acc[requestId] = payment;
            return acc;
          }

          const previousTime = new Date(previous.updatedAt || previous.createdAt || 0).getTime();
          const currentTime = new Date(payment.updatedAt || payment.createdAt || 0).getTime();
          if (currentTime >= previousTime) acc[requestId] = payment;
          return acc;
        }, {});

        const enriched = requestRows.map((request) => {
          const assignment = assignmentByRequestId[request._id] || null;
          const payment = paymentByRequestId[request._id] || null;
          const lifecycle = deriveOwnerLifecycleState({ request, payment, assignment, evidence: null });

          return {
            ...request,
            _assignment: assignment,
            _payment: payment,
            _lifecycle: lifecycle,
          };
        });

        setRequests(enriched);
        setNotifications(notificationsRes?.data || []);
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const stats = useMemo(() => {
    const totalRequests = requests.length;
    const draftOrPending = requests.filter((item) => ['draft', 'pending_payment'].includes(item._lifecycle)).length;
    const openRequests = requests.filter((item) => item._lifecycle === 'open').length;
    const activeAssignments = requests.filter((item) => ['assigned', 'evidence_submitted', 'verified', 'inactive'].includes(item._lifecycle)).length;
    const completedRequests = requests.filter((item) => item._lifecycle === 'completed').length;
    const deadlinesToday = requests.filter((item) => !['completed', 'cancelled'].includes(String(item._lifecycle)) && isDeadlineSoon(item.serviceDeadline)).length;
    const needsAttention = requests.filter((item) => ['inactive', 'expired'].includes(item._lifecycle)).length;

    return {
      totalRequests,
      draftOrPending,
      openRequests,
      activeAssignments,
      completedRequests,
      deadlinesToday,
      needsAttention,
    };
  }, [requests]);

  const recentRequests = useMemo(() => requests.slice(0, 6), [requests]);

  const topApplicantRequests = useMemo(() => {
    return [...requests]
      .map((item) => ({ ...item, applicantCount: Array.isArray(item.finders) ? item.finders.length : 0 }))
      .filter((item) => ['open', 'assigned', 'evidence_submitted', 'verified', 'inactive'].includes(item._lifecycle))
      .sort((a, b) => b.applicantCount - a.applicantCount)
      .slice(0, 5);
  }, [requests]);

  return (
    <div>
      <PageHeader
        title="Owner Dashboard"
        subtitle="Detailed control center for payment, applications, assignment progress, and closures"
        actions={(
          <div className="flex flex-wrap gap-2">
            <Link className="pnf-btn-primary rounded-lg px-3 py-2 text-sm" to="/owner/create-request">Create Request</Link>
            <Link className="pnf-btn-outline rounded-lg px-3 py-2 text-sm" to="/owner/requests">Manage Requests</Link>
          </div>
        )}
      />

      {loading ? <LoadingSpinner text="Loading dashboard..." /> : null}

      {!loading ? (
        <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
          <StatCard title="Total Requests" value={stats.totalRequests} />
          <StatCard title="Draft / Pending Payment" value={stats.draftOrPending} helper="Not yet discoverable" />
          <StatCard title="Open Requests" value={stats.openRequests} helper="Visible to finders" />
          <StatCard title="Active Assignments" value={stats.activeAssignments} />
          <StatCard title="Completed Requests" value={stats.completedRequests} />
          <StatCard title="Deadline In 24h" value={stats.deadlinesToday} helper="Need close tracking" />
          <StatCard title="Needs Attention" value={stats.needsAttention} helper="Inactive or expired" />
        </section>
      ) : null}

      {!loading ? (
        <section className="pnf-card mt-4 p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Recent Requests Snapshot</h2>
            <Link to="/owner/requests" className="text-sm font-medium text-blue-600 hover:underline">View full list</Link>
          </div>

          {recentRequests.length === 0 ? (
            <EmptyState title="No requests yet" description="Create your first request to start receiving finder applications." />
          ) : (
            <div className="space-y-2">
              {recentRequests.map((item) => (
                <article key={item._id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{item.itemName || 'Untitled item'}</p>
                    <StatusBadge value={item._lifecycle} />
                  </div>
                  <div className="mt-1 grid gap-1 text-xs text-slate-600 md:grid-cols-3">
                    <p>Category: {item.itemCategory || '-'}</p>
                    <p>Created: {formatDate(item.createdAt)}</p>
                    <p>Deadline: {formatDate(item.serviceDeadline)}</p>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <Link to={`/owner/requests/${item._id}`} className="text-sm font-medium text-blue-600 hover:underline">Open details</Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {!loading ? (
        <section className="mt-4 grid gap-4 xl:grid-cols-2">
          <article className="pnf-card p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-900">High-Interest Requests</h2>
              <span className="text-xs text-slate-500">By applicant volume</span>
            </div>

            {topApplicantRequests.length === 0 ? (
              <p className="text-sm text-slate-600">No request has applicant activity yet.</p>
            ) : (
              <div className="space-y-2">
                {topApplicantRequests.map((item) => (
                  <div key={item._id} className="rounded-lg border border-slate-200 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-slate-800">{item.itemName || 'Untitled item'}</p>
                      <StatusBadge value={item._lifecycle} />
                    </div>
                    <p className="mt-1 text-xs text-slate-600">Applicants interested: {item.applicantCount}</p>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="pnf-card p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-900">Recent Notifications</h2>
              <Link to="/notifications" className="text-sm font-medium text-blue-600 hover:underline">View all</Link>
            </div>

            {notifications.length === 0 ? (
              <p className="text-sm text-slate-600">No recent alerts.</p>
            ) : (
              <div className="space-y-2">
                {notifications.slice(0, 6).map((item) => (
                  <div key={item._id} className="rounded-lg border border-slate-200 px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-slate-900">{item.title || 'Notification'}</p>
                      <StatusBadge value={item.type || item.notificationType || 'notice'} />
                    </div>
                    <p className="mt-1 text-xs text-slate-600">{item.message || '-'}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(item.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>
      ) : null}
    </div>
  );
};

export default OwnerDashboardPage;
