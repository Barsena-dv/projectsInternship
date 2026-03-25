import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { assignmentApi, evidenceApi } from '../../services/api';
import { deriveFinderLifecycleState, getFinderLifecycleMessage } from '../../utils/finderLifecycle';
import { formatDate, getErrorMessage } from '../../utils/helpers';

const FinderAssignmentsPage = () => {
  const [items, setItems] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [res, myApplicationsRes] = await Promise.all([
          assignmentApi.my(),
          assignmentApi.myApplications().catch(() => ({ data: [] })),
        ]);

        const assignments = res.data || [];
        const pendingApplications = (myApplicationsRes.data || []).filter(
          (row) => String(row?.status || '').toLowerCase() === 'pending'
        );

        const evidencePairs = await Promise.all(
          assignments.map(async (assignment) => {
            const evidenceRes = await evidenceApi.byAssignment(assignment._id).catch(() => ({ data: null }));
            return [String(assignment._id), evidenceRes?.data || null];
          })
        );

        const evidenceByAssignmentId = Object.fromEntries(evidencePairs);

        setItems(
          assignments.map((assignment) => ({
            ...assignment,
            __evidence: evidenceByAssignmentId[String(assignment._id)] || null,
          }))
        );
        setApplications(pendingApplications);
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div>
      <PageHeader title="My Assignments" subtitle="Applied, active, and completed assignment flow" />

      {loading ? <LoadingSpinner text="Loading assignments..." /> : null}
      {!loading && items.length === 0 && applications.length === 0 ? <EmptyState title="No assignments yet" description="Apply to open requests to begin." /> : null}

      {!loading && applications.length > 0 ? (
        <section className="mb-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">Applied Requests</h3>
          {applications.map((item) => (
            <article key={item._id} className="pnf-card p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">{item?.request?.itemName || '-'}</h3>
                  <p className="text-sm text-slate-600">Applied {formatDate(item.createdAt)}</p>
                  <p className="mt-1 text-xs text-slate-500">Waiting for owner approval</p>
                </div>

                <div className="flex items-center gap-3">
                  <StatusBadge value="pending" />
                  <Link to={`/finder/requests/${item?.request?._id || item?.request}`} className="text-sm font-medium text-blue-600 hover:underline">
                    View Request
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {!loading && items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            (() => {
              const lifecycleState = deriveFinderLifecycleState({ assignment: item, evidence: item.__evidence });
              return (
            <article key={item._id} className="pnf-card p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">{item.request?.itemName || '-'}</h3>
                  <p className="text-sm text-slate-600">Assigned {formatDate(item.assignedAt || item.createdAt)}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {getFinderLifecycleMessage(lifecycleState)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <StatusBadge value={lifecycleState} />
                  <Link to={`/finder/assignments/${item._id}`} className="text-sm font-medium text-blue-600 hover:underline">
                    View Details
                  </Link>
                </div>
              </div>
            </article>
              );
            })()
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default FinderAssignmentsPage;
