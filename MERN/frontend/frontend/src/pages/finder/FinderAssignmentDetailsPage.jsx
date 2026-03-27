import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import EmptyState from '../../components/common/EmptyState';
import GlassModal from '../../components/common/GlassModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { assignmentApi, evidenceApi, payoutApi, trackingApi } from '../../services/api';
import { deriveFinderLifecycleState, getFinderLifecycleMessage, isDeadlineMissed } from '../../utils/finderLifecycle';
import { formatDate, getErrorMessage } from '../../utils/helpers';

const TWO_MINUTES_SECONDS = 120;
const AUTO_TRACKING_INTERVAL_MS = 15 * 60 * 1000;

const LOCATION_MODES = {
  CURRENT: 'current',
  MANUAL: 'manual_text',
  SKIP: 'skipped',
};

const formatDuration = (remainingMs) => {
  if (remainingMs <= 0) return 'Deadline passed';

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
      reject(new Error('Could not read video metadata'));
    };

    video.src = url;
  });

const validateEvidenceFiles = async (fileList) => {
  const files = Array.from(fileList || []);
  if (files.length === 0) return { valid: false, message: 'Upload at least one file.' };

  const imageFiles = files.filter((file) => String(file.type || '').startsWith('image/'));
  const videoFiles = files.filter((file) => String(file.type || '').startsWith('video/'));
  const unknownFiles = files.length - imageFiles.length - videoFiles.length;

  if (unknownFiles > 0) {
    return { valid: false, message: 'Only image and video files are allowed.' };
  }

  if (videoFiles.length > 1) {
    return { valid: false, message: 'Upload only one video.' };
  }

  if (videoFiles.length === 1 && imageFiles.length > 0) {
    return { valid: false, message: 'Upload either images or one video, not both.' };
  }

  if (imageFiles.length > 5) {
    return { valid: false, message: 'Maximum 5 images are allowed.' };
  }

  if (videoFiles.length === 1) {
    const seconds = await readVideoDurationSeconds(videoFiles[0]);
    if (seconds > TWO_MINUTES_SECONDS) {
      return { valid: false, message: 'Video must be 2 minutes or shorter.' };
    }
  }

  return { valid: true, message: '' };
};

const getEvidenceFileUrl = (file) => file?.url || file?.secure_url || file?.fileUrl || file?.path || '';

