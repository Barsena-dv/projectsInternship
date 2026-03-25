import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { adminApi } from '../../services/api';
import { formatDate, getErrorMessage, titleCase } from '../../utils/helpers';

const AdminDisputesPage = () => {
  const [disputes, setDisputes] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);

  const load = async (status = statusFilter) => {
    try {
      setLoading(true);
      const res = await adminApi.disputes(status || undefined);
      setDisputes(res.data || []);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resolve = async (disputeId, adminDecision) => {
    const resolutionDetails = window.prompt('Enter resolution details');
    if (!resolutionDetails) return;

    try {
      setResolvingId(disputeId);
      await adminApi.resolveDispute(disputeId, { adminDecision, resolutionDetails });
      toast.success('Dispute resolved');
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Disputes"
        subtitle="Review and resolve dispute escalations"
        actions={(
          <div className="flex items-center gap-2">
            <select className="pnf-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All</option>
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
            </select>
            <button className="pnf-btn-outline rounded-lg px-3 py-2 text-sm" type="button" onClick={() => load(statusFilter)}>
              Filter
            </button>
          </div>
        )}
      />

      {loading ? <LoadingSpinner text="Loading disputes..." /> : null}

      {!loading && disputes.length === 0 ? <EmptyState title="No disputes found" description="Try changing filter." /> : null}

      {!loading && disputes.length > 0 ? (
        <div className="space-y-3">
          {disputes.map((dispute) => (
            <article className="pnf-card p-4" key={dispute._id}>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">{titleCase(dispute.reason)}</h3>
                  <p className="text-sm text-slate-600">Raised by {dispute.raisedBy?.full_name || '-'} • {formatDate(dispute.createdAt)}</p>
                  <p className="mt-1 text-sm text-slate-700">{dispute.description}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge value={dispute.status} />
                  {dispute.status === 'open' ? (
                    <>
                      <button
                        className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-medium text-white"
                        type="button"
                        disabled={resolvingId === dispute._id}
                        onClick={() => resolve(dispute._id, 'owner_wins')}
                      >
                        Owner Wins
                      </button>
                      <button
                        className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white"
                        type="button"
                        disabled={resolvingId === dispute._id}
                        onClick={() => resolve(dispute._id, 'finder_wins')}
                      >
                        Finder Wins
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default AdminDisputesPage;
