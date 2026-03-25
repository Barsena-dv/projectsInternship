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
      <div className="flex h-36 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 p-2 text-center text-xs text-rose-700">
        File URL missing
      </div>
    );
  }

  if (type === 'document') {
    return (
      <a
        className="flex h-36 items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-center text-xs font-medium text-blue-700 hover:bg-blue-50"
        href={fileUrl}
        target="_blank"
        rel="noreferrer"
      >
        Open Document
      </a>
    );
  }

  return (
    <div className="relative h-36 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
      {!isLoaded && !hasError ? (
        <div className="absolute inset-0 flex animate-pulse items-center justify-center bg-slate-100 text-[11px] font-medium text-slate-500">
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
  onRetryExpired,
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
  const canRetry = (lifecycleState === 'expired' || lifecycleState === 'cancelled') && !isCompleted;
  const canEditRequest = ['draft', 'pending_payment', 'open'].includes(lifecycleState);
  const canDeleteRequest = ['draft', 'pending_payment'].includes(lifecycleState);
  const canDecideApplications = lifecycleState === 'open' && !assignment;

  return (
    <div className="space-y-4">
      <section className="pnf-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Request Information</h2>
          <StatusBadge value={lifecycleState} />
        </div>

        <div className="mt-4 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
          <p><span className="font-medium">Item Name:</span> {request.itemName}</p>
          <p><span className="font-medium">Category:</span> {request.itemCategory || '-'}</p>
          <p><span className="font-medium">Description:</span> {request.itemDescription || '-'}</p>
          <p><span className="font-medium">Last Seen:</span> {request.lastSeenLocation || '-'}</p>
          <p><span className="font-medium">Service Plan:</span> {request.planId?.planName || '-'}</p>
          <p><span className="font-medium">Created:</span> {formatDate(request.createdAt)}</p>
        </div>
      </section>

      <section className="pnf-card p-5">
        <h3 className="text-base font-semibold text-slate-900">Payment Status</h3>
        {lifecycleState === 'draft' || lifecycleState === 'pending_payment' ? (
          <div className="mt-3 space-y-3">
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Payment pending. This request stays in draft until payment is completed.
            </p>
            <PaymentButton request={request} onSuccess={onPaymentSuccess} />
          </div>
        ) : (
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p><span className="font-medium">Payment Status:</span> {payment?.paymentStatus || 'not available'}</p>
            <p><span className="font-medium">Amount:</span> {payment?.amount ? `Rs ${payment.amount}` : '-'}</p>
            <p><span className="font-medium">Method:</span> {payment?.paymentMethod ? String(payment.paymentMethod).replace('_', ' ') : '-'}</p>
            <p><span className="font-medium">Transaction ID:</span> {payment?.transactionId || '-'}</p>
            <p><span className="font-medium">Paid At:</span> {formatDate(payment?.paidAt)}</p>
          </div>
        )}
      </section>

      {canEditRequest || canDeleteRequest ? (
        <section className="pnf-card p-5">
          <h3 className="text-base font-semibold text-slate-900">Request Actions</h3>
          <p className="mt-2 text-sm text-slate-600">
            Edit and delete are available before assignment. Once assigned, request details are locked.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {canEditRequest ? (
              <button className="pnf-btn-outline rounded-lg px-3 py-2 text-sm" type="button" onClick={onEditRequest}>
                Edit Request
              </button>
            ) : null}
            {canDeleteRequest ? (
              <button
                className="rounded-lg border border-rose-200 px-3 py-2 text-sm text-rose-700 hover:bg-rose-50"
                type="button"
                onClick={onDeleteRequest}
              >
                Delete Draft
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      {(lifecycleState === 'open' || lifecycleState === 'assigned' || lifecycleState === 'inactive' || lifecycleState === 'expired' || lifecycleState === 'evidence_submitted' || lifecycleState === 'verified' || isCompleted) ? (
        <section className="pnf-card p-5">
          <h3 className="text-base font-semibold text-slate-900">Applicants History ({applications?.length || 0})</h3>
          <p className="mt-1 text-xs text-slate-500">Pending now: {pendingApplications.length}</p>
          {!canDecideApplications ? (
            <p className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              Finder already assigned. Applicant decisions are locked now.
            </p>
          ) : null}
          {pendingApplications.length === 0 && applicants.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600">No finder has applied yet.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {pendingApplications.map((application) => (
                <article key={application._id} className="rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900">{application?.finder?.full_name || 'Finder'}</p>
                      <p>Rating: {application?.finder?.ratingAvg || 0}</p>
                      <p>Region: {application?.finderRegion || '-'}</p>
                      <p>Reason: {application?.applyReason || '-'}</p>
                      <p>
                        Completed: {application?.finderStats?.completedAssignments || 0} /
                        {' '}
                        {application?.finderStats?.totalAssignments || 0}
                        {' '}
                        ({application?.finderStats?.completionRate || 0}% success)
                      </p>
                    </div>
                    {canDecideApplications ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="pnf-btn-outline rounded-lg px-3 py-1.5 text-xs"
                          type="button"
                          onClick={() => setSelectedApplicant(application)}
                        >
                          View Profile
                        </button>
                        <button
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white"
                          type="button"
                          onClick={() => onApplicationDecision(application, 'accepted')}
                        >
                          Accept
                        </button>
                        <button
                          className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white"
                          type="button"
                          onClick={() => onApplicationDecision(application, 'rejected')}
                        >
                          Reject
                        </button>
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}

              {applicants.map((finder) => (
                <article key={finder._id} className="rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
                  <p className="font-medium text-slate-900">{finder.full_name || 'Finder'}</p>
                  <p>Rating: {finder.ratingAvg || 0}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {assignment ? (
        <section className="pnf-card p-5">
          <h3 className="text-base font-semibold text-slate-900">Assigned Finder and Tracking</h3>
          <div className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
            <p><span className="font-medium">Finder:</span> {assignment?.finder?.full_name || '-'}</p>
          </div>

          {canRetry ? (
            <div className="mt-3">
              <button
                className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-medium text-white"
                type="button"
                onClick={onRetryExpired}
              >
                Retry With New Finder
              </button>
            </div>
          ) : null}

          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-medium text-slate-800">Assignment Timeline</p>
            {timelineEvents?.length ? (
              <div className="mt-3 space-y-4 border-l-2 border-slate-200 pl-4">
                {timelineEvents.map((row) => (
                  <article key={row._id} className="relative rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700 shadow-sm">
                    <div className="absolute -left-5.25 top-3 h-2 w-2 rounded-full border border-slate-200 bg-white" />
                    <p className="font-semibold text-slate-900">{row.action?.replace(/_/g, ' ')}</p>
                    <p className="text-slate-600">Actor: {row?.actor?.user?.full_name || row?.actor?.label || 'System'}</p>
                    {row?.details?.remarks ? <p className="mt-1 italic">"{row.details.remarks}"</p> : null}
                    {row?.details?.locationName ? <p className="mt-0.5 text-blue-600">📍 {row.details.locationName}</p> : null}
                    <p className="mt-1 text-right text-[10px] text-slate-400 font-mono">{formatDate(row.createdAt)}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-sm text-slate-600">No tracking updates yet.</p>
            )}
          </div>
        </section>
      ) : null}

      {(lifecycleState === 'evidence_submitted' || lifecycleState === 'verified' || isCompleted) ? (
        <section className="pnf-card p-5">
          <h3 className="text-base font-semibold text-slate-900">Evidence Verification</h3>
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p><span className="font-medium">Evidence Status:</span> {evidence?.verificationStatus || 'not submitted'}</p>
            <p><span className="font-medium">Notes:</span> {evidence?.verificationNotes || evidence?.description || '-'}</p>
            <EvidenceFiles files={evidence?.files} />
            {canVerify ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white" type="button" onClick={() => onVerifyEvidence(true)}>
                  Verify Evidence
                </button>
                <button className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white" type="button" onClick={() => onVerifyEvidence(false)}>
                  Reject Evidence
                </button>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {(lifecycleState === 'verified' || isCompleted) ? (
        <section className="pnf-card p-5">
          <h3 className="text-base font-semibold text-slate-900">Chat and Release</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="pnf-btn-outline rounded-lg px-3 py-2 text-sm" type="button" onClick={onOpenChat}>
              Open Chat
            </button>
            {canRelease ? (
              <button className="pnf-btn-primary rounded-lg px-3 py-2 text-sm" type="button" onClick={onReleasePayment}>
                Release Payment
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      {isCompleted ? (
        <section className="pnf-card p-5">
          <h3 className="text-base font-semibold text-slate-900">Completion and Rating</h3>
          <p className="mt-2 text-sm text-emerald-700">This request is completed. You can now rate the finder.</p>
          <button className="mt-3 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white" type="button" onClick={onRateFinder}>
            Rate Finder
          </button>
        </section>
      ) : null}

      <GlassModal
        open={Boolean(selectedApplicant)}
        title="Applicant Details"
        subtitle="Review finder profile and performance before deciding."
        onClose={() => setSelectedApplicant(null)}
        onConfirm={() => {
          if (!selectedApplicant) return;
          onApplicationDecision(selectedApplicant, 'accepted');
          setSelectedApplicant(null);
        }}
        confirmText="Accept Finder"
        confirmDisabled={!canDecideApplications}
      >
        <div className="space-y-2 text-sm text-slate-700">
          <p><span className="font-medium">Name:</span> {selectedApplicant?.finder?.full_name || '-'}</p>
          <p><span className="font-medium">Phone:</span> {selectedApplicant?.finder?.phone || '-'}</p>
          <p><span className="font-medium">Email:</span> {selectedApplicant?.finder?.email || '-'}</p>
          <p><span className="font-medium">Rating:</span> {selectedApplicant?.finder?.ratingAvg || 0}</p>
          <p><span className="font-medium">Region:</span> {selectedApplicant?.finderRegion || '-'}</p>
          <p><span className="font-medium">Reason:</span> {selectedApplicant?.applyReason || '-'}</p>
          <p>
            <span className="font-medium">Performance:</span>
            {' '}
            {selectedApplicant?.finderStats?.completedAssignments || 0}
            /
            {selectedApplicant?.finderStats?.totalAssignments || 0}
            {' '}
            completed ({selectedApplicant?.finderStats?.completionRate || 0}%)
          </p>

          {canDecideApplications ? (
            <button
              className="mt-2 rounded-lg border border-rose-600 bg-rose-600 px-3 py-2 text-sm font-medium text-white"
              type="button"
              onClick={() => {
                if (!selectedApplicant) return;
                onApplicationDecision(selectedApplicant, 'rejected');
                setSelectedApplicant(null);
              }}
            >
              Reject Finder
            </button>
          ) : null}
        </div>
      </GlassModal>
    </div>
  );
};

export default RequestDetails;