const mergeEvidenceFiles = (existingFiles, incomingFiles) => {
  const merged = [...existingFiles];
  const seen = new Set(existingFiles.map((file) => `${file.name}-${file.size}-${file.lastModified}`));

  incomingFiles.forEach((file) => {
    const key = `${file.name}-${file.size}-${file.lastModified}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(file);
    }
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

  const [trackingForm, setTrackingForm] = useState({
    message: '',
    locationSource: LOCATION_MODES.CURRENT,
    locationName: '',
  });
  const [postingUpdate, setPostingUpdate] = useState(false);

  const [evidenceForm, setEvidenceForm] = useState({
    description: '',
    files: [],
  });
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [evidenceValidationError, setEvidenceValidationError] = useState('');
  const [submittingEvidence, setSubmittingEvidence] = useState(false);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [autoTrackingEnabled, setAutoTrackingEnabled] = useState(false);
  const [remainingMs, setRemainingMs] = useState(0);
  const [pauseLoading, setPauseLoading] = useState(false);

  const selectedEvidencePreviews = useMemo(
    () => (evidenceForm.files || []).map((file) => ({
      key: `${file.name}-${file.size}-${file.lastModified}`,
      type: String(file.type || ''),
      url: URL.createObjectURL(file),
      name: file.name,
    })),
    [evidenceForm.files]
  );

  useEffect(() => () => {
    selectedEvidencePreviews.forEach((item) => URL.revokeObjectURL(item.url));
  }, [selectedEvidencePreviews]);

  const uploadedEvidenceFiles = useMemo(() => {
    if (!Array.isArray(evidence?.files)) return [];
    return evidence.files
      .map((file, index) => ({
        key: file?.cloudinaryId || `${getEvidenceFileUrl(file)}-${index}`,
        type: String(file?.fileType || ''),
        url: getEvidenceFileUrl(file),
        name: file?.originalName || file?.name || `Evidence ${index + 1}`,
      }))
      .filter((file) => Boolean(file.url));
  }, [evidence]);

  const loadAssignment = useCallback(async () => {
    const assignmentRes = await assignmentApi.byId(assignmentId);
    return assignmentRes?.data || null;
  }, [assignmentId]);

  const loadTimeline = useCallback(async () => {
    const timelineRes = await assignmentApi.timeline(assignmentId).catch(() => ({ data: [] }));
    return timelineRes?.data || [];
  }, [assignmentId]);

  const loadEvidence = useCallback(async () => {
    const evidenceRes = await evidenceApi.byAssignment(assignmentId).catch(() => ({ data: null }));
    return evidenceRes?.data || null;
  }, [assignmentId]);

  const loadPayout = useCallback(async (requestId) => {
    if (!requestId) return null;
    const payoutRes = await payoutApi.my().catch(() => ({ data: [] }));
    const rows = payoutRes?.data || [];

    return rows.find((row) => String(row?.assignment) === String(assignmentId)) || null;
  }, [assignmentId]);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const assignmentData = await loadAssignment();
        const [timelineData, evidenceData, payoutData] = await Promise.all([
          loadTimeline(),
          loadEvidence(),
          loadPayout(assignmentData?.request?._id),
        ]);

        setAssignment(assignmentData);
        setTimeline(timelineData);
        setEvidence(evidenceData);
        setPayout(payoutData);
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [assignmentId, loadAssignment, loadTimeline, loadEvidence, loadPayout]);

  const lifecycleState = useMemo(
    () => deriveFinderLifecycleState({
      assignment,
      evidence,
      deadline: assignment?.deadlineAt,
    }),
    [assignment, evidence]
  );

  const finderDeadlineValue = assignment?.deadlineAt;
  const ownerDeadlineValue = assignment?.request?.serviceDeadline;
  const deadlineValue = finderDeadlineValue;
  const finderDeadlineMissed = isDeadlineMissed(finderDeadlineValue);
  const ownerDeadlineMissed = isDeadlineMissed(ownerDeadlineValue);
  const deadlineMissed = finderDeadlineMissed;
  const canAddTracking = !['completed', 'cancelled', 'expired', 'failed'].includes(lifecycleState);

  const evidenceStatus = String(evidence?.verificationStatus || '').toLowerCase();
  const canUploadEvidence = canAddTracking && !deadlineMissed && (!evidence || evidenceStatus === 'rejected');
  const evidencePending = evidenceStatus === 'pending';
  const evidenceVerified = lifecycleState === 'verified' || evidenceStatus === 'verified' || Boolean(assignment?.evidenceVerified);

  const chatEnabled = (evidenceVerified || Boolean(assignment?.chatUnlocked) || lifecycleState === 'completed')
    && !['expired', 'failed'].includes(lifecycleState);
  const assignmentPaused = String(assignment?.status || '').toLowerCase() === 'paused';

  useEffect(() => {
    if (!deadlineValue) {
      setRemainingMs(0);
      return;
    }

    const tick = () => {
      const deadlineMs = new Date(deadlineValue).getTime();
      if (!Number.isFinite(deadlineMs)) {
        setRemainingMs(0);
        return;
      }
      setRemainingMs(Math.max(deadlineMs - Date.now(), 0));
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [deadlineValue]);

  useEffect(() => {
    if (!autoTrackingEnabled || !canAddTracking) return undefined;
    if (!navigator.geolocation) {
      setAutoTrackingEnabled(false);
      toast.error('Geolocation is not supported on this browser.');
      return undefined;
    }

    const timer = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await trackingApi.create({
              assignmentId,
              statusUpdate: 'location_ping',
              mode: 'auto',
              locationSource: 'current',
              remarks: 'Auto location ping',
              currentLat: position.coords.latitude,
              currentLng: position.coords.longitude,
            });
          } catch {
            // Keep auto tracking silent to avoid noisy UX.
          }
        },
        () => {
          // Ignore location read failures in background mode.
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 90 * 1000,
        }
      );
    }, AUTO_TRACKING_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [assignmentId, autoTrackingEnabled, canAddTracking]);

  const submitTrackingUpdate = async (event) => {
    event.preventDefault();

    if (!trackingForm.message.trim()) {
      toast.error('Message is required');
      return;
    }

    try {
      setPostingUpdate(true);
      const payload = {
        assignmentId,
        mode: 'prompt',
        remarks: trackingForm.message.trim(),
        locationSource: trackingForm.locationSource,
        statusUpdate: 'progress',
      };

      if (trackingForm.locationSource === LOCATION_MODES.CURRENT && navigator.geolocation) {
        const coords = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (position) => resolve(position.coords),
            () => reject(new Error('Unable to fetch current location. Use manual entry or skip.')),
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 2 * 60 * 1000 }
          );
        });

        payload.currentLat = Number(coords.latitude);
        payload.currentLng = Number(coords.longitude);
        payload.statusUpdate = 'location_ping';
      }

      if (trackingForm.locationSource === LOCATION_MODES.MANUAL) {
        if (!trackingForm.locationName.trim()) {
          toast.error('Please enter location text.');
          setPostingUpdate(false);
          return;
        }

        payload.locationName = trackingForm.locationName.trim();
        payload.statusUpdate = 'manual_note';
      }

      if (trackingForm.locationSource === LOCATION_MODES.SKIP) {
        payload.statusUpdate = 'skip';
      }

      await trackingApi.create(payload);

      toast.success('Tracking update added');
      setTrackingForm({ message: '', locationSource: LOCATION_MODES.CURRENT, locationName: '' });
      setTrackingModalOpen(false);
      const timelineData = await loadTimeline();
      setTimeline(timelineData);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setPostingUpdate(false);
    }
  };

  const submitEvidence = async (event) => {
    event.preventDefault();

    if (!evidenceForm.files.length) {
      toast.error('Upload at least one file');
      return;
    }

    if (!evidenceForm.description.trim()) {
      toast.error('Description is required');
      return;
    }

    const validation = await validateEvidenceFiles(evidenceForm.files);
    if (!validation.valid) {
      setEvidenceValidationError(validation.message);
      toast.error(validation.message);
      return;
    }

    try {
      setSubmittingEvidence(true);

      const formData = new FormData();
      formData.append('description', evidenceForm.description);
      Array.from(evidenceForm.files).forEach((file) => formData.append('files', file));

      await evidenceApi.upload(assignmentId, formData);
      toast.success('Evidence submitted');
      setEvidenceForm({ description: '', files: [] });
      setEvidenceValidationError('');
      setEvidenceModalOpen(false);

      const [assignmentData, evidenceData, timelineData] = await Promise.all([loadAssignment(), loadEvidence(), loadTimeline()]);
      setAssignment(assignmentData);
      setEvidence(evidenceData);
      setTimeline(timelineData);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmittingEvidence(false);
    }
  };

  const handlePauseAssignment = async () => {
    if (!assignmentId) return;

    try {
      setPauseLoading(true);
      await assignmentApi.pause(assignmentId);
      toast.success('Assignment paused. Resume within 15 minutes for full deadline extension.');
      const assignmentData = await loadAssignment();
      setAssignment(assignmentData);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setPauseLoading(false);
    }
  };

  const addEvidenceFiles = async (fileList) => {
    const incoming = Array.from(fileList || []);
    if (incoming.length === 0) return;

    const mergedFiles = mergeEvidenceFiles(evidenceForm.files || [], incoming);

    try {
      const validation = await validateEvidenceFiles(mergedFiles);
      if (!validation.valid) {
        setEvidenceValidationError(validation.message);
        toast.error(validation.message);
        return;
      }

      setEvidenceValidationError('');
      setEvidenceForm((prev) => ({ ...prev, files: mergedFiles }));
    } catch {
      setEvidenceValidationError('Unable to validate selected files.');
    }
  };

  const removeEvidenceFile = async (fileKey) => {
    const nextFiles = (evidenceForm.files || []).filter(
      (file) => `${file.name}-${file.size}-${file.lastModified}` !== fileKey
    );

    if (nextFiles.length === 0) {
      setEvidenceValidationError('');
      setEvidenceForm((prev) => ({ ...prev, files: [] }));
      return;
    }

    const validation = await validateEvidenceFiles(nextFiles);
    setEvidenceValidationError(validation.valid ? '' : validation.message);
    setEvidenceForm((prev) => ({ ...prev, files: nextFiles }));
  };

  const handleResumeAssignment = async () => {
    if (!assignmentId) return;

    try {
      setPauseLoading(true);
      await assignmentApi.resume(assignmentId);
      toast.success('Assignment resumed.');
      const assignmentData = await loadAssignment();
      setAssignment(assignmentData);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setPauseLoading(false);
    }
  };

  const handleOpenTrackingModal = () => {
    if (finderDeadlineMissed || lifecycleState === 'expired') {
      toast.error('Finder assignment deadline passed. You cannot add updates now.');
      return;
    }

    if (ownerDeadlineMissed || lifecycleState === 'failed') {
      toast.error('Owner service deadline passed. Assignment is failed.');
      return;
    }

    if (!canAddTracking) {
      toast.error('Tracking updates are disabled for this assignment status.');
      return;
    }

    setTrackingModalOpen(true);
  };

  if (loading) {
    return <LoadingSpinner text="Loading assignment details..." />;
  }

  if (!assignment) {
    return <EmptyState title="Assignment not found" description="Unable to fetch assignment details." />;
  }

  return (
    <div>
      <PageHeader
        title="Assignment Details"
        subtitle={getFinderLifecycleMessage(lifecycleState)}
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge value={lifecycleState} />
            {finderDeadlineValue ? <StatusBadge value={finderDeadlineMissed ? 'expired' : 'deadline_active'} /> : null}
            {ownerDeadlineValue && (ownerDeadlineMissed || lifecycleState === 'failed') ? <StatusBadge value="failed" /> : null}
          </div>
        )}
      />

      <section className="pnf-card p-5">
        <h2 className="text-lg font-semibold text-slate-900">Request Info</h2>
        <div className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
          <p><span className="font-medium">Title:</span> {assignment?.request?.itemName || '-'}</p>
          <p><span className="font-medium">Location:</span> {assignment?.request?.lastSeenLocation || '-'}</p>
          <p><span className="font-medium">Finder Deadline (4h):</span> {formatDate(finderDeadlineValue)}</p>
          <p><span className="font-medium">Owner Service Deadline:</span> {formatDate(ownerDeadlineValue)}</p>
          <p>
            <span className="font-medium">Finder Countdown:</span>{' '}
            <span className={finderDeadlineMissed ? 'font-semibold text-rose-700' : 'font-semibold text-blue-700'}>
              {formatDuration(remainingMs)}
            </span>
          </p>
          <p className="md:col-span-2">
            <span className="font-medium">Description:</span> {assignment?.request?.itemDescription || '-'}
          </p>
        </div>

        {finderDeadlineMissed ? (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Finder deadline passed. Assignment is marked as expired and further actions are disabled.
          </p>
        ) : null}

        {ownerDeadlineMissed || lifecycleState === 'failed' ? (
          <p className="mt-3 rounded-lg border border-rose-300 bg-rose-100 px-3 py-2 text-sm text-rose-800">
            Owner service deadline reached. Assignment and request are marked failed.
          </p>
        ) : null}

        {assignmentPaused ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Assignment is paused. Resume to continue tracking and evidence upload.
          </p>
        ) : null}

        {!finderDeadlineMissed && !ownerDeadlineMissed && !['completed', 'expired', 'failed'].includes(lifecycleState) ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {!assignmentPaused ? (
              <button
                type="button"
                className="pnf-btn-outline rounded-lg px-3 py-2 text-sm"
                onClick={handlePauseAssignment}
                disabled={pauseLoading}
              >
                {pauseLoading ? 'Please wait...' : 'Apply Break (max 15 min)'}
              </button>
            ) : (
              <button
                type="button"
                className="pnf-btn-primary rounded-lg px-3 py-2 text-sm"
                onClick={handleResumeAssignment}
                disabled={pauseLoading}
              >
                {pauseLoading ? 'Please wait...' : 'Resume Assignment'}
              </button>
            )}
          </div>
        ) : null}

        {!assignmentPaused && !finderDeadlineMissed && !ownerDeadlineMissed && !['completed', 'expired', 'failed'].includes(lifecycleState) ? (
          <p className="mt-2 text-xs text-slate-500">
            Break pauses assignment temporarily. Resume within 15 minutes for fair deadline extension.
          </p>
        ) : null}
      </section>

      <section className="pnf-card mt-4 p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Assignment Timeline</h2>
          <button
            type="button"
            className="pnf-btn-outline rounded-lg px-3 py-2 text-sm"
            onClick={handleOpenTrackingModal}
          >
            Add Update
          </button>
        </div>

        <label className="mb-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={autoTrackingEnabled}
            onChange={(event) => setAutoTrackingEnabled(event.target.checked)}
            disabled={!canAddTracking}
          />
          Enable optional low-frequency auto tracking (privacy-safe)
        </label>

        {timeline.length === 0 ? (
          <p className="text-sm text-slate-600">No tracking updates yet.</p>
        ) : (
          <div className="space-y-2">
            {timeline.map((entry) => (
              <article key={entry._id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <StatusBadge value={entry.action || 'timeline_event'} />
                  <p className="text-xs text-slate-500">{formatDate(entry.createdAt)}</p>
                </div>
                <p className="mt-2 text-sm text-slate-700">
                  {(entry?.actor?.user?.full_name || entry?.actor?.label || 'System')} performed {String(entry.action || '').toLowerCase().replaceAll('_', ' ')}
                </p>
                {entry?.details?.remarks ? <p className="mt-1 text-sm text-slate-600">{entry.details.remarks}</p> : null}
                {entry?.details?.locationName ? <p className="mt-1 text-xs text-slate-500">Location: {entry.details.locationName}</p> : null}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="pnf-card mt-4 p-5">
        <h2 className="text-lg font-semibold text-slate-900">Evidence</h2>

        {canUploadEvidence ? (
          <button type="button" className="pnf-btn-primary mt-3 rounded-lg px-3 py-2 text-sm" onClick={() => setEvidenceModalOpen(true)}>
            Submit Evidence
          </button>
        ) : null}

        {evidencePending ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Waiting for owner verification
          </p>
        ) : null}

        {evidenceStatus === 'rejected' ? (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Evidence rejected. Reason: {evidence?.verificationNotes || 'No reason provided by owner.'}
          </p>
        ) : null}

        {evidenceVerified ? (
          <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Evidence verified
          </p>
        ) : null}

        {uploadedEvidenceFiles.length > 0 ? (
          <div className="mt-3 space-y-2">
            <p className="text-sm font-medium text-slate-700">Uploaded Evidence Preview</p>
            <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
              {uploadedEvidenceFiles.map((file) => (
                <article key={file.key} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                  {file.type.toLowerCase() === 'video' ? (
                    <video className="h-40 w-full bg-slate-100 object-cover" controls src={file.url}>
                      <track kind="captions" />
                    </video>
                  ) : (
                    <a href={file.url} target="_blank" rel="noreferrer" className="block">
                      <img className="h-40 w-full bg-slate-100 object-cover" src={file.url} alt={file.name} loading="lazy" />
                    </a>
                  )}
                  <p className="truncate px-2 py-1 text-xs text-slate-600">{file.name}</p>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-600">No evidence uploaded yet.</p>
        )}
      </section>

      <section className="pnf-card mt-4 p-5">
        <h2 className="text-lg font-semibold text-slate-900">Chat</h2>
        {chatEnabled ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-slate-600">
              Chat is accessible only from assignment details. {lifecycleState === 'completed' ? 'It is now read-only.' : 'Coordinate final handoff with owner.'}
            </p>
            <Link to={`/chat/${assignmentId}`} className="pnf-btn-primary rounded-lg px-3 py-2 text-sm">Open Chat</Link>
          </div>
        ) : (
          <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Chat is visible only after evidence is verified.
          </p>
        )}
      </section>

      {lifecycleState === 'completed' ? (
        <section className="pnf-card mt-4 p-5">
          <h2 className="text-lg font-semibold text-slate-900">Assignment Completed</h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge value="completed" />
            <StatusBadge value={payout?.payoutStatus || 'pending'} />
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Payment status: {payout?.payoutStatus ? String(payout.payoutStatus).replace('_', ' ') : 'pending'}
          </p>
          {payout?.payoutStatus === 'processed' ? (
            <p className="mt-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Payment received successfully.
            </p>
          ) : null}
          {payout?.processedAt ? (
            <p className="mt-1 text-xs text-slate-500">Processed at: {formatDate(payout.processedAt)}</p>
          ) : null}
        </section>
      ) : null}

      {payout && lifecycleState !== 'completed' ? (
        <section className="pnf-card mt-4 p-5">
          <h2 className="text-lg font-semibold text-slate-900">Settlement / Payout</h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge value={payout?.payoutStatus || 'pending'} />
            {payout?.payoutCategory ? <StatusBadge value={payout.payoutCategory} /> : null}
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Amount: Rs {Number(payout?.payoutAmount || 0).toFixed(2)}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Category: {payout?.payoutCategory ? String(payout.payoutCategory).replace('_', ' ') : 'standard'}
          </p>
          {payout?.settlementReason ? (
            <p className="mt-1 text-xs text-slate-500">Reason: {payout.settlementReason}</p>
          ) : null}
          {payout?.processedAt ? (
            <p className="mt-1 text-xs text-slate-500">Processed at: {formatDate(payout.processedAt)}</p>
          ) : null}
        </section>
      ) : null}

      <GlassModal
        open={trackingModalOpen}
        title="Add Tracking Update"
        subtitle="Share progress with optional location details."
        confirmText={postingUpdate ? 'Adding update...' : 'Add Update'}
        onClose={() => {
          if (!postingUpdate) {
            setTrackingModalOpen(false);
          }
        }}
        onConfirm={() => {
          const form = document.getElementById('finder-tracking-form');
          form?.requestSubmit();
        }}
        confirmDisabled={!canAddTracking || postingUpdate}
        loading={postingUpdate}
      >
        <form id="finder-tracking-form" className="grid gap-3 md:grid-cols-2" onSubmit={submitTrackingUpdate}>
          <textarea
            className="pnf-input md:col-span-2"
            rows={3}
            placeholder="Message"
            value={trackingForm.message}
            onChange={(event) => setTrackingForm((prev) => ({ ...prev, message: event.target.value }))}
            disabled={!canAddTracking || postingUpdate}
            required
          />
          <select
            className="pnf-input"
            value={trackingForm.locationSource}
            onChange={(event) => setTrackingForm((prev) => ({ ...prev, locationSource: event.target.value }))}
            disabled={!canAddTracking || postingUpdate}
          >
            <option value={LOCATION_MODES.CURRENT}>Use current location</option>
            <option value={LOCATION_MODES.MANUAL}>Enter location manually</option>
            <option value={LOCATION_MODES.SKIP}>Skip location</option>
          </select>
          {trackingForm.locationSource === LOCATION_MODES.MANUAL ? (
            <input
              className="pnf-input"
              type="text"
              placeholder="Enter location text"
              value={trackingForm.locationName}
              onChange={(event) => setTrackingForm((prev) => ({ ...prev, locationName: event.target.value }))}
              disabled={!canAddTracking || postingUpdate}
            />
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              {trackingForm.locationSource === LOCATION_MODES.CURRENT
                ? 'Location will be auto-captured when you submit.'
                : 'This update will be posted without location.'}
            </div>
          )}
        </form>
      </GlassModal>

      <GlassModal
        open={evidenceModalOpen}
        title="Submit Evidence"
        subtitle="Upload max 5 images OR 1 video (max 2 minutes) with description."
        confirmText={submittingEvidence ? 'Submitting...' : 'Submit'}
        onClose={() => {
          if (!submittingEvidence) {
            setEvidenceModalOpen(false);
            setEvidenceValidationError('');
          }
        }}
        onConfirm={() => {
          const form = document.getElementById('finder-evidence-form');
          form?.requestSubmit();
        }}
        confirmDisabled={submittingEvidence}
        loading={submittingEvidence}
      >
        <form id="finder-evidence-form" className="grid gap-3 md:grid-cols-2" onSubmit={submitEvidence}>
          <textarea
            className="pnf-input md:col-span-2"
            rows={3}
            placeholder="Description"
            value={evidenceForm.description}
            onChange={(event) => setEvidenceForm((prev) => ({ ...prev, description: event.target.value }))}
            disabled={submittingEvidence}
            required
          />

          <input
            className="pnf-input md:col-span-2"
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={async (event) => {
              await addEvidenceFiles(event.target.files || []);
              event.target.value = '';
            }}
            disabled={submittingEvidence}
          />

          {selectedEvidencePreviews.length > 0 ? (
            <div className="space-y-2 md:col-span-2">
              <p className="text-sm font-medium text-slate-700">Selected Files ({selectedEvidencePreviews.length})</p>
              <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
                {selectedEvidencePreviews.map((file) => (
                  <article key={file.key} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                    {file.type.startsWith('video/') ? (
                      <video className="h-36 w-full bg-slate-100 object-cover" controls src={file.url}>
                        <track kind="captions" />
                      </video>
                    ) : (
                      <img className="h-36 w-full bg-slate-100 object-cover" src={file.url} alt={file.name} loading="lazy" />
                    )}
                    <div className="flex items-center justify-between gap-2 px-2 py-1">
                      <p className="truncate text-xs text-slate-600">{file.name}</p>
                      <button
                        type="button"
                        className="rounded border border-rose-200 px-2 py-0.5 text-xs text-rose-700"
                        onClick={() => removeEvidenceFile(file.key)}
                        disabled={submittingEvidence}
                      >
                        Remove
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {evidenceValidationError ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 md:col-span-2">
              {evidenceValidationError}
            </p>
          ) : null}
        </form>
      </GlassModal>
    </div>
  );
};

export default FinderAssignmentDetailsPage;
