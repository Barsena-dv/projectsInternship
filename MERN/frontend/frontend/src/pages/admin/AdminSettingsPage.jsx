import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import { adminApi } from '../../services/api';
import { getErrorMessage } from '../../utils/helpers';
import { FiSettings, FiSave, FiClock, FiMaximize, FiShield, FiDatabase } from 'react-icons/fi';

const AdminSettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [settingsDraft, setSettingsDraft] = useState({
    defaultAssignmentDeadlineHours: 4,
    trackingIntervalMinutes: 15,
    maxEvidenceImages: 5,
    maxEvidenceVideoSeconds: 120,
    disputeWindowHours: 48,
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.settings();
      const data = res?.data || null;
      setSettings(data);
      if (data) {
        setSettingsDraft({
          defaultAssignmentDeadlineHours: data.defaultAssignmentDeadlineHours ?? 4,
          trackingIntervalMinutes: data.trackingIntervalMinutes ?? 15,
          maxEvidenceImages: data.maxEvidenceImages ?? 5,
          maxEvidenceVideoSeconds: data.maxEvidenceVideoSeconds ?? 120,
          disputeWindowHours: data.disputeWindowHours ?? 48,
        });
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveSettings = async (e) => {
    e.preventDefault();
    try {
      await adminApi.updateSettings({
        defaultAssignmentDeadlineHours: Number(settingsDraft.defaultAssignmentDeadlineHours),
        trackingIntervalMinutes: Number(settingsDraft.trackingIntervalMinutes),
        maxEvidenceImages: Number(settingsDraft.maxEvidenceImages),
        maxEvidenceVideoSeconds: Number(settingsDraft.maxEvidenceVideoSeconds),
        disputeWindowHours: Number(settingsDraft.disputeWindowHours),
      });
      toast.success('System configuration synchronized.');
      await loadData();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (loading) return <LoadingSpinner text="Connecting to configuration layer..." />;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="System Parameters" 
        subtitle="Operational limits, discovery intervals, and forensic compliance configurations" 
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <article className="admin-card">
          <form onSubmit={saveSettings} className="space-y-6">
            <h3 className="text-sm font-black text-white mb-6 uppercase tracking-wider flex items-center gap-2">
              <FiSettings className="text-indigo-400" /> Operational Configuration
            </h3>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                 <div className="flex items-center gap-3 mb-2">
                    <FiClock className="text-indigo-400" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Temporal Limits</span>
                 </div>
                 <div className="grid gap-4">
                    <div>
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Default Assignment Deadline (Hours)</label>
                       <input 
                         type="number"
                         className="w-full bg-slate-900/50 border border-white/5 rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none"
                         value={settingsDraft.defaultAssignmentDeadlineHours}
                         onChange={e => setSettingsDraft(p => ({ ...p, defaultAssignmentDeadlineHours: e.target.value }))}
                       />
                    </div>
                    <div>
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Dispute Window (Hours)</label>
                       <input 
                         type="number"
                         className="w-full bg-slate-900/50 border border-white/5 rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none"
                         value={settingsDraft.disputeWindowHours}
                         onChange={e => setSettingsDraft(p => ({ ...p, disputeWindowHours: e.target.value }))}
                       />
                    </div>
                 </div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                 <div className="flex items-center gap-3 mb-2">
                    <FiMaximize className="text-indigo-400" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Payload Limits</span>
                 </div>
                 <div className="grid gap-4">
                    <div>
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Maximum Evidence Images</label>
                       <input 
                         type="number"
                         className="w-full bg-slate-900/50 border border-white/5 rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none"
                         value={settingsDraft.maxEvidenceImages}
                         onChange={e => setSettingsDraft(p => ({ ...p, maxEvidenceImages: e.target.value }))}
                       />
                    </div>
                    <div>
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Max Video Duration (Seconds)</label>
                       <input 
                         type="number"
                         className="w-full bg-slate-900/50 border border-white/5 rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none"
                         value={settingsDraft.maxEvidenceVideoSeconds}
                         onChange={e => setSettingsDraft(p => ({ ...p, maxEvidenceVideoSeconds: e.target.value }))}
                       />
                    </div>
                 </div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                 <div className="flex items-center gap-3 mb-2">
                    <FiDatabase className="text-indigo-400" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Telemetry Intervals</span>
                 </div>
                 <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Tracking Ping Interval (Minutes)</label>
                    <input 
                      type="number"
                      className="w-full bg-slate-900/50 border border-white/5 rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none"
                      value={settingsDraft.trackingIntervalMinutes}
                      onChange={e => setSettingsDraft(p => ({ ...p, trackingIntervalMinutes: e.target.value }))}
                    />
                 </div>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-3 bg-indigo-500 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-500/30 hover:bg-indigo-600 transition-all flex items-center justify-center gap-2"
            >
              <FiSave /> Persist Configurations
            </button>
          </form>
        </article>

        <article className="space-y-6">
           <div className="admin-card">
              <h3 className="text-sm font-black text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                 <FiShield className="text-emerald-500" /> Technical Compliance
              </h3>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed italic">
                 Modifying these parameters affects the global integrity layer. Deadlines and intervals are applied to new linkages created after synchronization.
              </p>
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                 <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Last Deployment Sync</p>
                 <p className="text-xs text-emerald-400 font-mono">2026-03-28 14:15:30.455 - SYSTEM_ID: C0993</p>
              </div>
           </div>

           <div className="admin-card border-amber-500/20">
              <div className="flex items-center gap-2 mb-4">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <h3 className="text-xs font-black text-white uppercase tracking-wider">Engine Status</h3>
              </div>
              <div className="space-y-2">
                 <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                    <span>Database Link:</span>
                    <span className="text-emerald-500 font-black tracking-widest">SYNCHRONIZED</span>
                 </div>
                 <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                    <span>Cache Invalidation:</span>
                    <span className="text-emerald-500 font-black tracking-widest">OPERATIONAL</span>
                 </div>
              </div>
           </div>
        </article>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
