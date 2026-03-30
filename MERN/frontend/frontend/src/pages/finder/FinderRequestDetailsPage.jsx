import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FiActivity, FiArrowRight, FiCheckCircle, FiClock, FiDollarSign, 
  FiHexagon, FiInfo, FiLayers, FiMapPin, FiNavigation, FiSearch, 
  FiShield, FiTarget, FiZap 
} from 'react-icons/fi';
import EmptyState from '../../components/common/EmptyState';
import GlassModal from '../../components/common/GlassModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { assignmentApi, requestApi } from '../../services/api';
import { formatCurrency, formatDate, getErrorMessage } from '../../utils/helpers';

const FinderRequestDetailsPage = () => {
  const { id: requestId } = useParams();
  const [loading, setLoading] = useState(true);
  const [requestItem, setRequestItem] = useState(null);
  const [existingAssignment, setExistingAssignment] = useState(null);
  const [applying, setApplying] = useState(false);
  const [applicationSent, setApplicationSent] = useState(false);
  const [applyState, setApplyState] = useState({ open: false, applyReason: '', finderRegion: '' });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [requestRes, assignmentsRes, applicationsRes] = await Promise.all([
        requestApi.byId(requestId),
        assignmentApi.my().catch(() => ({ data: [] })),
        assignmentApi.myApplications().catch(() => ({ data: [] })),
      ]);

      const requestData = requestRes?.data || null;
      const matchedAssignment = (assignmentsRes?.data || []).find(
        (row) => String(row?.request?._id || row?.request) === String(requestId)
      );
      const hasPendingApp = (applicationsRes?.data || []).some(
        (row) => String(row?.request?._id || row?.request) === String(requestId) && 
        String(row?.status || '').toLowerCase() === 'pending'
      );

      setRequestItem(requestData);
      setExistingAssignment(matchedAssignment || null);
      setApplicationSent(hasPendingApp);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => { load(); }, [load]);

  const requestIsOpen = String(requestItem?.requestStatus || '').toLowerCase() === 'open';

  const actionState = useMemo(() => {
    if (existingAssignment) return { disabled: true, label: 'Already Assigned', helper: 'Deep link active. Tracking in progress.', icon: <FiTarget size={16} />, color: 'text-emerald-500' };
    if (applicationSent) return { disabled: true, label: 'Signal Broadcasted', helper: 'Awaiting synchronization confirmation from owner.', icon: <FiActivity size={16} />, color: 'text-amber-500' };
    if (!requestIsOpen) return { disabled: true, label: 'Link Offline', helper: 'Extraction window for this target is closed.', icon: <FiZap size={16} />, color: 'text-rose-500' };
    return { disabled: false, label: 'Initialize Deployment', helper: 'Join the discovery protocol for this target.', icon: <FiNavigation size={16} />, color: 'text-emerald-500' };
  }, [applicationSent, existingAssignment, requestIsOpen]);

  const applyForAssignment = async () => {
    try {
      setApplying(true);
      await assignmentApi.accept(requestId, { applyReason: applyState.applyReason, finderRegion: applyState.finderRegion });
      setApplicationSent(true);
      setApplyState({ open: false, applyReason: '', finderRegion: '' });
      toast.success('Mission proposal synchronized.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <LoadingSpinner text="Decoding Target Signal..." />;
  if (!requestItem) return <EmptyState title="Signal Lost" description="Target vector no longer detected on this frequency." />;

  const sectionLabel = "text-[10px] font-black text-emerald-500/60 uppercase tracking-[0.2em] mb-4 block";

  return (
    <div className="finder-page-enter space-y-8 pb-12 overflow-x-hidden">
      <PageHeader
        title="Target Intelligence"
        subtitle="Full forensic profile and operational engagement telemetry"
        actions={(
          <div className="flex gap-3">
            <Link to="/finder/requests" className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-all">
               Close Feed
            </Link>
          </div>
        )}
      />

      <div className="grid lg:grid-cols-12 gap-8 relative items-start">
        
        {/* Intelligence Report Column */}
        <div className="lg:col-span-12 xl:col-span-8 space-y-8 order-2 xl:order-1">
           <div className="finder-section-card f-hologram-effect overflow-hidden">
              <span className={sectionLabel}>Target Identification</span>
              <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-8">
                 <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 leading-tight">{requestItem.itemName}</h2>
                    <div className="flex items-center gap-3 text-emerald-500/70 text-[10px] sm:text-xs font-bold">
                       <FiMapPin size={14} className="shrink-0" /> {requestItem.lastSeenLocation}
                    </div>
                 </div>
                 <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-2 w-full sm:w-auto">
                    <StatusBadge value={requestItem.requestStatus} />
                    <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-md border border-white/5 ml-auto sm:ml-0">
                       {requestItem?.planId?.planName} Protocol
                    </span>
                 </div>
              </div>

              <div className="p-4 sm:p-6 rounded-3xl bg-slate-950/50 border border-white/5 space-y-6">
                 <div>
                    <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3">Operational Briefing</span>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic border-l-2 border-emerald-500/30 pl-4 bg-emerald-500/5 py-4 rounded-r-2xl">
                       "{requestItem.itemDescription || 'Detailed profile restricted.'}"
                    </p>
                 </div>

                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-6 border-t border-white/5">
                    <div className="space-y-1">
                       <span className="text-[8px] sm:text-[9px] font-bold text-slate-600 uppercase">Detection</span>
                       <p className="text-[10px] sm:text-xs text-white font-black">{requestItem?.planId?.searchDuration} Days Active</p>
                    </div>
                    <div className="space-y-1">
                       <span className="text-[8px] sm:text-[9px] font-bold text-slate-600 uppercase">Category</span>
                       <p className="text-[10px] sm:text-xs text-white font-black truncate">{requestItem.itemCategory || 'General'}</p>
                    </div>
                    <div className="space-y-1">
                       <span className="text-[8px] sm:text-[9px] font-bold text-slate-600 uppercase">Timestamp</span>
                       <p className="text-[10px] sm:text-xs text-white font-black">{formatDate(requestItem.createdAt)}</p>
                    </div>
                    <div className="space-y-1 sm:text-right">
                       <span className="text-[8px] sm:text-[9px] font-bold text-emerald-600 uppercase">Bounty Pool</span>
                       <p className="text-xs sm:text-sm text-emerald-500 font-black">{formatCurrency(requestItem?.rewardAmount || requestItem?.planId?.rewardAmount || 0)}</p>
                    </div>
                 </div>
              </div>

              <div className="mt-8 p-4 sm:p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-4">
                 <FiShield size={24} className="text-emerald-500/40 shrink-0" />
                 <div>
                    <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Protocol Verified</h4>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 italic leading-relaxed">Reward pool is locked in escrow. Payout is automated upon Forensic Sync.</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Deployment Action Column */}
        <div className="lg:col-span-12 xl:col-span-4 space-y-8 order-1 xl:order-2">
           <div className="finder-section-card bg-slate-950/80 !border-emerald-500/10 h-full overflow-hidden">
              <span className={sectionLabel}>Engagement Protocol</span>
              <h3 className="text-xl font-black text-white mb-8">Mission Status</h3>
              
              <div className="p-5 sm:p-6 rounded-2xl bg-white/5 border border-white/5 mb-8 transition-all hover:bg-white/10">
                 <div className={`flex items-center gap-3 mb-4 ${actionState.color}`}>
                    {actionState.icon}
                    <span className="text-[10px] font-black uppercase tracking-widest">{actionState.label}</span>
                 </div>
                 <p className="text-[10px] sm:text-xs text-slate-500 leading-relaxed italic">{actionState.helper}</p>
              </div>

              {!actionState.disabled ? (
                <button 
                  onClick={() => setApplyState(s => ({...s, open: true}))} 
                  className="w-full py-4 bg-emerald-500 text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:scale-105 active:scale-95 hover:shadow-[0_10px_30px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-3"
                >
                  <FiZap size={14} /> Initialize Deployment
                </button>
              ) : (
                <div className="flex flex-col gap-3">
                   {existingAssignment && (
                     <Link to={`/finder/assignments/${existingAssignment._id || existingAssignment}`} className="w-full py-4 border border-emerald-500/30 text-emerald-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-center hover:bg-emerald-500/5 transition-all">
                        Initialize Workbench
                     </Link>
                   )}
                   <button disabled className="w-full py-4 bg-slate-900 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] cursor-not-allowed border border-white/5">
                      System Locked
                   </button>
                </div>
              )}

              <div className="mt-8 pt-8 border-t border-white/5">
                 <div className="flex items-center gap-3 mb-4">
                    <FiLayers size={16} className="text-slate-500" />
                    <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest">Requester Reliability</span>
                 </div>
                 <div className="flex items-center gap-2">
                    {[1,2,3,4,5].map(i => <FiHexagon key={i} className={i <= 4 ? "text-emerald-500" : "text-slate-800"} />)}
                    <span className="text-[10px] font-black text-white ml-2">4.8 / 5.0</span>
                 </div>
              </div>
           </div>
        </div>

      </div>

      <GlassModal
        open={applyState.open}
        title="Deployment Protocol"
        subtitle="Join the discovery synchronization for this recovery mission."
        confirmText={applying ? 'Syncing...' : 'Broadcast Application'}
        onClose={() => !applying && setApplyState({ open: false, applyReason: '', finderRegion: '' })}
        onConfirm={applyForAssignment}
        loading={applying}
      >
        <div className="space-y-6 px-1 sm:px-0">
           <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest block mb-1">Target Confirmation</span>
              <p className="text-base sm:text-lg font-black text-white">{requestItem.itemName}</p>
           </div>
           
           <div>
              <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Deployment Region</label>
              <input 
                className="pnf-input" type="text" placeholder="Operational base area..." 
                value={applyState.finderRegion} onChange={(e) => setApplyState((prev) => ({ ...prev, finderRegion: e.target.value }))} 
                disabled={applying}
              />
           </div>
           <div>
              <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Mission Rationale</label>
              <textarea 
                className="pnf-input" rows={3} placeholder="Proximity or specialized notes..." 
                value={applyState.applyReason} onChange={(e) => setApplyState((prev) => ({ ...prev, applyReason: e.target.value }))} 
                disabled={applying}
              />
           </div>
        </div>
      </GlassModal>
    </div>
  );
};

export default FinderRequestDetailsPage;
