import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FiActivity, FiArrowRight, FiCheckCircle, FiClock, FiCloud, 
  FiInfo, FiLayers, FiMapPin, FiNavigation, FiPlus, 
  FiShield, FiTarget, FiTrash2, FiVideo, FiZap, FiSearch 
} from 'react-icons/fi';
import EmptyState from '../../components/common/EmptyState';
import GlassModal from '../../components/common/GlassModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { assignmentApi, evidenceApi, payoutApi, trackingApi } from '../../services/api';
import { deriveFinderLifecycleState, getFinderLifecycleMessage, isDeadlineMissed } from '../../utils/finderLifecycle';
import { formatCurrency, formatDate, getErrorMessage } from '../../utils/helpers';

const TWO_MINUTES_SECONDS = 120;
const AUTO_TRACKING_INTERVAL_MS = 15 * 60 * 1000;

const LOCATION_MODES = {
  CURRENT: 'current',
  MANUAL: 'manual_text',
  SKIP: 'skipped',
};

const formatDuration = (remainingMs) => {
  if (remainingMs <= 0) return 'Signal Extinguished';
  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / (24 * 3600));
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
};

const readVideoDurationSeconds = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const seconds = Number(video.duration || 0);
      URL.revokeObjectURL(url);
      resolve(seconds);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Signal integrity check failed: Video unreadable.'));
    };
    video.src = url;
  });

const validateEvidenceFiles = async (fileList) => {
  const files = Array.from(fileList || []);
  if (files.length === 0) return { valid: false, message: 'Upload at least one evidence vector.' };
  const imageFiles = files.filter((file) => String(file.type || '').startsWith('image/'));
  const videoFiles = files.filter((file) => String(file.type || '').startsWith('video/'));
  const unknownFiles = files.length - imageFiles.length - videoFiles.length;
  if (unknownFiles > 0) return { valid: false, message: 'Invalid format. Use approved visual protocols.' };
  if (videoFiles.length > 1) return { valid: false, message: 'Protocol constraint: Single video stream only.' };
  if (videoFiles.length === 1 && imageFiles.length > 0) return { valid: false, message: 'Use either static or dynamic evidence protocols, not both.' };
  if (imageFiles.length > 5) return { valid: false, message: 'Maximum 5 static evidence vectors allowed.' };
  if (videoFiles.length === 1) {
    const seconds = await readVideoDurationSeconds(videoFiles[0]);
    if (seconds > TWO_MINUTES_SECONDS) return { valid: false, message: 'Video must be 2 minutes or shorter.' };
  }
  return { valid: true, message: '' };
};

const getEvidenceFileUrl = (file) => file?.url || file?.secure_url || file?.fileUrl || file?.path || null;

const mergeEvidenceFiles = (existingFiles, incomingFiles) => {
  const merged = [...existingFiles];
  const seen = new Set(existingFiles.map((file) => `${file.name}-${file.size}-${file.lastModified}`));
  incomingFiles.forEach((file) => {
    const key = `${file.name}-${file.size}-${file.lastModified}`;
    if (!seen.has(key)) { seen.add(key); merged.push(file); }
  });
  return merged;
};

