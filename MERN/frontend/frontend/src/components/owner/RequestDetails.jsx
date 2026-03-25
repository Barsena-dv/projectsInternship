import { useState } from 'react';
import { formatDate } from '../../utils/helpers';
import StatusBadge from '../common/StatusBadge';
import PaymentButton from './PaymentButton';
import { deriveOwnerLifecycleState } from '../../utils/requestLifecycle';

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
  trackingUpdates,
  onPaymentSuccess,
  onVerifyEvidence,
  onReleasePayment,
  onApplicationDecision,
  onOpenChat,
  onRateFinder
}) => {
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
  const canVerify = lifecycleState === 'evidence_submitted' && evidence?.verificationStatus === 'pending';
  const canRelease = lifecycleState === 'verified' && payment?.paymentStatus === 'locked';
  const isCompleted = lifecycleState === 'completed';

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
          <PaymentButton request={request} onSuccess={onPaymentSuccess} />
        ) : (
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p><span className="font-medium">Payment Status:</span> {payment?.paymentStatus || 'not available'}</p>
            <p><span className="font-medium">Amount:</span> {payment?.amount ? `Rs ${payment.amount}` : '-'}</p>
          </div>
        )}
      </section>

      {(lifecycleState === 'open' || lifecycleState === 'assigned' || lifecycleState === 'evidence_submitted' || lifecycleState === 'verified' || isCompleted) ? (
        <section className="pnf-card p-5">
          <h3 className="text-base font-semibold text-slate-900">Applicants</h3>
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
                    </div>
                    <div className="flex flex-wrap gap-2">
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

      {(lifecycleState === 'assigned' || lifecycleState === 'evidence_submitted' || lifecycleState === 'verified' || isCompleted) ? (
        <section className="pnf-card p-5">
          <h3 className="text-base font-semibold text-slate-900">Assigned Finder and Tracking</h3>
          <div className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
            <p><span className="font-medium">Finder:</span> {assignment?.finder?.full_name || '-'}</p>
            <p><span className="font-medium">Assignment Status:</span> {assignment?.status || '-'}</p>
          </div>

          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-medium text-slate-800">Tracking Timeline</p>
            {trackingUpdates?.length ? (
              <div className="mt-2 space-y-2">
                {trackingUpdates.map((row) => (
                  <article key={row._id} className="rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-700">
                    <p className="font-medium">{row.statusUpdate}</p>
                    <p>{row.remarks || 'No remarks'}</p>
                    <p className="text-slate-500">{formatDate(row.createdAt)}</p>
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
    </div>
  );
};

export default RequestDetails;
