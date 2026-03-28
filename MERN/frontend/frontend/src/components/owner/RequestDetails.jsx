import { useState } from 'react';
import { formatDate } from '../../utils/helpers';
import { deriveOwnerLifecycleState } from '../../utils/requestLifecycle';
import GlassModal from '../common/GlassModal';
import StatusBadge from '../common/StatusBadge';
import PaymentButton from './PaymentButton';

const resolveFileUrl = (file) => file?.url || file?.secure_url || file?.fileUrl || file?.path || '';

const EvidenceFileItem = ({ file, index }) => {
  const type = String(file?.fileType || '').toLowerCase();
  const fileUrl = resolveFileUrl(file);
  const [isLoaded, setIsLoaded] = useState(type === 'document');
  const [hasError, setHasError] = useState(false);

  if (!fileUrl) {
    return (
      <div className="flex h-36 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/5 p-2 text-center text-xs text-rose-400">
        File URL missing
      </div>
    );
  }

  if (type === 'document') {
    return (
      <a
        className="flex h-36 items-center justify-center rounded-lg border border-white/10 bg-black/20 p-2 text-center text-xs font-medium text-amber-400 hover:bg-amber-500/10"
        href={fileUrl}
        target="_blank"
        rel="noreferrer"
      >
        Open Document
      </a>
    );
  }

  return (
    <div className="relative h-36 overflow-hidden rounded-lg border border-white/10 bg-black/20">
      {!isLoaded && !hasError ? (
        <div className="absolute inset-0 flex animate-pulse items-center justify-center bg-stone-800 text-[11px] font-medium text-stone-500">
          Loading evidence...
        </div>
      ) : null}

      {hasError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-rose-50 p-2 text-center text-xs text-rose-700">
          Unable to load file
        </div>
      ) : null}

      {type === 'video' ? (
        <video
          className={`h-36 w-full object-cover transition-opacity ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          controls
          src={fileUrl}
          onLoadedData={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        >
          <track kind="captions" />
        </video>
      ) : (
        <a href={fileUrl} target="_blank" rel="noreferrer" className="block h-full w-full">
          <img
            className={`h-36 w-full object-cover transition-opacity ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            src={fileUrl}
            alt={`evidence-${index + 1}`}
            loading="lazy"
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
          />
        </a>
      )}
    </div>
  );
};

const EvidenceFiles = ({ files }) => {
  if (!Array.isArray(files) || files.length === 0) {
    return <p className="mt-2 text-xs text-slate-500">No evidence files uploaded.</p>;
  }

  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {files.map((file, index) => {
        const key = file.cloudinaryId || resolveFileUrl(file) || `${index}`;
        return <EvidenceFileItem key={key} file={file} index={index} />;
      })}
    </div>
  );
};

