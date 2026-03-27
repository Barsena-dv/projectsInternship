import { useCallback, useEffect, useState } from 'react';
import { FaStar } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import EmptyState from '../../components/common/EmptyState';
import GlassModal from '../../components/common/GlassModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import RequestDetails from '../../components/owner/RequestDetails';
import { assignmentApi, evidenceApi, paymentApi, ratingApi, requestApi } from '../../services/api';
import { getErrorMessage } from '../../utils/helpers';

const OwnerRequestDetailsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [request, setRequest] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [payment, setPayment] = useState(null);
  const [evidence, setEvidence] = useState(null);
  const [applications, setApplications] = useState([]);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyState, setVerifyState] = useState({ open: false, verified: true, notes: '' });
  const [releaseState, setReleaseState] = useState({ open: false, reason: '' });
  const [editState, setEditState] = useState({
    open: false,
    itemName: '',
    itemCategory: '',
    itemDescription: '',
    lastSeenLocation: '',
  });
  const [deleteState, setDeleteState] = useState({ open: false });
  const [applicationDecisionState, setApplicationDecisionState] = useState({
    open: false,
    decision: 'accepted',
    reason: '',
    application: null,
  });
  const [ratingState, setRatingState] = useState({ open: false, ratingValue: 0, reviewText: '' });
  const [ratingHover, setRatingHover] = useState(0);
  const [modalLoading, setModalLoading] = useState(false);
  const [ownerActionState, setOwnerActionState] = useState({
    open: false,
    action: '',
    reason: '',
  });

  const loadDetails = useCallback(async () => {
    try {
      setLoading(true);
      const requestRes = await requestApi.byId(id);
      const requestData = requestRes.data;
      setRequest(requestData);

      const requestTimelineRes = await assignmentApi.requestTimeline(id).catch(() => ({ data: [] }));
      setTimelineEvents(requestTimelineRes.data || []);

      const applicationsRes = await assignmentApi.applicationsByRequest(id).catch(() => ({ data: [] }));
      setApplications(applicationsRes.data || []);

      const paymentsRes = await paymentApi.my().catch(() => ({ data: [] }));
      const payments = paymentsRes.data || [];
      const selectedPayment = payments.find((p) => {
        const requestRef = p.requestId || p.request;
        const paymentRequestId = typeof requestRef === 'string' ? requestRef : requestRef?._id;
        return paymentRequestId === id;
      });
      setPayment(selectedPayment || null);

      try {
        const assignmentRes = await assignmentApi.byRequest(id);
        const assignmentData = assignmentRes.data || null;
        setAssignment(assignmentData);

        if (assignmentData?._id) {
          const evidenceRes = await evidenceApi.byAssignment(assignmentData._id).catch(() => ({ data: null }));
          setEvidence(evidenceRes.data || null);
        } else {
          setEvidence(null);
        }
      } catch {
        setAssignment(null);
        setEvidence(null);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const handleVerifyEvidence = async (verified) => {
    if (!evidence?._id) return;
    setVerifyState({ open: true, verified, notes: '' });
  };

  const submitVerifyEvidence = async () => {
    if (!evidence?._id) return;
    const { verified, notes } = verifyState;

    if (!verified && !String(notes || '').trim()) {
      toast.error('Please provide a rejection reason.');
      return;
    }

    try {
      setModalLoading(true);
      await evidenceApi.verify(evidence._id, { verified, notes });
      toast.success(verified ? 'Evidence verified successfully.' : 'Evidence rejected successfully.');
      setVerifyState({ open: false, verified: true, notes: '' });
      await loadDetails();
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(message);

      const lower = String(message || '').toLowerCase();
      if (
        lower.includes('already assigned')
        || lower.includes('already been decided')
        || lower.includes('cannot process applications')
      ) {
        setApplicationDecisionState({
          open: false,
          application: null,
          decision: 'accepted',
          reason: '',
        });
        await loadDetails();
      }
    } finally {
      setModalLoading(false);
    }
  };

  const handleReleasePayment = async () => {
    if (!payment?._id) return;
    setReleaseState({ open: true, reason: '' });
  };

  const submitReleasePayment = async () => {
    if (!payment?._id) return;
    const { reason } = releaseState;

    try {
      setModalLoading(true);
      await paymentApi.release(payment._id, { reason });
      toast.success('Payment released successfully. Request completed.');
      setReleaseState({ open: false, reason: '' });
      await loadDetails();
      setRatingState({ open: true, ratingValue: 0, reviewText: '' });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenChat = () => {
    if (!assignment?._id) return;
    navigate(`/chat/${assignment._id}`);
  };

  const handleApplicationDecision = (application, decision) => {
    setApplicationDecisionState({
      open: true,
      application,
      decision,
      reason: '',
    });
  };

  const openOwnerActionModal = (action) => {
    setOwnerActionState({ open: true, action, reason: '' });
  };

  const submitOwnerAction = async () => {
    if (!request?._id || !ownerActionState.action) return;

    const reason = String(ownerActionState.reason || '').trim();

    try {
      setModalLoading(true);

      if (ownerActionState.action === 'retry_same') {
        await assignmentApi.retrySameFinder(request._id, { reason });
        toast.success('Assignment reopened with same finder and new deadline.');
      } else if (ownerActionState.action === 'retry_different') {
        await assignmentApi.retryDifferentFinder(request._id, { reason });
        toast.success('Refund applied. Complete payment again to reopen for new finder.');
      } else if (ownerActionState.action === 'drop_expired') {
        await assignmentApi.dropByOwner(request._id, { mode: 'expired', reason });
        toast.success('Expired request dropped with settlement.');
      } else if (ownerActionState.action === 'drop_failed') {
        await assignmentApi.dropByOwner(request._id, { mode: 'failed', reason });
        toast.success('Failed request dropped with final settlement.');
      }

      setOwnerActionState({ open: false, action: '', reason: '' });
      await loadDetails();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setModalLoading(false);
    }
  };

  const submitApplicationDecision = async () => {
    const target = applicationDecisionState.application;
    if (!target?._id || !request?._id) return;

    if (
      applicationDecisionState.decision === 'rejected'
      && !String(applicationDecisionState.reason || '').trim()
    ) {
      toast.error('Reject reason is required.');
      return;
    }

    try {
      setModalLoading(true);
      await assignmentApi.decideApplication(request._id, target._id, {
        decision: applicationDecisionState.decision,
        reason: applicationDecisionState.reason,
      });

      toast.success(
        applicationDecisionState.decision === 'accepted'
          ? 'Application accepted. Assignment is now active.'
          : 'Application rejected successfully.'
      );

      setApplicationDecisionState({
        open: false,
        application: null,
        decision: 'accepted',
        reason: '',
      });

      await loadDetails();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setModalLoading(false);
    }
  };

  const handleRateFinder = async () => {
    if (!assignment?._id) {
      navigate('/owner/ratings');
      return;
    }

    setRatingState({ open: true, ratingValue: 0, reviewText: '' });
  };

  const handleOpenEditRequest = () => {
    if (!request) return;

    setEditState({
      open: true,
      itemName: request.itemName || '',
      itemCategory: request.itemCategory || '',
      itemDescription: request.itemDescription || '',
      lastSeenLocation: request.lastSeenLocation || '',
    });
  };

  const submitEditRequest = async () => {
    if (!request?._id) return;
    if (!editState.itemName.trim() || !editState.itemCategory.trim() || !editState.itemDescription.trim()) {
      toast.error('Item name, category, and description are required.');
      return;
    }

    try {
      setModalLoading(true);
      await requestApi.update(request._id, {
        itemName: editState.itemName.trim(),
        itemCategory: editState.itemCategory.trim(),
        itemDescription: editState.itemDescription.trim(),
        lastSeenLocation: editState.lastSeenLocation.trim(),
      });
      toast.success('Request updated successfully.');
      setEditState({ open: false, itemName: '', itemCategory: '', itemDescription: '', lastSeenLocation: '' });
      await loadDetails();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenDeleteDraft = () => {
    setDeleteState({ open: true });
  };

  const submitDeleteDraft = async () => {
    if (!request?._id) return;

    try {
      setModalLoading(true);
      await requestApi.remove(request._id);
      toast.success('Draft request deleted successfully.');
      navigate('/owner/requests');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setModalLoading(false);
    }
  };

  const submitRating = async () => {
    if (!assignment?._id) return;

    const ratingValue = Number(ratingState.ratingValue);

    // Optional rating: user can skip by leaving stars unselected.
    if (!ratingValue) {
      setRatingState({ open: false, ratingValue: 0, reviewText: '' });
      toast.info('Rating skipped. You can rate later from ratings page.');
      return;
    }

    if (Number.isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      toast.error('Please select between 1 and 5 stars.');
      return;
    }

    try {
      setModalLoading(true);
      await ratingApi.create({ assignmentId: assignment._id, ratingValue, reviewText: ratingState.reviewText });
      toast.success('Rating submitted successfully.');
      setRatingState({ open: false, ratingValue: 0, reviewText: '' });
      navigate('/owner/ratings');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setModalLoading(false);
    }
  };

  const skipRating = () => {
    setRatingState({ open: false, ratingValue: 0, reviewText: '' });
    toast.info('Rating skipped. You can add it later.');
  };

  if (loading) return <LoadingSpinner text="Loading request details..." />;

  if (!request) {
    return <EmptyState title="Request not found" description="Unable to load this request." />;
  }

  return (
    <div>
      <PageHeader title={`Request Details: ${request.itemName}`} subtitle="Status-driven request and payment lifecycle" />
      <RequestDetails
        request={request}
        assignment={assignment}
        applications={applications}
        payment={payment}
        evidence={evidence}
        timelineEvents={timelineEvents}
        onPaymentSuccess={loadDetails}
        onVerifyEvidence={handleVerifyEvidence}
        onReleasePayment={handleReleasePayment}
        onApplicationDecision={handleApplicationDecision}
        onRetrySameFinder={() => openOwnerActionModal('retry_same')}
        onRetryDifferentFinder={() => openOwnerActionModal('retry_different')}
        onDropExpired={() => openOwnerActionModal('drop_expired')}
        onDropFailed={() => openOwnerActionModal('drop_failed')}
        onOpenChat={handleOpenChat}
        onRateFinder={handleRateFinder}
        onEditRequest={handleOpenEditRequest}
        onDeleteRequest={handleOpenDeleteDraft}
      />

      <GlassModal
        open={ownerActionState.open}
        title={ownerActionState.action === 'retry_same' ? 'Retry With Same Finder' : ownerActionState.action === 'retry_different' ? 'Retry With Different Finder' : 'Drop Request'}
        subtitle={ownerActionState.action === 'retry_same'
          ? 'This reactivates the same finder with a fresh assignment deadline.'
          : ownerActionState.action === 'retry_different'
            ? 'This refunds current payment as per plan. Owner must pay again to reopen cycle.'
            : ownerActionState.action === 'drop_expired'
              ? 'This will close request and settle owner refund + finder compensation.'
              : 'This will keep failed history and apply final settlement as per plan.'}
        onClose={() => setOwnerActionState({ open: false, action: '', reason: '' })}
        onConfirm={submitOwnerAction}
        confirmText={ownerActionState.action?.startsWith('retry') ? 'Confirm Retry' : 'Confirm Drop'}
        confirmClassName={ownerActionState.action?.startsWith('drop') ? 'rounded-lg border border-rose-600 bg-rose-600 text-white' : 'pnf-btn-primary'}
        loading={modalLoading}
      >
        <div className="space-y-3 text-sm text-stone-300">
          <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
            Warning: Financial settlement and timeline history will be recorded permanently.
          </p>
          <textarea
            className="pnf-input"
            rows={3}
            placeholder="Add reason/notes for audit timeline"
            value={ownerActionState.reason}
            onChange={(e) => setOwnerActionState((prev) => ({ ...prev, reason: e.target.value }))}
          />
        </div>
      </GlassModal>

      <GlassModal
        open={applicationDecisionState.open}
        title={applicationDecisionState.decision === 'accepted' ? 'Accept Finder Application' : 'Reject Finder Application'}
        subtitle="This action is final for this specific application."
        onClose={() => setApplicationDecisionState({
          open: false,
          application: null,
          decision: 'accepted',
          reason: '',
        })}
        onConfirm={submitApplicationDecision}
        confirmText={applicationDecisionState.decision === 'accepted' ? 'Accept' : 'Reject'}
        confirmClassName={applicationDecisionState.decision === 'accepted' ? 'pnf-btn-primary' : 'rounded-lg border border-rose-600 bg-rose-600 text-white'}
        loading={modalLoading}
      >
        <div className="space-y-3 text-sm text-stone-300">
          <p>
            Finder: <span className="font-semibold">{applicationDecisionState.application?.finder?.full_name || 'Finder'}</span>
          </p>
          <textarea
            className="pnf-input"
            rows={3}
            placeholder="Optional reason"
            value={applicationDecisionState.reason}
            onChange={(e) => setApplicationDecisionState((prev) => ({ ...prev, reason: e.target.value }))}
          />
        </div>
      </GlassModal>

      <GlassModal
        open={verifyState.open}
        title={verifyState.verified ? 'Verify Evidence' : 'Reject Evidence'}
        subtitle="Add optional notes for the finder before continuing."
        onClose={() => setVerifyState({ open: false, verified: true, notes: '' })}
        onConfirm={submitVerifyEvidence}
        confirmText={verifyState.verified ? 'Verify' : 'Reject'}
        confirmClassName={verifyState.verified ? 'pnf-btn-primary' : 'rounded-lg border border-rose-600 bg-rose-600 text-white'}
        loading={modalLoading}
      >
        <textarea
          className="pnf-input"
          rows={4}
          placeholder="Optional notes"
          value={verifyState.notes}
          onChange={(e) => setVerifyState((prev) => ({ ...prev, notes: e.target.value }))}
        />
      </GlassModal>

      <GlassModal
        open={releaseState.open}
        title="Release Payment"
        subtitle="This will move escrowed payment to the finder."
        onClose={() => setReleaseState({ open: false, reason: '' })}
        onConfirm={submitReleasePayment}
        confirmText="Release"
        loading={modalLoading}
      >
        <textarea
          className="pnf-input"
          rows={3}
          placeholder="Optional release note"
          value={releaseState.reason}
          onChange={(e) => setReleaseState((prev) => ({ ...prev, reason: e.target.value }))}
        />
      </GlassModal>

      <GlassModal
        open={editState.open}
        title="Edit Request"
        subtitle="You can edit request details before assignment."
        onClose={() => setEditState({ open: false, itemName: '', itemCategory: '', itemDescription: '', lastSeenLocation: '' })}
        onConfirm={submitEditRequest}
        confirmText="Save Changes"
        loading={modalLoading}
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-400">Item Name</label>
            <input
              className="pnf-input"
              type="text"
              value={editState.itemName}
              onChange={(e) => setEditState((prev) => ({ ...prev, itemName: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-400">Category</label>
            <input
              className="pnf-input"
              type="text"
              value={editState.itemCategory}
              onChange={(e) => setEditState((prev) => ({ ...prev, itemCategory: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-400">Description</label>
            <textarea
              className="pnf-input"
              rows={3}
              value={editState.itemDescription}
              onChange={(e) => setEditState((prev) => ({ ...prev, itemDescription: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-400">Last Seen Location</label>
            <input
              className="pnf-input"
              type="text"
              value={editState.lastSeenLocation}
              onChange={(e) => setEditState((prev) => ({ ...prev, lastSeenLocation: e.target.value }))}
            />
          </div>
        </div>
      </GlassModal>

      <GlassModal
        open={deleteState.open}
        title="Delete Draft Request"
        subtitle="This will cancel the request. Use this only for unpaid drafts."
        onClose={() => setDeleteState({ open: false })}
        onConfirm={submitDeleteDraft}
        confirmText="Delete Draft"
        confirmClassName="rounded-lg border border-rose-600 bg-rose-600 text-white"
        loading={modalLoading}
      >
        <p className="text-sm text-stone-300">
          Are you sure you want to delete <span className="font-semibold">{request?.itemName || 'this request'}</span>?
        </p>
      </GlassModal>

      <GlassModal
        open={ratingState.open}
        title="Rate Finder"
        subtitle="Optional: select stars like modern apps, or skip for now."
        onClose={skipRating}
        onConfirm={submitRating}
        confirmText={Number(ratingState.ratingValue) > 0 ? 'Submit Rating' : 'Continue Without Rating'}
        cancelText="Skip"
        loading={modalLoading}
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-400">Your Rating</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((starValue) => {
                const activeValue = ratingHover || Number(ratingState.ratingValue) || 0;
                const active = starValue <= activeValue;

                return (
                  <button
                    key={starValue}
                    type="button"
                    className="rounded p-1 transition hover:scale-110"
                    onMouseEnter={() => setRatingHover(starValue)}
                    onMouseLeave={() => setRatingHover(0)}
                    onClick={() => setRatingState((prev) => ({ ...prev, ratingValue: starValue }))}
                    aria-label={`Rate ${starValue} star`}
                  >
                    <FaStar className={active ? 'text-amber-400' : 'text-stone-700'} size={24} />
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {Number(ratingState.ratingValue) > 0 ? `${ratingState.ratingValue} star selected` : 'No rating selected'}
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-400">Review</label>
            <textarea
              className="pnf-input"
              rows={3}
              placeholder="Optional feedback"
              value={ratingState.reviewText}
              onChange={(e) => setRatingState((prev) => ({ ...prev, reviewText: e.target.value }))}
            />
          </div>
        </div>
      </GlassModal>
    </div>
  );
};

export default OwnerRequestDetailsPage;