const FinderAssignmentDetailsPage = () => {
  const { id: assignmentId } = useParams();
  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [evidence, setEvidence] = useState(null);
  const [payout, setPayout] = useState(null);
  const [postingUpdate, setPostingUpdate] = useState(false);
  const [submittingEvidence, setSubmittingEvidence] = useState(false);
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [autoTrackingEnabled, setAutoTrackingEnabled] = useState(false);
  const [remainingMs, setRemainingMs] = useState(0);
  const [pauseLoading, setPauseLoading] = useState(false);

  const [trackingForm, setTrackingForm] = useState({ message: '', locationSource: LOCATION_MODES.CURRENT, locationName: '' });
  const [evidenceForm, setEvidenceForm] = useState({ description: '', files: [] });
  const [evidenceValidationError, setEvidenceValidationError] = useState('');

  const selectedEvidencePreviews = useMemo(() => (evidenceForm.files || []).map((file) => ({
    key: `${file.name}-${file.size}-${file.lastModified}`,
    type: String(file.type || ''),
    url: URL.createObjectURL(file),
    name: file.name,
  })), [evidenceForm.files]);

  useEffect(() => () => selectedEvidencePreviews.forEach((item) => URL.revokeObjectURL(item.url)), [selectedEvidencePreviews]);

  const addEvidenceFiles = async (fileList) => {
    const incoming = Array.from(fileList || []);
    const merged = mergeEvidenceFiles(evidenceForm.files, incoming);
    const validation = await validateEvidenceFiles(merged);
    if (!validation.valid) { toast.error(validation.message); return; }
    setEvidenceForm(prev => ({ ...prev, files: merged }));
  };

  const removeEvidenceFile = (key) => {
    setEvidenceForm(prev => ({
      ...prev,
      files: prev.files.filter(f => `${f.name}-${f.size}-${f.lastModified}` !== key)
    }));
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await assignmentApi.byId(assignmentId);
      if (res.data.success) {
        setAssignment(res.data.data.assignment || res.data.data);
        setPayout(res.data.data.payout);
      }
      const [timelineData, evidenceData] = await Promise.all([
        assignmentApi.timeline(assignmentId).catch(() => ({ data: [] })),
        evidenceApi.byAssignment(assignmentId).catch(() => ({ data: null }))
      ]);
      setTimeline(timelineData.data || []);
      setEvidence(evidenceData.data || null);
    } catch (error) { toast.error(getErrorMessage(error)); } finally { setLoading(false); }
  }, [assignmentId]);

  useEffect(() => { loadData(); }, [loadData]);

  const lifecycleState = useMemo(() => deriveFinderLifecycleState({ assignment, evidence, deadline: assignment?.deadlineAt }), [assignment, evidence]);
  const finderDeadlineValue = assignment?.deadlineAt;
  const finderDeadlineMissed = isDeadlineMissed(finderDeadlineValue);
  const canAddTracking = !['completed', 'cancelled', 'expired', 'failed'].includes(lifecycleState);
  const evidenceStatus = String(evidence?.verificationStatus || '').toLowerCase();
  const canUploadEvidence = canAddTracking && !finderDeadlineMissed && (!evidence || evidenceStatus === 'rejected');
  const chatEnabled = (lifecycleState === 'verified' || Boolean(assignment?.chatUnlocked) || lifecycleState === 'completed') && !['expired', 'failed'].includes(lifecycleState);

  useEffect(() => {
    if (!finderDeadlineValue) { setRemainingMs(0); return; }
    const tick = () => setRemainingMs(Math.max(new Date(finderDeadlineValue).getTime() - Date.now(), 0));
    tick(); const timer = setInterval(tick, 1000); return () => clearInterval(timer);
  }, [finderDeadlineValue]);

  const submitTrackingUpdate = async (e) => {
    e.preventDefault();
    if (!trackingForm.message.trim()) return toast.error('Observation log is empty.');
    try {
      setPostingUpdate(true);
      const payload = { assignmentId, remarks: trackingForm.message, locationSource: trackingForm.locationSource, statusUpdate: 'progress', mode: 'prompt' };
      if (trackingForm.locationSource === LOCATION_MODES.CURRENT) {
        const coords = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(p => res(p.coords), () => rej(new Error('Location signal lost.')), { timeout: 10000 }));
        payload.currentLat = coords.latitude; payload.currentLng = coords.longitude; payload.statusUpdate = 'location_ping';
      } else if (trackingForm.locationSource === LOCATION_MODES.MANUAL) {
        if (!trackingForm.locationName.trim()) throw new Error('Specify tactical location text.');
        payload.locationName = trackingForm.locationName; payload.statusUpdate = 'manual_note';
      } else payload.statusUpdate = 'skip';
      await trackingApi.create(payload);
      toast.success('Log entry synchronized.');
      setTrackingForm({ message: '', locationSource: LOCATION_MODES.CURRENT, locationName: '' }); setTrackingModalOpen(false);
      setTimeline((await assignmentApi.timeline(assignmentId)).data || []);
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setPostingUpdate(false); }
  };

  const submitEvidence = async (e) => {
    e.preventDefault();
    if (!evidenceForm.files.length || !evidenceForm.description.trim()) return toast.error('Complete forensics profile required.');
    const validation = await validateEvidenceFiles(evidenceForm.files);
    if (!validation.valid) return toast.error(validation.message);
    try {
      setSubmittingEvidence(true);
      const fd = new FormData(); fd.append('description', evidenceForm.description);
      Array.from(evidenceForm.files).forEach(f => fd.append('files', f));
      await evidenceApi.upload(assignmentId, fd); toast.success('Forensic package broadcasted.');
      setEvidenceForm({ description: '', files: [] }); setEvidenceModalOpen(false); loadData();
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setSubmittingEvidence(false); }
  };

  const handleStatusAction = async (action) => {
    try {
      setPauseLoading(true);
      await (action === 'pause' ? assignmentApi.pause(assignmentId) : assignmentApi.resume(assignmentId));
      toast.success(`Protocol ${action === 'pause' ? 'paused' : 'resumed'}.`);
      setAssignment((await assignmentApi.byId(assignmentId)).data);
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setPauseLoading(false); }
  };

  if (loading) return <LoadingSpinner text="Decrypting Mission Data..." />;
  if (!assignment) return <EmptyState title="Target Lost" description="Mission profile inaccessible." />;

  const sectionLabel = "text-[10px] font-black text-emerald-500/60 uppercase tracking-[0.2em] mb-4 block";

  return (
    <div className="finder-page-enter space-y-8 pb-12">
      <PageHeader
        title="Mission Workbench"
        subtitle={getFinderLifecycleMessage(lifecycleState)}
        actions={(
          <div className="flex items-center gap-3">
            <StatusBadge value={lifecycleState} />
            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${finderDeadlineMissed ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
               <FiClock size={12} /> {formatDuration(remainingMs)}
            </div>
          </div>
        )}
      />

      <div className="grid lg:grid-cols-12 gap-8 relative items-start">
        
        {/* Left Column: Tactical Timeline (STICKY) */}
        <div className="lg:col-span-4 sticky lg:top-24 space-y-8 order-2 lg:order-1">
           <div className="finder-section-card !p-0 overflow-hidden border-emerald-500/10 shadow-[0_0_50px_rgba(16,185,129,0.05)]">
              <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                <span className={sectionLabel}>Missions Timeline</span>
                <h3 className="text-xl font-black text-white">Extraction Logs</h3>
              </div>
              <div className="p-8 max-h-[60vh] overflow-y-auto pnf-sidebar-scroll">
                {timeline.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Static feedback. No events recorded.</p>
                ) : (
                  <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-white/10">
                     {timeline.map((entry, i) => (
                       <div key={entry._id} className="relative pl-10 group">
                          <div className={`absolute left-0 top-1 w-6 h-6 rounded-lg border flex items-center justify-center z-10 transition-all ${i === 0 ? 'bg-emerald-500 border-emerald-500 text-slate-950 scale-110 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-slate-900 border-white/10 text-slate-500 group-hover:border-emerald-500/50'}`}>
                             {entry.action === 'assigned' ? <FiTarget size={12} /> : entry.action === 'evidence_submitted' ? <FiCloud size={12} /> : <FiActivity size={12} />}
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-emerald-500/50 uppercase tracking-widest mb-1">{formatDate(entry.createdAt)}</p>
                             <p className="text-sm font-bold text-slate-200">{String(entry.action || 'Event').replace('_', ' ').toUpperCase()}</p>
                             {entry.details?.remarks && <p className="text-[11px] text-slate-500 mt-1 italic leading-relaxed">"{entry.details.remarks}"</p>}
                             {entry.details?.locationName && <div className="flex items-center gap-1.5 text-[9px] text-emerald-500 font-bold mt-2"><FiNavigation size={10} /> {entry.details.locationName}</div>}
                          </div>
                       </div>
                     ))}
                  </div>
                )}
              </div>
              <div className="p-4 bg-emerald-500/5 border-t border-white/5 text-center">
                 <span className="text-[9px] font-black text-emerald-500/40 uppercase tracking-widest italic">Encrypted Log Stream Active</span>
              </div>
           </div>

           {/* Financial Synchronization */}
           {lifecycleState === 'completed' && payout && (
             <div className="finder-section-card bg-emerald-500/10 !border-emerald-500/20">
                <span className={sectionLabel}>Rewards System</span>
                <h3 className="text-xl font-black text-white mb-6 underline decoration-emerald-500/30">Payout Synchronized</h3>
                <div className="space-y-4">
                   <div className="flex justify-between items-center bg-slate-950/40 p-4 rounded-xl border border-white/5">
                      <span className="text-[11px] font-black text-slate-500 uppercase">Disbursed Amount</span>
                      <span className="text-xl font-black text-emerald-500">{formatCurrency(payout.payoutAmount)}</span>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-white/5 rounded-xl text-center">
                         <span className="text-[9px] font-black text-slate-600 uppercase block mb-1">Status</span>
                         <StatusBadge value={payout.payoutStatus} />
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl text-center">
                         <span className="text-[9px] font-black text-slate-600 uppercase block mb-1">Timestamp</span>
                         <span className="text-[10px] text-white font-bold">{formatDate(payout.processedAt || payout.createdAt)}</span>
                      </div>
                   </div>
                </div>
             </div>
           )}
        </div>

        {/* Right Column: Mission Intel & Evidence */}
        <div className="lg:col-span-8 space-y-8 order-1 lg:order-2">
           
           {/* Tactical Information Card */}
           <div className="finder-section-card f-hologram-effect !bg-slate-900/40">
              <span className={sectionLabel}>Mission Intelligence</span>
              <div className="flex justify-between items-start mb-8">
                 <div>
                    <h2 className="text-3xl font-black text-white mb-2">{assignment?.request?.itemName}</h2>
                    <div className="flex items-center gap-3 text-emerald-500/70 text-xs font-bold">
                       <FiMapPin size={14} /> {assignment?.request?.lastSeenLocation}
                    </div>
                 </div>
                 <div className="text-right">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Target Value</span>
                    <div className="text-2xl font-black text-emerald-500">
                       {formatCurrency(payout?.payoutAmount || assignment?.request?.rewardAmount)}
                    </div>
                 </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-950/50 border border-white/5 space-y-4">
                 <p className="text-sm text-slate-400 leading-relaxed italic border-l-2 border-emerald-500/30 pl-4">
                   "{assignment?.request?.itemDescription || 'Mission description restricted.'}"
                 </p>
                 
                 {/* Reward Breakdown Section */}
                 <div className="mt-6 pt-6 border-t border-white/5">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">Financial Protocol Breakdown</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                          <span className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Total Extraction Target</span>
                          <p className="text-lg font-black text-white">
                             {formatCurrency(payout?.payoutAmount || assignment?.request?.rewardAmount)}
                          </p>
                       </div>
                       <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                          <div className="flex justify-between items-start mb-1">
                             <span className="text-[9px] font-black text-emerald-500 uppercase">Guaranteed Search Fee</span>
                             <FiShield className="text-emerald-500/50" size={10} />
                          </div>
                          <p className="text-lg font-black text-emerald-500">
                             {formatCurrency(
                                (assignment?.request?.rewardAmount * (assignment?.request?.planId?.finderPercent || 15)) / 100
                              )}
                          </p>
                          <span className="text-[8px] text-emerald-500/40 font-bold uppercase">Locked regardless of outcome</span>
                       </div>
                       <div className="p-4 rounded-xl bg-sky-500/5 border border-sky-500/10">
                          <div className="flex justify-between items-start mb-1">
                             <span className="text-[9px] font-black text-sky-500 uppercase">Success Capture Bonus</span>
                             <FiZap className="text-sky-500/50" size={10} />
                          </div>
                          <p className="text-lg font-black text-sky-500">
                             {formatCurrency(
                                (assignment?.request?.rewardAmount * (assignment?.request?.planId?.refundPercent || 70)) / 100
                              )}
                          </p>
                          <span className="text-[8px] text-sky-500/40 font-bold uppercase">Released upon verification</span>
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-white/5">
                    <div>
                       <span className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Detection Date</span>
                       <p className="text-xs text-white font-black">{formatDate(assignment?.request?.createdAt)}</p>
                    </div>
                    <div>
                       <span className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Mission Category</span>
                       <p className="text-xs text-white font-black">{assignment?.request?.itemCategory || 'General Recovery'}</p>
                    </div>
                    <div className="lg:col-span-2 text-right">
                       <span className="text-[9px] font-bold text-rose-500 uppercase block mb-1">Synchronization Window</span>
                       <p className="text-xs text-rose-400 font-black">{formatDate(finderDeadlineValue)}</p>
                    </div>
                 </div>
              </div>

              {/* Status Specific Alerts */}
              <div className="mt-6 flex flex-col gap-3">
                 {finderDeadlineMissed && (
                   <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold flex items-center gap-3">
                      <FiZap size={16} /> SIGNAL LOST: Tactical deadline exceeded. Protocol offline.
                   </div>
                 )}
                 {String(assignment?.status).toLowerCase() === 'paused' && (
                   <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold flex items-center gap-3">
                      <FiActivity size={16} /> PROTOCOL STALLED: Tactical break active.
                   </div>
                 )}
              </div>

              {/* Action Toolbar */}
              <div className="mt-8 pt-8 border-t border-white/5 flex flex-wrap gap-4 items-center">
                 {!finderDeadlineMissed && !['completed', 'cancelled', 'expired', 'failed'].includes(lifecycleState) && (
                   <>
                     {String(assignment?.status).toLowerCase() === 'paused' ? (
                       <button onClick={() => handleStatusAction('resume')} disabled={pauseLoading} className="px-8 py-3 bg-emerald-500 text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all">
                          <FiZap size={14} /> Resume Protocol
                       </button>
                     ) : (
                       <button onClick={() => handleStatusAction('pause')} disabled={pauseLoading} className="px-6 py-3 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all text-[10px] font-black uppercase tracking-widest">
                          Protocol Break
                       </button>
                     )}
                     <button onClick={() => setTrackingModalOpen(true)} className="px-6 py-3 bg-emerald-500/5 text-emerald-500 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/10 transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <FiNavigation size={14} /> Broadcast Observation
                     </button>
                   </>
                 )}
                 {chatEnabled && (
                   <Link to={`/chat/${assignmentId}`} className="px-6 py-3 rounded-xl bg-sky-500 text-slate-950 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 ml-auto hover:bg-sky-400 transition-all">
                      <FiActivity size={14} /> Intelligence Uplink
                   </Link>
                 )}
              </div>
           </div>

           {/* Evidence Section */}
           <div className="finder-section-card !bg-slate-900/40">
              <div className="flex justify-between items-center mb-10">
                 <div>
                    <span className={sectionLabel}>Forensic Documentation</span>
                    <h3 className="text-2xl font-black text-white">Evidence Stream</h3>
                 </div>
                 {canUploadEvidence && (
                   <button onClick={() => setEvidenceModalOpen(true)} className="px-6 py-3 bg-emerald-500 text-slate-950 rounded-xl hover:scale-105 transition-all shadow-[0_10px_30px_rgba(16,185,129,0.2)] flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
                      <FiPlus size={16} /> Submit Forensic Package
                   </button>
                 )}
              </div>

              {(!evidence && !canUploadEvidence) && (
                <EmptyState title="Operational Void" description="Target forensics not yet acquired or mission status offline." />
              )}

              {evidence && (
                <div className="space-y-8">
                   <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 border-l-4 border-l-emerald-500">
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block mb-3">Transmission Remarks</span>
                      <p className="text-sm text-slate-300 italic leading-relaxed">"{evidence.description}"</p>
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between gap-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.1em]">
                       <div className="flex items-center gap-6">
                          <span className="flex items-center gap-2"><FiCloud size={14} className="text-emerald-500/50" /> Uplinked: {formatDate(evidence.createdAt)}</span>
                          <span className="flex items-center gap-2"><FiShield size={14} className="text-emerald-500/50" /> Protocol Status: <span className={evidenceStatus === 'verified' ? 'text-emerald-400' : 'text-amber-400'}>{evidenceStatus.toUpperCase()}</span></span>
                       </div>
                    </div>
                   </div>

                   <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      {Array.isArray(evidence?.files) && evidence.files.map((file, i) => (
                        <div key={i} className="aspect-video rounded-2xl bg-slate-950 border border-white/5 overflow-hidden group relative shadow-2xl">
                           {String(file?.fileType).toLowerCase() === 'video' ? (
                             <video src={getEvidenceFileUrl(file)} className="w-full h-full object-cover" controls />
                           ) : (
                             <img src={getEvidenceFileUrl(file)} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500" />
                           )}
                           <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <a href={getEvidenceFileUrl(file)} target="_blank" rel="noreferrer" className="p-4 bg-emerald-500 text-slate-950 rounded-full hover:scale-110 transition-all">
                                 <FiSearch size={20} />
                              </a>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              )}
           </div>

        </div>
      </div>

      {/* Modals: Tracking & Evidence */}
      <GlassModal 
        open={trackingModalOpen} 
        title="Mission Observation" 
        subtitle="Log operational progress and tactical data."
        confirmText={postingUpdate ? 'Syncing...' : 'Broadcast Log'}
        onClose={() => !postingUpdate && setTrackingModalOpen(false)}
        onConfirm={() => document.getElementById('tracking-form').requestSubmit()}
        loading={postingUpdate}
      >
        <form id="tracking-form" onSubmit={submitTrackingUpdate} className="space-y-6">
           <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Operational Remarks</label>
              <textarea className="pnf-input" rows={3} placeholder="Live status update..." value={trackingForm.message} onChange={e => setTrackingForm(f => ({...f, message: e.target.value}))} disabled={postingUpdate} required />
           </div>
           <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Location Mode</label>
                <select className="pnf-input" value={trackingForm.locationSource} onChange={e => setTrackingForm(f => ({...f, locationSource: e.target.value}))} disabled={postingUpdate}>
                  <option value={LOCATION_MODES.CURRENT}>Tactical GPS Auto</option>
                  <option value={LOCATION_MODES.MANUAL}>Manual Coordinates</option>
                  <option value={LOCATION_MODES.SKIP}>Dark Protocol (Skip)</option>
                </select>
              </div>
              <div className="flex flex-col justify-end">
                <button 
                  type="button"
                  onClick={() => { setTrackingModalOpen(false); setEvidenceModalOpen(true); }}
                  className="pnf-input !bg-emerald-500/10 !border-emerald-500/20 text-emerald-500 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-500/20"
                >
                  <FiPlus size={14} /> Attach Forensic Package
                </button>
              </div>
           </div>
           {trackingForm.locationSource === LOCATION_MODES.MANUAL && (
              <div className="animate-in fade-in zoom-in-95 duration-200">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Manual Entry</label>
                <input className="pnf-input" type="text" placeholder="Location name..." value={trackingForm.locationName} onChange={e => setTrackingForm(f => ({...f, locationName: e.target.value}))} disabled={postingUpdate} required />
              </div>
           )}
        </form>
      </GlassModal>

      <GlassModal 
        open={evidenceModalOpen} 
        title="Forensic Data Uplink" 
        subtitle="Upload visual proof to synchronize reward protocols."
        confirmText={submittingEvidence ? 'Broadcasting...' : 'Secure Transmission'}
        onClose={() => !submittingEvidence && setEvidenceModalOpen(false)}
        onConfirm={() => document.getElementById('evidence-form').requestSubmit()}
        loading={submittingEvidence}
      >
         <form id="evidence-form" onSubmit={submitEvidence} className="space-y-6">
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Forensic Narrative</label>
               <textarea className="pnf-input !bg-slate-950/50" rows={3} placeholder="Describe the extraction environment and specific item condition..." value={evidenceForm.description} onChange={e => setEvidenceForm(f => ({...f, description: e.target.value}))} disabled={submittingEvidence} required />
            </div>
            
            <div className="space-y-4">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Uplink Vectors</label>
               <div className="p-8 border-2 border-dashed border-white/10 rounded-2xl text-center bg-white/5 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all cursor-pointer relative group">
                  <FiCloud size={32} className="mx-auto text-emerald-500/50 mb-2 group-hover:scale-110 transition-all" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tap to Synchronize Media</p>
                  <p className="text-[9px] text-slate-600 mt-1 uppercase font-bold">Images (Max 5) or Video (Max 2m)</p>
                  <input 
                    type="file" multiple accept="image/*,video/*" className="opacity-0 absolute inset-0 cursor-pointer z-10" 
                    onChange={async e => { await addEvidenceFiles(e.target.files); e.target.value = ''; }} disabled={submittingEvidence} 
                  />
               </div>

               {selectedEvidencePreviews.length > 0 && (
                 <div className="grid grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-950/50 border border-white/5">
                    {selectedEvidencePreviews.map(file => (
                      <div key={file.key} className="aspect-square rounded-xl bg-slate-900 border border-white/10 relative overflow-hidden group/item">
                         {file.type.startsWith('video/') ? (
                           <div className="w-full h-full flex items-center justify-center bg-emerald-500/10">
                              <FiVideo size={20} className="text-emerald-500" />
                           </div>
                         ) : (
                           <img src={file.url} className="w-full h-full object-cover" alt="Preview" />
                         )}
                         <div className="absolute inset-0 bg-rose-500/40 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center">
                            <button type="button" onClick={() => removeEvidenceFile(file.key)} className="p-2 bg-rose-600 text-white rounded-lg shadow-xl hover:scale-110 transition-all">
                               <FiTrash2 size={14} />
                            </button>
                         </div>
                      </div>
                    ))}
                 </div>
               )}
            </div>
         </form>
      </GlassModal>
    </div>
  );
};

export default FinderAssignmentDetailsPage;
