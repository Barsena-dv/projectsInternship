import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { assignmentApi, ratingApi, requestApi } from '../../services/api';
import { getErrorMessage } from '../../utils/helpers';

const OwnerRatingsPage = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ assignmentId: '', ratingValue: 5, reviewText: '' });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const reqRes = await requestApi.my();
        const requests = reqRes.data || [];
        const records = await Promise.all(
          requests.map((req) => assignmentApi.byRequest(req._id).then((res) => res.data).catch(() => null))
        );

        const completed = records.filter((a) => a && a.status === 'completed');
        setAssignments(completed);
        if (completed[0]) {
          setForm((prev) => ({ ...prev, assignmentId: completed[0]._id }));
        }
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const submitRating = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await ratingApi.create({
        assignmentId: form.assignmentId,
        ratingValue: Number(form.ratingValue),
        reviewText: form.reviewText,
      });
      toast.success('Rating submitted');
      setForm((prev) => ({ ...prev, reviewText: '' }));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Ratings" subtitle="Rate completed finder assignments" />

      {loading ? <LoadingSpinner text="Loading completed assignments..." /> : null}

      {!loading && assignments.length === 0 ? (
        <EmptyState title="No completed assignments" description="Ratings are available after release and completion." />
      ) : null}

      {!loading && assignments.length > 0 ? (
        <>
          <section className="pnf-card p-5">
            <h2 className="text-lg font-semibold text-slate-900">Submit Rating</h2>
            <form className="mt-3 grid gap-3 md:grid-cols-3" onSubmit={submitRating}>
              <select className="pnf-input" value={form.assignmentId} onChange={(e) => setForm((prev) => ({ ...prev, assignmentId: e.target.value }))}>
                {assignments.map((a) => (
                  <option key={a._id} value={a._id}>{a.request?.itemName || a._id}</option>
                ))}
              </select>

              <input className="pnf-input" min={1} max={5} type="number" value={form.ratingValue} onChange={(e) => setForm((prev) => ({ ...prev, ratingValue: e.target.value }))} />

              <button className="pnf-btn-primary rounded-lg px-3 py-2 text-sm" type="submit" disabled={submitting}>
                Submit
              </button>

              <textarea
                className="pnf-input md:col-span-3"
                rows={3}
                placeholder="Write review"
                value={form.reviewText}
                onChange={(e) => setForm((prev) => ({ ...prev, reviewText: e.target.value }))}
              />
            </form>
          </section>

          <section className="pnf-card mt-4 p-5">
            <h2 className="text-lg font-semibold text-slate-900">Completed Assignments</h2>
            <div className="mt-3 space-y-2">
              {assignments.map((item) => (
                <article className="rounded-xl border border-slate-200 p-3" key={item._id}>
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-800">{item.request?.itemName || '-'}</p>
                    <StatusBadge value={item.status} />
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
};

export default OwnerRatingsPage;
