import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import { assignmentApi, trackingApi } from '../../services/api';
import { TRACKING_STATUSES } from '../../utils/constants';
import { getErrorMessage, titleCase } from '../../utils/helpers';

const FinderTrackingPage = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    assignmentId: '',
    statusUpdate: TRACKING_STATUSES[0],
    currentLat: '',
    currentLng: '',
    remarks: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await assignmentApi.my();
        const active = (res.data || []).filter((a) => a.status === 'active');
        setAssignments(active);
        if (active[0]) {
          setForm((prev) => ({ ...prev, assignmentId: active[0]._id }));
        }
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await trackingApi.create({
        ...form,
        currentLat: Number(form.currentLat || 0),
        currentLng: Number(form.currentLng || 0),
      });
      toast.success('Tracking update posted');
      setForm((prev) => ({ ...prev, remarks: '', currentLat: '', currentLng: '' }));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Tracking Updates" subtitle="Post assignment progress in real time" />

      {loading ? <LoadingSpinner text="Loading active assignments..." /> : null}

      {!loading && assignments.length === 0 ? <EmptyState title="No active assignments" description="Accept a request first to post updates." /> : null}

      {!loading && assignments.length > 0 ? (
        <section className="pnf-card p-5">
          <form className="grid gap-3 md:grid-cols-2" onSubmit={submit}>
            <select className="pnf-input" value={form.assignmentId} onChange={(e) => setForm((prev) => ({ ...prev, assignmentId: e.target.value }))}>
              {assignments.map((item) => (
                <option key={item._id} value={item._id}>{item.request?.itemName || item._id}</option>
              ))}
            </select>

            <select className="pnf-input" value={form.statusUpdate} onChange={(e) => setForm((prev) => ({ ...prev, statusUpdate: e.target.value }))}>
              {TRACKING_STATUSES.map((status) => (
                <option key={status} value={status}>{titleCase(status)}</option>
              ))}
            </select>

            <input className="pnf-input" type="number" step="any" placeholder="Current latitude" value={form.currentLat} onChange={(e) => setForm((prev) => ({ ...prev, currentLat: e.target.value }))} required />
            <input className="pnf-input" type="number" step="any" placeholder="Current longitude" value={form.currentLng} onChange={(e) => setForm((prev) => ({ ...prev, currentLng: e.target.value }))} required />

            <textarea className="pnf-input md:col-span-2" rows={3} placeholder="Remarks" value={form.remarks} onChange={(e) => setForm((prev) => ({ ...prev, remarks: e.target.value }))} />

            <button className="pnf-btn-primary rounded-lg px-4 py-2 text-sm md:col-span-2" type="submit" disabled={submitting}>
              {submitting ? 'Posting...' : 'Post Update'}
            </button>
          </form>
        </section>
      ) : null}
    </div>
  );
};

export default FinderTrackingPage;
