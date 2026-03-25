import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import EmptyState from '../../components/common/EmptyState';
import GlassModal from '../../components/common/GlassModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import RequestDetails from '../../components/owner/RequestDetails';
import { assignmentApi, evidenceApi, paymentApi, ratingApi, requestApi, trackingApi } from '../../services/api';
import { getErrorMessage } from '../../utils/helpers';

const OwnerRequestDetailsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [request, setRequest] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [payment, setPayment] = useState(null);
  const [evidence, setEvidence] = useState(null);
  const [applications, setApplications] = useState([]);
  const [trackingUpdates, setTrackingUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyState, setVerifyState] = useState({ open: false, verified: true, notes: '' });
  const [releaseState, setReleaseState] = useState({ open: false, reason: '' });
  const [applicationDecisionState, setApplicationDecisionState] = useState({
    open: false,
    decision: 'accepted',
    reason: '',
    application: null,
  });
  const [ratingState, setRatingState] = useState({ open: false, ratingValue: 5, reviewText: '' });
  const [modalLoading, setModalLoading] = useState(false);

  const loadDetails = async () => {
    try {
      setLoading(true);
      const requestRes = await requestApi.byId(id);
      const requestData = requestRes.data;
      setRequest(requestData);

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

      if (['assigned', 'found', 'completed'].includes(requestData?.requestStatus)) {
        try {
          const assignmentRes = await assignmentApi.byRequest(id);
          const assignmentData = assignmentRes.data || null;
          setAssignment(assignmentData);

          if (assignmentData?._id) {
            const [evidenceRes, trackingRes] = await Promise.all([
              evidenceApi.byAssignment(assignmentData._id).catch(() => ({ data: null })),
              trackingApi.byAssignment(assignmentData._id).catch(() => ({ data: [] }))
            ]);

            setEvidence(evidenceRes.data || null);
            setTrackingUpdates(trackingRes.data || []);
          } else {
            setEvidence(null);
            setTrackingUpdates([]);
          }
        } catch {
          setAssignment(null);
          setEvidence(null);
          setTrackingUpdates([]);
        }
      } else {
        setAssignment(null);
        setEvidence(null);
        setTrackingUpdates([]);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [id]);

  const handleVerifyEvidence = async (verified) => {
    if (!evidence?._id) return;
    setVerifyState({ open: true, verified, notes: '' });
  };

  const submitVerifyEvidence = async () => {
    if (!evidence?._id) return;
    const { verified, notes } = verifyState;

    try {
      setModalLoading(true);
      await evidenceApi.verify(evidence._id, { verified, notes });
      toast.success(verified ? 'Evidence verified successfully.' : 'Evidence rejected successfully.');
      setVerifyState({ open: false, verified: true, notes: '' });
      await loadDetails();
    } catch (error) {
      toast.error(getErrorMessage(error));
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

  const submitApplicationDecision = async () => {
    const target = applicationDecisionState.application;
    if (!target?._id || !request?._id) return;

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

    setRatingState({ open: true, ratingValue: 5, reviewText: '' });
  };

  const submitRating = async () => {
    if (!assignment?._id) return;

    const ratingValue = Number(ratingState.ratingValue);
    if (Number.isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      toast.error('Rating must be between 1 and 5.');
      return;
    }

    try {
      setModalLoading(true);
      await ratingApi.create({ assignmentId: assignment._id, ratingValue, reviewText: ratingState.reviewText });
      toast.success('Rating submitted successfully.');
      setRatingState({ open: false, ratingValue: 5, reviewText: '' });
      navigate('/owner/ratings');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setModalLoading(false);
    }
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
        trackingUpdates={trackingUpdates}
        onPaymentSuccess={loadDetails}
        onVerifyEvidence={handleVerifyEvidence}
        onReleasePayment={handleReleasePayment}
        onApplicationDecision={handleApplicationDecision}
        onOpenChat={handleOpenChat}
        onRateFinder={handleRateFinder}
      />

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
        <div className="space-y-3 text-sm text-slate-700">
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
        open={ratingState.open}
        title="Rate Finder"
        subtitle="Share your experience for this completed request."
        onClose={() => setRatingState({ open: false, ratingValue: 5, reviewText: '' })}
        onConfirm={submitRating}
        confirmText="Submit Rating"
        loading={modalLoading}
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Rating (1-5)</label>
            <input
              className="pnf-input"
              type="number"
              min="1"
              max="5"
              value={ratingState.ratingValue}
              onChange={(e) => setRatingState((prev) => ({ ...prev, ratingValue: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Review</label>
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
