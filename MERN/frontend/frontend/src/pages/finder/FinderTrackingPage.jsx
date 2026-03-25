import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import { assignmentApi, trackingApi } from '../../services/api';
import { getErrorMessage } from '../../utils/helpers';

const LOCATION_MODES = {
  CURRENT: 'current',
  MANUAL: 'manual_text',
  SKIP: 'skipped',
};

const FinderTrackingPage = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    assignmentId: '',
    statusUpdate: 'progress',
    locationSource: LOCATION_MODES.CURRENT,
    locationName: '',
    message: '',
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

    if (!form.message.trim()) {
      toast.error('Please add a progress message.');
      return;
    }

    if (form.locationSource === LOCATION_MODES.MANUAL && !form.locationName.trim()) {
      toast.error('Please enter your location manually or choose another option.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...form,
        mode: 'prompt',
        remarks: form.message.trim(),
      };

      if (form.locationSource === LOCATION_MODES.CURRENT && navigator.geolocation) {
        const coords = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (position) => resolve(position.coords),
            () => reject(new Error('Could not fetch current location. Try manual entry or skip.')),
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 2 * 60 * 1000 }
          );
        });

        payload.currentLat = Number(coords.latitude);
        payload.currentLng = Number(coords.longitude);
        payload.statusUpdate = 'location_ping';
      }

      if (form.locationSource === LOCATION_MODES.MANUAL) {
        payload.locationName = form.locationName.trim();
        payload.statusUpdate = 'manual_note';
      }

      if (form.locationSource === LOCATION_MODES.SKIP) {
        payload.statusUpdate = 'skip';
      }

      await trackingApi.create(payload);

      toast.success('Tracking update posted');
      setForm((prev) => ({ ...prev, message: '', locationName: '' }));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Tracking Updates" subtitle="Hybrid tracking: current location, manual location text, or skip" />

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

            <select
              className="pnf-input"
              value={form.locationSource}
              onChange={(e) => setForm((prev) => ({ ...prev, locationSource: e.target.value }))}
            >
              <option value={LOCATION_MODES.CURRENT}>Use current location</option>
              <option value={LOCATION_MODES.MANUAL}>Enter location manually</option>
              <option value={LOCATION_MODES.SKIP}>Skip location for now</option>
            </select>

            {form.locationSource === LOCATION_MODES.MANUAL ? (
              <input
                className="pnf-input"
                type="text"
                placeholder="Enter location (e.g., Near City Mall)"
                value={form.locationName}
                onChange={(e) => setForm((prev) => ({ ...prev, locationName: e.target.value }))}
              />
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                {form.locationSource === LOCATION_MODES.CURRENT
                  ? 'Location will be fetched automatically at submit time.'
                  : 'Update will be submitted without location coordinates.'}
              </div>
            )}

            <textarea
              className="pnf-input md:col-span-2"
              rows={3}
              placeholder="Progress message"
              value={form.message}
              onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
            />

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
