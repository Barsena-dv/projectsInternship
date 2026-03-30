import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FiActivity, FiMapPin, FiNavigation, FiSend, FiZap } from 'react-icons/fi';
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
        const active = (res.data || []).filter((a) => a.status === 'active' || a.status === 'assigned');
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
      toast.error('Observation log is empty.');
      return;
    }

    if (form.locationSource === LOCATION_MODES.MANUAL && !form.locationName.trim()) {
      toast.error('Specify tactical location text.');
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
            () => reject(new Error('Location signal lost. Try manual entry.')),
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

      toast.success('Log entry synchronized.');
      setForm((prev) => ({ ...prev, message: '', locationName: '' }));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const sectionLabel = "text-[10px] font-black text-emerald-500/60 uppercase tracking-[0.2em] mb-4 block";

  return (
    <div className="finder-page-enter space-y-8 pb-12 overflow-x-hidden">
      <PageHeader 
        title="Tactical Reporting" 
        subtitle="Broadcast location pings and operational observations to the owner registry." 
      />

      {loading ? <LoadingSpinner text="Synchronizing active missions..." /> : null}

      {!loading && assignments.length === 0 ? (
        <EmptyState title="No Active Signals" description="Accept a mission from the Discovery Feed to start reporting." />
      ) : null}

      {!loading && assignments.length > 0 ? (
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-12 xl:col-span-8">
            <section className="finder-section-card f-hologram-effect">
              <span className={sectionLabel}>Observation Terminal</span>
              <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3">
                <FiActivity className="text-emerald-500" /> Synchronization Protocol
              </h3>

              <form className="space-y-6" onSubmit={submit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Target Mission</label>
                    <select className="pnf-input" value={form.assignmentId} onChange={(e) => setForm((prev) => ({ ...prev, assignmentId: e.target.value }))}>
                      {assignments.map((item) => (
                        <option key={item._id} value={item._id}>{item.request?.itemName || "Unknown Signal"}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Location Protocol</label>
                    <select
                      className="pnf-input"
                      value={form.locationSource}
                      onChange={(e) => setForm((prev) => ({ ...prev, locationSource: e.target.value }))}
                    >
                      <option value={LOCATION_MODES.CURRENT}>GPS Auto-Uplink</option>
                      <option value={LOCATION_MODES.MANUAL}>Manual Coordinate Input</option>
                      <option value={LOCATION_MODES.SKIP}>Dark Mode (Skip Location)</option>
                    </select>
                  </div>
                </div>

                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  {form.locationSource === LOCATION_MODES.MANUAL ? (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tactical Location Text</label>
                      <input
                        className="pnf-input"
                        type="text"
                        placeholder="e.g., Tactical point near Central Park entrance"
                        value={form.locationName}
                        onChange={(e) => setForm((prev) => ({ ...prev, locationName: e.target.value }))}
                      />
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-slate-500 italic flex items-center gap-3">
                      <FiInfo className="text-emerald-500/50" />
                      {form.locationSource === LOCATION_MODES.CURRENT
                        ? 'System will attempt to pulse current GPS coordinates upon broadcast.'
                        : 'Update will be transmitted without spatial telemetry.'}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Operational Observation</label>
                  <textarea
                    className="pnf-input"
                    rows={4}
                    placeholder="Log your current findings or mission progress..."
                    value={form.message}
                    onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                  />
                </div>

                <button className="w-full py-4 bg-emerald-500 text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(16,185,129,0.2)] flex items-center justify-center gap-3" type="submit" disabled={submitting}>
                  {submitting ? (
                    'Synchronizing...'
                  ) : (
                    <>
                      <FiSend size={14} /> Broadcast Update
                    </>
                  )}
                </button>
              </form>
            </section>
          </div>

          <div className="lg:col-span-12 xl:col-span-4 space-y-6">
            <div className="finder-section-card bg-slate-950/40">
              <span className={sectionLabel}>Tactical Note</span>
              <div className="flex gap-4">
                 <div className="shrink-0 w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <FiNavigation size={18} />
                 </div>
                 <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-widest mb-2">Live Reporting</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed italic">
                      Regular interval updates significantly increase requester trust metrics and mission success probability.
                    </p>
                 </div>
              </div>
            </div>
          </div>

        </div>
      ) : null}
    </div>
  );
};

export default FinderTrackingPage;
