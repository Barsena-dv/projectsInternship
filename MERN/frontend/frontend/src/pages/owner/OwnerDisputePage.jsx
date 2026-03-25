import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { assignmentApi, disputeApi, requestApi } from '../../services/api';
import { DISPUTE_REASONS } from '../../utils/constants';
import { formatDate, getErrorMessage, titleCase } from '../../utils/helpers';

const OwnerDisputePage = () => {
  const [assignments, setAssignments] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    assignmentId: '',
    reason: DISPUTE_REASONS[0],
    evidence: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const reqRes = await requestApi.my();
      const requests = reqRes.data || [];

      const assignmentData = (
        await Promise.all(requests.map((req) => assignmentApi.byRequest(req._id).then((res) => res.data).catch(() => null)))
      ).filter(Boolean);

      setAssignments(assignmentData);

      const disputesData = (
        await Promise.all(assignmentData.map((a) => disputeApi.byAssignment(a._id).then((res) => res.data).catch(() => null)))
      ).filter(Boolean);

      setDisputes(disputesData);

      if (assignmentData[0]) {
        setForm((prev) => ({ ...prev, assignmentId: assignmentData[0]._id }));
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const submitDispute = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await disputeApi.create({
        assignmentId: form.assignmentId,
        reason: form.reason,
        evidence: form.evidence,
      });
      toast.success('Dispute raised');
      setForm((prev) => ({ ...prev, evidence: '' }));
      await loadData();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Disputes" subtitle="Raise disputes when conflicts appear in assignment lifecycle" />

      {loading ? <LoadingSpinner text="Loading disputes..." /> : null}

      {!loading && assignments.length === 0 ? <EmptyState title="No assignments" description="Dispute can only be created after assignment." /> : null}

      {!loading && assignments.length > 0 ? (
        <section className="pnf-card mb-4 p-5">
          <h2 className="text-lg font-semibold text-slate-900">Raise Dispute</h2>
          <form className="mt-3 grid gap-3 md:grid-cols-3" onSubmit={submitDispute}>
            <select className="pnf-input" value={form.assignmentId} onChange={(e) => setForm((prev) => ({ ...prev, assignmentId: e.target.value }))}>
              {assignments.map((a) => (
                <option value={a._id} key={a._id}>{a.request?.itemName || a._id}</option>
              ))}
            </select>

            <select className="pnf-input" value={form.reason} onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}>
              {DISPUTE_REASONS.map((reason) => (
                <option value={reason} key={reason}>{titleCase(reason)}</option>
              ))}
            </select>

            <button className="pnf-btn-primary rounded-lg px-3 py-2 text-sm" type="submit" disabled={submitting}>
              Raise
            </button>

            <textarea
              className="pnf-input md:col-span-3"
              rows={3}
              placeholder="Describe the issue"
              value={form.evidence}
              onChange={(e) => setForm((prev) => ({ ...prev, evidence: e.target.value }))}
              required
            />
          </form>
        </section>
      ) : null}

      {!loading && disputes.length === 0 ? <EmptyState title="No disputes yet" description="Open disputes will appear here." /> : null}

      {!loading && disputes.length > 0 ? (
        <section className="pnf-card p-5">
          <h2 className="text-lg font-semibold text-slate-900">My Disputes</h2>
          <div className="mt-3 space-y-2">
            {disputes.map((item) => (
              <article key={item._id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-900">{titleCase(item.reason)}</p>
                  <StatusBadge value={item.status} />
                </div>
                <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                <p className="mt-1 text-xs text-slate-500">{formatDate(item.createdAt)}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
};

export default OwnerDisputePage;
