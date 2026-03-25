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

const FinderAssignmentDetailsPage = () => {
  const { id: assignmentId } = useParams();

  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [evidence, setEvidence] = useState(null);
  const [payout, setPayout] = useState(null);

  const [trackingForm, setTrackingForm] = useState({
    remarks: '',
    currentLat: '',
    currentLng: '',
  });
  const [postingUpdate, setPostingUpdate] = useState(false);

  const [evidenceForm, setEvidenceForm] = useState({
    description: '',
    lat: '',
    lng: '',
    files: [],
  });
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [evidenceValidationError, setEvidenceValidationError] = useState('');
  const [submittingEvidence, setSubmittingEvidence] = useState(false);
  const [autoTrackingEnabled, setAutoTrackingEnabled] = useState(false);
  const [remainingMs, setRemainingMs] = useState(0);

  const loadAssignment = useCallback(async () => {
    const assignmentRes = await assignmentApi.byId(assignmentId);
    return assignmentRes?.data || null;
  }, [assignmentId]);

  const loadTimeline = useCallback(async () => {
    const timelineRes = await trackingApi.timeline(assignmentId).catch(() => ({ data: [] }));
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
      deadline: assignment?.request?.serviceDeadline,
    }),
    [assignment, evidence]
  );

  const deadlineValue = assignment?.request?.serviceDeadline;
  const deadlineMissed = isDeadlineMissed(deadlineValue);
  const canAddTracking = lifecycleState !== 'completed' && lifecycleState !== 'cancelled' && lifecycleState !== 'failed';

  const evidenceStatus = String(evidence?.verificationStatus || '').toLowerCase();
  const canUploadEvidence = canAddTracking && (!evidence || evidenceStatus === 'rejected');
  const evidencePending = evidenceStatus === 'pending';
  const evidenceVerified = lifecycleState === 'verified' || evidenceStatus === 'verified' || Boolean(assignment?.evidenceVerified);

  const chatEnabled = (evidenceVerified || Boolean(assignment?.chatUnlocked) || lifecycleState === 'completed') && lifecycleState !== 'failed';

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
              statusUpdate: 'near_location',
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
    }, 90 * 1000);

    return () => clearInterval(timer);
  }, [assignmentId, autoTrackingEnabled, canAddTracking]);

  const submitTrackingUpdate = async (event) => {
    event.preventDefault();

    if (!trackingForm.remarks.trim()) {
      toast.error('Message is required');
      return;
    }

    try {
      setPostingUpdate(true);
      await trackingApi.create({
        assignmentId,
        statusUpdate: 'searching',
        remarks: trackingForm.remarks.trim(),
        currentLat: Number(trackingForm.currentLat || 0),
        currentLng: Number(trackingForm.currentLng || 0),
      });

      toast.success('Tracking update added');
      setTrackingForm({ remarks: '', currentLat: '', currentLng: '' });
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
      formData.append('lat', evidenceForm.lat || '0');
      formData.append('lng', evidenceForm.lng || '0');
      Array.from(evidenceForm.files).forEach((file) => formData.append('files', file));

      await evidenceApi.upload(assignmentId, formData);
      toast.success('Evidence submitted');
      setEvidenceForm({ description: '', lat: '', lng: '', files: [] });
      setEvidenceValidationError('');
      setEvidenceModalOpen(false);

      const [assignmentData, evidenceData] = await Promise.all([loadAssignment(), loadEvidence()]);
      setAssignment(assignmentData);
      setEvidence(evidenceData);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmittingEvidence(false);
    }
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
            {deadlineValue ? <StatusBadge value={deadlineMissed ? 'failed' : 'deadline_active'} /> : null}
          </div>
        )}
      />

      <section className="pnf-card p-5">
        <h2 className="text-lg font-semibold text-slate-900">Request Info</h2>
        <div className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
          <p><span className="font-medium">Title:</span> {assignment?.request?.itemName || '-'}</p>
          <p><span className="font-medium">Location:</span> {assignment?.request?.lastSeenLocation || '-'}</p>
          <p><span className="font-medium">Deadline:</span> {formatDate(deadlineValue)}</p>
          <p>
            <span className="font-medium">Countdown:</span>{' '}
            <span className={deadlineMissed ? 'font-semibold text-rose-700' : 'font-semibold text-blue-700'}>
              {formatDuration(remainingMs)}
            </span>
          </p>
          <p className="md:col-span-2">
            <span className="font-medium">Description:</span> {assignment?.request?.itemDescription || '-'}
          </p>
        </div>

        {deadlineMissed ? (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Deadline passed. Assignment is marked as failed and further actions are disabled.
          </p>
        ) : null}
      </section>

      <section className="pnf-card mt-4 p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Tracking Timeline</h2>
          <button
            type="button"
            className="pnf-btn-outline rounded-lg px-3 py-2 text-sm"
            onClick={() => {
              const element = document.getElementById('finder-add-update-form');
              element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            disabled={!canAddTracking}
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
                  <StatusBadge value={entry.statusUpdate || 'searching'} />
                  <p className="text-xs text-slate-500">{formatDate(entry.createdAt)}</p>
                </div>
                <p className="mt-2 text-sm text-slate-700">{entry.remarks || 'No message'}</p>
                {(Number(entry.currentLat) || Number(entry.currentLng)) ? (
                  <p className="mt-1 text-xs text-slate-500">
                    Location: {Number(entry.currentLat || 0).toFixed(4)}, {Number(entry.currentLng || 0).toFixed(4)}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="pnf-card mt-4 p-5" id="finder-add-update-form">
        <h2 className="text-lg font-semibold text-slate-900">Add Tracking Update</h2>
        <form className="mt-3 grid gap-3 md:grid-cols-2" onSubmit={submitTrackingUpdate}>
          <textarea
            className="pnf-input md:col-span-2"
            rows={3}
            placeholder="Message"
            value={trackingForm.remarks}
            onChange={(event) => setTrackingForm((prev) => ({ ...prev, remarks: event.target.value }))}
            disabled={!canAddTracking || postingUpdate}
            required
          />
          <input
            className="pnf-input"
            type="number"
            step="any"
            placeholder="Optional latitude"
            value={trackingForm.currentLat}
            onChange={(event) => setTrackingForm((prev) => ({ ...prev, currentLat: event.target.value }))}
            disabled={!canAddTracking || postingUpdate}
          />
          <input
            className="pnf-input"
            type="number"
            step="any"
            placeholder="Optional longitude"
            value={trackingForm.currentLng}
            onChange={(event) => setTrackingForm((prev) => ({ ...prev, currentLng: event.target.value }))}
            disabled={!canAddTracking || postingUpdate}
          />
          <button
            className="pnf-btn-primary rounded-lg px-3 py-2 text-sm md:col-span-2"
            type="submit"
            disabled={!canAddTracking || postingUpdate}
          >
            {postingUpdate ? 'Adding update...' : 'Add Update'}
          </button>
        </form>
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
            className="pnf-input"
            type="number"
            step="any"
            placeholder="Optional latitude"
            value={evidenceForm.lat}
            onChange={(event) => setEvidenceForm((prev) => ({ ...prev, lat: event.target.value }))}
            disabled={submittingEvidence}
          />
          <input
            className="pnf-input"
            type="number"
            step="any"
            placeholder="Optional longitude"
            value={evidenceForm.lng}
            onChange={(event) => setEvidenceForm((prev) => ({ ...prev, lng: event.target.value }))}
            disabled={submittingEvidence}
          />

          <input
            className="pnf-input md:col-span-2"
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={async (event) => {
              const files = event.target.files || [];
              setEvidenceForm((prev) => ({ ...prev, files }));

              try {
                const validation = await validateEvidenceFiles(files);
                setEvidenceValidationError(validation.valid ? '' : validation.message);
              } catch {
                setEvidenceValidationError('Unable to validate selected files.');
              }
            }}
            disabled={submittingEvidence}
            required
          />

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