const RequestDetails = ({
  request,
  assignment,
  applications,
  payment,
  evidence,
  timelineEvents,
  onPaymentSuccess,
  onVerifyEvidence,
  onReleasePayment,
  onApplicationDecision,
  onRetrySameFinder,
  onRetryDifferentFinder,
  onDropExpired,
  onDropFailed,
  onOpenChat,
  onRateFinder,
  onEditRequest,
  onDeleteRequest
}) => {
  const [selectedApplicant, setSelectedApplicant] = useState(null);

  if (!request) return null;

  const lifecycleState = deriveOwnerLifecycleState({ request, payment, assignment, evidence });
  const pendingApplications = (applications || []).filter((entry) => String(entry?.status || '').toLowerCase() === 'pending');
  const applicants = Array.isArray(request.finders)
    ? Array.from(
        request.finders.reduce((acc, finder) => {
          const key = finder?._id || finder?.id || finder?.email || JSON.stringify(finder || {});
          if (!acc.has(key)) acc.set(key, finder);
          return acc;
        }, new Map()).values()
      )
    : [];

  const isCompleted = lifecycleState === 'completed';
  const canVerify = lifecycleState === 'evidence_submitted' && evidence?.verificationStatus === 'pending';
  const canRelease = lifecycleState === 'verified' && payment?.paymentStatus === 'locked';
  const showExpiredControls = lifecycleState === 'expired' && !isCompleted;
  const showFailedControls = lifecycleState === 'failed' && !isCompleted;
  const canEditRequest = ['draft', 'pending_payment', 'open'].includes(lifecycleState);
  const canDeleteRequest = ['draft', 'pending_payment'].includes(lifecycleState);
  const canDecideApplications = lifecycleState === 'open' && !assignment;

  // Most recent first for tracking
  const sortedTimeline = [...(timelineEvents || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="owner-details-grid">
      <div className="owner-details-main">
        {/* Primary Info Card */}
        <section className="owner-details-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white tracking-tight">Request Overview</h2>
            <StatusBadge value={lifecycleState} />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="owner-details-label">Item Identity</p>
              <p className="owner-details-value font-semibold text-white">{request.itemName}</p>
              
              <p className="owner-details-label">Category</p>
              <p className="owner-details-value">{request.itemCategory || 'General'}</p>
              
              <p className="owner-details-label">Description</p>
              <p className="owner-details-value leading-relaxed text-stone-300">{request.itemDescription || 'No description provided'}</p>
            </div>
            <div>
              <p className="owner-details-label">Last Seen At</p>
              <p className="owner-details-value">{request.lastSeenLocation || '-'}</p>

              <p className="owner-details-label">Service Plan</p>
              <p className="owner-details-value text-amber-400 font-medium">{request.planId?.planName || 'Standard'}</p>

              <p className="owner-details-label">Created on</p>
              <p className="owner-details-value text-stone-400">{formatDate(request.createdAt)}</p>
            </div>
          </div>

          {canEditRequest || canDeleteRequest ? (
            <div className="mt-8 pt-6 border-t border-white/5 flex gap-3">
              {canEditRequest && (
                <button className="pnf-btn-outline rounded-xl px-4 py-2 text-sm" onClick={onEditRequest}>
                  Edit Details
                </button>
              )}
              {canDeleteRequest && (
                <button className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/20" onClick={onDeleteRequest}>
                  Delete Draft
                </button>
              )}
            </div>
          ) : null}
        </section>

        {/* Evidence & Verification Card */}
        {(lifecycleState === 'evidence_submitted' || lifecycleState === 'verified' || isCompleted) && (
          <section className="owner-details-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Evidence & Findings</h3>
              <StatusBadge value={evidence?.verificationStatus || 'pending'} />
            </div>
            
            <div className="p-4 rounded-xl bg-black/30 border border-white/5">
              <p className="owner-details-label">Finder's Note</p>
              <p className="text-sm text-stone-300 italic mb-4">
                "{evidence?.verificationNotes || evidence?.description || 'No notes provided'}"
              </p>
              
              <EvidenceFiles files={evidence?.files} />

              {canVerify && (
                <div className="mt-6 flex gap-3">
                  <button className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20" onClick={() => onVerifyEvidence(true)}>
                    Approve Evidence
                  </button>
                  <button className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-500/20" onClick={() => onVerifyEvidence(false)}>
                    Reject
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Payment & Settlement Card */}
        <section className="owner-details-card">
          <h3 className="text-lg font-bold text-white mb-4">Financial Status</h3>
          {lifecycleState === 'draft' || lifecycleState === 'pending_payment' ? (
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <p className="text-sm text-amber-200/80 mb-4">
                Please complete the payment to publish this request and start receiving applications from finders.
              </p>
              <PaymentButton request={request} onSuccess={onPaymentSuccess} />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 p-5 rounded-xl bg-black/40 border border-white/5 shadow-2xl">
              <div className="space-y-4">
                <div>
                  <p className="owner-details-label uppercase tracking-tighter text-[9px] mb-1">Current Status</p>
                  <p className="text-sm text-white font-bold capitalize flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${payment?.paymentStatus === 'locked' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                    {String(payment?.paymentStatus || 'processing').replace('_', ' ')}
                  </p>
                </div>
                
                <div>
                  <p className="owner-details-label uppercase tracking-tighter text-[9px] mb-1">Total Amount Escrowed</p>
                  <div className="flex flex-col">
                     <p className="text-xl font-black text-amber-400">Rs {payment?.amount || '0'}</p>
                     {payment?.servicePlan && (
                        <p className="text-[10px] text-emerald-500/70 font-bold mt-1">
                          (Rs {((payment.amount * (payment.servicePlan.refundPercent || 0)) / 100).toFixed(2)} Refundable on Failure)
                        </p>
                     )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="owner-details-label uppercase tracking-tighter text-[9px] mb-1">Network & Discovery Fees</p>
                  {payment?.servicePlan ? (
                    <div className="flex flex-col">
                       <p className="text-sm text-rose-400/80 font-bold">
                         Rs {((payment.amount * ((payment.servicePlan.platformPercent || 0) + (payment.servicePlan.finderPercent || 0))) / 100).toFixed(2)}
                       </p>
                       <p className="text-[9px] text-stone-500 italic mt-0.5">Non-refundable professional service fees</p>
                    </div>
                  ) : (
                    <p className="text-sm text-stone-400 font-medium">-</p>
                  )}
                </div>

                {Number(payment?.refundAmount || 0) > 0 ? (
                  <div className="pt-2 border-t border-white/5">
                    <p className="owner-details-label uppercase tracking-tighter text-[9px] mb-1 text-rose-500">Amount Refunded</p>
                    <p className="text-lg font-black text-rose-500">Rs {Number(payment.refundAmount).toFixed(2)}</p>
                  </div>
                ) : (
                   <div>
                      <p className="owner-details-label uppercase tracking-tighter text-[9px] mb-1 text-stone-600">Transaction Fingerprint</p>
                      <p className="text-[10px] font-mono text-stone-500 truncate bg-white/5 p-1.5 rounded border border-white/5">{payment?.transactionId || 'PENDING_VALIDATION'}</p>
                   </div>
                )}
              </div>
            </div>
          )}
          
          {(canRelease || isCompleted) && (
            <div className="mt-6 flex flex-wrap gap-3">
              {canRelease && (
                <button className="pnf-btn-primary rounded-xl px-5 py-2.5 text-sm font-bold" onClick={onReleasePayment}>
                  Release Payment to Finder
                </button>
              )}
              {isCompleted && (
                <button className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/20" onClick={onRateFinder}>
                  Rate Finder Experience
                </button>
              )}
              <button className="pnf-btn-outline rounded-xl px-5 py-2.5 text-sm font-semibold" onClick={onOpenChat}>
                Open Workspace Chat
              </button>
            </div>
          )}
        </section>
      </div>

      <aside className="owner-details-aside">
        {/* Tracking Timeline Card */}
        <section className="owner-details-card">
          <h3 className="text-lg font-bold text-white mb-2">Assignment Activity</h3>
          <p className="text-xs text-stone-400 mb-4">Showing most recent updates first</p>
          
          <div className="owner-details-tracking">
            {sortedTimeline.length ? (
              <div className="tracking-timeline-modern">
                {sortedTimeline.map((row) => (
                  <article key={row._id} className="tracking-event-card">
                    <div className="tracking-event-dot" />
                    <p className="tracking-event-time">{formatDate(row.createdAt)}</p>
                    <p className="tracking-event-title">{String(row.action || '').replace(/_/g, ' ')}</p>
                    <p className="tracking-event-meta">By {row?.actor?.user?.full_name || row?.actor?.label || 'System'}</p>
                    {row?.details?.locationName && (
                      <p className="text-[10px] text-amber-500/80 mt-1 flex items-center gap-1">
                        📍 {row.details.locationName}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-stone-500">No activity logged yet.</p>
              </div>
            )}
          </div>

          {(showExpiredControls || showFailedControls) && (
            <div className="mt-6 pt-6 border-t border-white/5 space-y-4">
              <p className="text-xs text-amber-400 leading-relaxed px-3 py-2 rounded-lg bg-amber-400/5 border border-amber-400/10">
                {showExpiredControls 
                  ? "The finder's deadline has passed without results. You can choose to extend or drop."
                  : "Service deadline failed. You are eligible for a refund as per plan."}
              </p>
              <div className="flex flex-col gap-2">
                {showExpiredControls && (
                  <button className="w-full rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white" onClick={onRetrySameFinder}>
                    Keep Finder & Extend
                  </button>
                )}
                {showFailedControls && (
                  <button className="w-full rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white" onClick={onRetryDifferentFinder}>
                    Retry with Different Finder
                  </button>
                )}
                <button className="w-full rounded-xl border border-rose-500/30 px-4 py-2 text-xs font-bold text-rose-400" onClick={showExpiredControls ? onDropExpired : onDropFailed}>
                  Drop & Settle Request
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Assigned Finder Card */}
        {assignment && (
          <section className="owner-details-card">
            <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-4">Assigned Finder</h3>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold">
                {String(assignment.finder?.full_name || 'F').charAt(0)}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{assignment.finder?.full_name || '-'}</p>
                <p className="text-[11px] text-stone-400">Rating: {assignment.finder?.ratingAvg || '5.0'} / 5.0</p>
              </div>
            </div>
          </section>
        )}

        {/* Applicants History Card */}
        {canDecideApplications && pendingApplications.length > 0 && (
          <section className="owner-details-card">
             <h3 className="text-lg font-bold text-white mb-4">New Applications</h3>
             <div className="space-y-3">
               {pendingApplications.map((app) => (
                 <article key={app._id} className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-amber-500/30 transition-colors">
                    <p className="text-sm font-bold text-white mb-1">{app.finder?.full_name}</p>
                    <p className="text-xs text-stone-400 mb-3">{app.finderStats?.completionRate || 0}% Completion Rate</p>
                    <div className="flex gap-2">
                      <button className="flex-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-stone-900" onClick={() => onApplicationDecision(app, 'accepted')}>
                        Accept
                      </button>
                      <button className="rounded-lg bg-stone-800 px-3 py-1.5 text-xs font-bold text-stone-400" onClick={() => setSelectedApplicant(app)}>
                        Profile
                      </button>
                    </div>
                 </article>
               ))}
             </div>
          </section>
        )}
      </aside>

      <GlassModal
        open={Boolean(selectedApplicant)}
        title="Finder Profile"
        subtitle="Detailed performance history"
        onClose={() => setSelectedApplicant(null)}
        onConfirm={() => {
          if (!selectedApplicant) return;
          onApplicationDecision(selectedApplicant, 'accepted');
          setSelectedApplicant(null);
        }}
        confirmText="Confirm Selection"
        confirmDisabled={!canDecideApplications}
      >
        {selectedApplicant && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="owner-details-label">Total Assignments</p>
                <p className="text-white font-bold">{selectedApplicant.finderStats?.totalAssignments || 0}</p>
              </div>
              <div>
                <p className="owner-details-label">Avg Rating</p>
                <p className="text-amber-400 font-bold">{selectedApplicant.finder?.ratingAvg || '0'} / 5.0</p>
              </div>
            </div>
            <div>
              <p className="owner-details-label">Application Reason</p>
              <p className="text-sm text-stone-300 italic">"{selectedApplicant.applyReason || 'No reason provided'}"</p>
            </div>
            {canDecideApplications && (
              <button 
                className="w-full mt-4 rounded-xl border border-rose-500/30 py-2.5 text-sm font-bold text-rose-400 hover:bg-rose-500/10 transition-colors"
                onClick={() => {
                  onApplicationDecision(selectedApplicant, 'rejected');
                  setSelectedApplicant(null);
                }}
              >
                Reject Application
              </button>
            )}
          </div>
        )}
      </GlassModal>
    </div>
  );
};


export default RequestDetails;
