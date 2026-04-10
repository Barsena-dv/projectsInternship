import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    FiActivity,
    FiClock, FiCloud,
    FiMapPin, FiNavigation, FiPlus,
    FiSearch,
    FiShield, FiTarget, FiTrash2, FiVideo, FiZap
} from 'react-icons/fi';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import EmptyState from '../../components/common/EmptyState';
import GlassModal from '../../components/common/GlassModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { assignmentApi, evidenceApi, trackingApi } from '../../services/api';
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
   const [evidenceForm, setEvidenceForm] = useState({
      description: '',
      files: [],
      uniqueIdentifyingMarks: '',
      exactPickupLocation: '',
      privateNotes: '',
      foundAt: '',
      foundLocationText: '',
   });
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
      if (res.success) {
        setAssignment(res.data?.assignment || res.data);
        setPayout(res.data?.payout);
      }
      const [timelineRes, evidenceRes] = await Promise.all([
        assignmentApi.timeline(assignmentId).catch(() => ({ data: [] })),
        evidenceApi.byAssignment(assignmentId).catch(() => ({ data: null }))
      ]);
      setTimeline(timelineRes.data || []);
      setEvidence(evidenceRes.data || null);
    } catch (error) { toast.error(getErrorMessage(error)); } finally { setLoading(false); }
  }, [assignmentId]);

  useEffect(() => { loadData(); }, [loadData]);

  const lifecycleState = useMemo(() => deriveFinderLifecycleState({ assignment, evidence, deadline: assignment?.deadlineAt }), [assignment, evidence]);
  const finderDeadlineValue = assignment?.deadlineAt;
  const finderDeadlineMissed = isDeadlineMissed(finderDeadlineValue);
  const canAddTracking = !['completed', 'cancelled', 'expired', 'failed'].includes(lifecycleState);
   const trackingMissedCount = Number(assignment?.trackingMissedCount || 0);
   const trackingWarningCount = Number(assignment?.trackingWarningCount || 0);
  const evidenceStatus = String(evidence?.verificationStatus || '').toLowerCase();
  const canUploadEvidence = canAddTracking && !finderDeadlineMissed && (!evidence || evidenceStatus === 'rejected');
  const chatEnabled = (lifecycleState === 'verified' || Boolean(assignment?.chatUnlocked) || lifecycleState === 'completed') && !['expired', 'failed'].includes(lifecycleState);

  useEffect(() => {
    if (!finderDeadlineValue) { setRemainingMs(0); return; }
    const tick = () => setRemainingMs(Math.max(new Date(finderDeadlineValue).getTime() - Date.now(), 0));
    tick(); const timer = setInterval(tick, 1000); return () => clearInterval(timer);
  }, [finderDeadlineValue]);

   useEffect(() => {
      if (!autoTrackingEnabled || !canAddTracking || finderDeadlineMissed) return undefined;

      const timer = setInterval(() => {
         toast.info('Tracking reminder: post GPS/manual update to keep assignment active.');
      }, AUTO_TRACKING_INTERVAL_MS);

      return () => clearInterval(timer);
   }, [autoTrackingEnabled, canAddTracking, finderDeadlineMissed]);

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
      if (!evidenceForm.uniqueIdentifyingMarks.trim()) return toast.error('Unique identifying marks are required for claim verification.');
    const validation = await validateEvidenceFiles(evidenceForm.files);
    if (!validation.valid) return toast.error(validation.message);
    try {
      setSubmittingEvidence(true);
      const fd = new FormData(); fd.append('description', evidenceForm.description);
         fd.append('uniqueIdentifyingMarks', evidenceForm.uniqueIdentifyingMarks);
         fd.append('exactPickupLocation', evidenceForm.exactPickupLocation);
         fd.append('privateNotes', evidenceForm.privateNotes);
         fd.append('foundAt', evidenceForm.foundAt);
         fd.append('foundLocationText', evidenceForm.foundLocationText);
      Array.from(evidenceForm.files).forEach(f => fd.append('files', f));
      await evidenceApi.upload(assignmentId, fd); toast.success('Forensic package broadcasted.');
         setEvidenceForm({
            description: '',
            files: [],
            uniqueIdentifyingMarks: '',
            exactPickupLocation: '',
            privateNotes: '',
            foundAt: '',
            foundLocationText: '',
         });
         setEvidenceModalOpen(false);
         loadData();
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
    <div className="finder-page-enter space-y-8 pb-12 overflow-x-hidden">
      <PageHeader
        title="Mission Workbench"
        subtitle={getFinderLifecycleMessage(lifecycleState)}
        actions={(
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <StatusBadge value={lifecycleState} />
            <div className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 sm:gap-2 ${finderDeadlineMissed ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
               <FiClock size={12} /> {formatDuration(remainingMs)}
            </div>
          </div>
        )}
      />

      <div className="grid lg:grid-cols-12 gap-8 relative items-start">
        
        {/* Left Column: Tactical Timeline (STACKS BELOW INTEL ON MOBILE) */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6 sm:space-y-8 order-2 lg:order-1">
           <div className="finder-section-card p-0! overflow-hidden border-emerald-500/10 shadow-[0_0_50px_rgba(16,185,129,0.05)]">
              <div className="p-6 sm:p-8 border-b border-white/5 bg-white/2">
                <span className={sectionLabel}>Missions Timeline</span>
                <h3 className="text-lg sm:text-xl font-black text-white">Extraction Logs</h3>
              </div>
              <div className="p-6 sm:p-8 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto pnf-sidebar-scroll">
                {timeline.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Static feedback. No events recorded.</p>
                ) : (
                  <div className="space-y-8 relative before:absolute before:left-2.75 before:top-2 before:bottom-2 before:w-px before:bg-white/10">
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
                 <span className="text-[9px] font-black text-emerald-500/40 uppercase tracking-widest italic font-mono">Encrypted Stream Active</span>
              </div>
           </div>

           {/* Financial Synchronization */}
           {lifecycleState === 'completed' && payout && (
             <div className="finder-section-card bg-emerald-500/10 border-emerald-500/20!">
                <span className={sectionLabel}>Rewards System</span>
                <h3 className="text-lg sm:text-xl font-black text-white mb-6 underline decoration-emerald-500/30">Payout Synchronized</h3>
                <div className="space-y-4">
                   <div className="flex justify-between items-center bg-slate-950/40 p-4 rounded-xl border border-white/5">
                      <span className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase">Disbursed</span>
                      <span className="text-lg sm:text-xl font-black text-emerald-500">{formatCurrency(payout.payoutAmount)}</span>
                   </div>
                   <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="p-3 bg-white/5 rounded-xl text-center">
                         <span className="text-[8px] font-black text-slate-600 uppercase block mb-1">Status</span>
                         <StatusBadge value={payout.payoutStatus} />
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl text-center">
                         <span className="text-[8px] font-black text-slate-600 uppercase block mb-1">Timestamp</span>
                         <span className="text-[9px] sm:text-[10px] text-white font-bold">{formatDate(payout.processedAt || payout.createdAt)}</span>
                      </div>
                   </div>
                </div>
             </div>
           )}
        </div>

        {/* Right Column: Mission Intel & Evidence */}
        <div className="lg:col-span-8 space-y-8 order-1 lg:order-2">
           
           {/* Tactical Information Card */}
           <div className="finder-section-card f-hologram-effect bg-slate-900/40! overflow-hidden">
              <span className={sectionLabel}>Mission Intelligence</span>
              <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-8">
                 <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 leading-tight">{assignment?.request?.itemName}</h2>
                    <div className="flex items-center gap-3 text-emerald-500/70 text-[10px] sm:text-xs font-bold">
                       <FiMapPin size={14} className="shrink-0" /> {assignment?.request?.lastSeenLocation}
                    </div>
                 </div>
                 <div className="sm:text-right bg-emerald-500/5 sm:bg-transparent p-4 sm:p-0 rounded-2xl border border-emerald-500/10 sm:border-0 w-full sm:w-auto">
                    <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Target Value</span>
                    <div className="text-xl sm:text-2xl font-black text-emerald-500">
                       {formatCurrency(payout?.payoutAmount || assignment?.request?.rewardAmount)}
                    </div>
                 </div>
              </div>

              <div className="p-4 sm:p-6 rounded-2xl bg-slate-950/50 border border-white/5 space-y-6">
                 <p className="text-xs sm:text-sm text-slate-400 leading-relaxed italic border-l-2 border-emerald-500/30 pl-4">
                   "{assignment?.request?.itemDescription || 'Mission description restricted.'}"
                 </p>
                 
                 {/* Reward Breakdown Section */}
                 <div className="mt-6 pt-6 border-t border-white/5">
                    <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">Financial Protocol Breakdown</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                       <div className="p-4 rounded-xl bg-white/2 border border-white/5">
                          <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1">Total Target</span>
                          <p className="text-base sm:text-lg font-black text-white">
                             {formatCurrency(payout?.payoutAmount || assignment?.request?.rewardAmount)}
                          </p>
                       </div>
                       <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                          <div className="flex justify-between items-start mb-1">
                             <span className="text-[8px] font-black text-emerald-500 uppercase">Search Fee</span>
                             <FiShield className="text-emerald-500/50" size={10} />
                          </div>
                          <p className="text-base sm:text-lg font-black text-emerald-500">
                             {formatCurrency(
                                (assignment?.request?.rewardAmount * (assignment?.request?.planId?.finderPercent || 15)) / 100
                              )}
                          </p>
                       </div>
                       <div className="p-4 rounded-xl bg-sky-500/5 border border-sky-500/10">
                          <div className="flex justify-between items-start mb-1">
                             <span className="text-[8px] font-black text-sky-500 uppercase">Success Bonus</span>
                             <FiZap className="text-sky-500/50" size={10} />
                          </div>
                          <p className="text-base sm:text-lg font-black text-sky-500">
                             {formatCurrency(
                                (assignment?.request?.rewardAmount * (assignment?.request?.planId?.refundPercent || 70)) / 100
                              )}
                          </p>
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-6 border-t border-white/5">
                    <div>
                       <span className="text-[8px] sm:text-[9px] font-bold text-slate-600 uppercase block mb-1">Detection</span>
                       <p className="text-[10px] sm:text-xs text-white font-black">{formatDate(assignment?.request?.createdAt)}</p>
                    </div>
                    <div>
                       <span className="text-[8px] sm:text-[9px] font-bold text-slate-600 uppercase block mb-1">Category</span>
                       <p className="text-[10px] sm:text-xs text-white font-black truncate">{assignment?.request?.itemCategory || 'General'}</p>
                    </div>
                    <div className="lg:col-span-2 text-right">
                       <span className="text-[8px] sm:text-[9px] font-bold text-rose-500 uppercase block mb-1">Sync Window</span>
                       <p className="text-[10px] sm:text-xs text-rose-400 font-black">{formatDate(finderDeadlineValue)}</p>
                    </div>
                 </div>
              </div>

              {/* Status Specific Alerts */}
              <div className="mt-6 flex flex-col gap-3">
                         {!finderDeadlineMissed && canAddTracking && (
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-[10px] sm:text-xs font-bold flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                 <span className="text-slate-300">
                                    Tracking SLA: Missed windows <span className="text-amber-400">{trackingMissedCount}</span>, warnings <span className="text-emerald-400">{trackingWarningCount}</span>.
                                 </span>
                                 <span className="text-slate-500">Post update every ~15 minutes to avoid auto-fail.</span>
                            </div>
                         )}
                 {finderDeadlineMissed && (
                   <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] sm:text-xs font-bold flex items-center gap-3 animate-pulse">
                      <FiZap size={16} className="shrink-0" /> SIGNAL LOST: Tactical deadline exceeded.
                   </div>
                 )}
                 {String(assignment?.status).toLowerCase() === 'paused' && (
                   <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] sm:text-xs font-bold flex items-center gap-3">
                      <FiActivity size={16} className="shrink-0" /> PROTOCOL STALLED: Tactical break active.
                   </div>
                 )}
              </div>

              {/* Action Toolbar */}
              <div className="mt-8 pt-8 border-t border-white/5 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                 {!finderDeadlineMissed && !['completed', 'cancelled', 'expired', 'failed'].includes(lifecycleState) && (
                   <div className="flex flex-col sm:flex-row gap-4 w-full">
                      {String(assignment?.status).toLowerCase() === 'paused' ? (
                        <button onClick={() => handleStatusAction('resume')} disabled={pauseLoading} className="px-8 py-3 bg-emerald-500 text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-105 transition-all">
                           <FiZap size={14} /> Resume Protocol
                        </button>
                      ) : (
                        <button onClick={() => handleStatusAction('pause')} disabled={pauseLoading} className="px-6 py-3 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all text-[10px] font-black uppercase tracking-widest text-center">
                           Protocol Break
                        </button>
                      )}
                      <button onClick={() => setTrackingModalOpen(true)} className="px-6 py-3 bg-emerald-500/5 text-emerald-500 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/10 transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                         <FiNavigation size={14} /> Broadcast Observation
                      </button>
                                 <button
                                    onClick={() => setAutoTrackingEnabled((prev) => !prev)}
                                    className={`px-6 py-3 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest ${autoTrackingEnabled ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'text-slate-400 border-white/10 hover:text-white hover:bg-white/5'}`}
                                 >
                                    {autoTrackingEnabled ? 'Auto Reminder: On' : 'Auto Reminder: Off'}
                                 </button>
                   </div>
                 )}
                 {chatEnabled && (
                    <Link to={`/chat/${assignmentId}`} className={`px-6 py-3 rounded-xl bg-sky-500 text-slate-950 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:bg-sky-400 ${!finderDeadlineMissed && !['completed', 'cancelled', 'expired', 'failed'].includes(lifecycleState) ? 'sm:ml-auto' : 'w-full'}`}>
                       <FiActivity size={14} /> Intelligence Uplink
                    </Link>
                 )}
              </div>
           </div>

           {/* Evidence Section */}
           <div className="finder-section-card bg-slate-900/40! overflow-hidden">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
                 <div>
                    <span className={sectionLabel}>Forensic Documentation</span>
                    <h3 className="text-xl sm:text-2xl font-black text-white">Evidence Stream</h3>
                 </div>
                 {canUploadEvidence && (
                   <button onClick={() => setEvidenceModalOpen(true)} className="w-full sm:w-auto px-6 py-3 bg-emerald-500 text-slate-950 rounded-xl hover:scale-105 transition-all shadow-[0_10px_30px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest">
                      <FiPlus size={16} /> Submit Forensic Package
                   </button>
                 )}
              </div>

              {(!evidence && !canUploadEvidence) && (
                <EmptyState title="Operational Void" description="Target forensics not yet acquired or mission offline." />
              )}

              {evidence && (
                <div className="space-y-8">
                   <div className="p-4 sm:p-6 rounded-2xl bg-white/3 border border-white/5 border-l-4 border-l-emerald-500">
                      <span className="text-[9px] sm:text-[10px] font-black text-emerald-500 uppercase tracking-widest block mb-3">Transmission Remarks</span>
                      <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed">"{evidence.description}"</p>
                    <div className="mt-4 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest">
                       <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                          <span className="flex items-center gap-2"><FiCloud size={14} className="text-emerald-500/50" /> {formatDate(evidence.createdAt)}</span>
                          <span className="flex items-center gap-2"><FiShield size={14} className="text-emerald-500/50" /> <span className={evidenceStatus === 'verified' ? 'text-emerald-400' : 'text-amber-400'}>{evidenceStatus.toUpperCase()}</span></span>
                       </div>
                    </div>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
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
                  className="pnf-input bg-emerald-500/10! border-emerald-500/20! text-emerald-500 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-500/20"
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
               <textarea className="pnf-input bg-slate-950/50!" rows={3} placeholder="Describe the extraction environment and specific item condition..." value={evidenceForm.description} onChange={e => setEvidenceForm(f => ({...f, description: e.target.value}))} disabled={submittingEvidence} required />
            </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Unique Identifying Marks (Hidden)</label>
                        <input
                           className="pnf-input bg-slate-950/50!"
                           placeholder="Scratch pattern, sticker, engraving"
                           value={evidenceForm.uniqueIdentifyingMarks}
                           onChange={(e) => setEvidenceForm((f) => ({ ...f, uniqueIdentifyingMarks: e.target.value }))}
                           disabled={submittingEvidence}
                           required
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Exact Pickup Location (Hidden)</label>
                        <input
                           className="pnf-input bg-slate-950/50!"
                           placeholder="Exact shelf/spot/desk location"
                           value={evidenceForm.exactPickupLocation}
                           onChange={(e) => setEvidenceForm((f) => ({ ...f, exactPickupLocation: e.target.value }))}
                           disabled={submittingEvidence}
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Found Date/Time</label>
                        <input
                           type="datetime-local"
                           className="pnf-input bg-slate-950/50!"
                           value={evidenceForm.foundAt}
                           onChange={(e) => setEvidenceForm((f) => ({ ...f, foundAt: e.target.value }))}
                           disabled={submittingEvidence}
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Found Location (Public)</label>
                        <input
                           className="pnf-input bg-slate-950/50!"
                           placeholder="Mall parking level 2, gate B"
                           value={evidenceForm.foundLocationText}
                           onChange={(e) => setEvidenceForm((f) => ({ ...f, foundLocationText: e.target.value }))}
                           disabled={submittingEvidence}
                        />
                     </div>
                     <div className="sm:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Private Notes (Hidden)</label>
                        <textarea
                           className="pnf-input bg-slate-950/50!"
                           rows={2}
                           placeholder="Extra hidden details for owner-claim verification"
                           value={evidenceForm.privateNotes}
                           onChange={(e) => setEvidenceForm((f) => ({ ...f, privateNotes: e.target.value }))}
                           disabled={submittingEvidence}
                        />
                     </div>
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
