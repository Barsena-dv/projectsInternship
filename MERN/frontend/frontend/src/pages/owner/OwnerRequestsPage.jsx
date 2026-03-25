import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import EmptyState from '../../components/common/EmptyState';
import GlassModal from '../../components/common/GlassModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import RequestCard from '../../components/owner/RequestCard';
import { assignmentApi, evidenceApi, notificationApi, paymentApi, requestApi } from '../../services/api';
import { getErrorMessage } from '../../utils/helpers';
import { deriveOwnerLifecycleState } from '../../utils/requestLifecycle';

const getId = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value._id) return value._id;
  return null;
};

const OwnerRequestsPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await requestApi.my();
        const requests = res.data || [];

        const [paymentsRes, notificationsRes, assignmentEntries] = await Promise.all([
          paymentApi.my().catch(() => ({ data: [] })),
          notificationApi.my({ limit: 200, unreadOnly: true }).catch(() => ({ data: [] })),
          Promise.all(
            requests.map(async (request) => {
              try {
                const assignmentRes = await assignmentApi.byRequest(request._id);
                return [request._id, assignmentRes.data || null];
              } catch {
                return [request._id, null];
              }
            })
          )
        ]);

        const assignmentByRequestId = Object.fromEntries(assignmentEntries);
        const requestByAssignmentId = assignmentEntries.reduce((acc, [requestId, assignment]) => {
          if (assignment?._id) acc[assignment._id] = requestId;
          return acc;
        }, {});

        const assignmentIds = Object.keys(requestByAssignmentId);
        const evidenceEntries = await Promise.all(
          assignmentIds.map(async (assignmentId) => {
            try {
              const evidenceRes = await evidenceApi.byAssignment(assignmentId);
              return [assignmentId, evidenceRes.data || null];
            } catch {
              return [assignmentId, null];
            }
          })
        );
        const evidenceByAssignmentId = Object.fromEntries(evidenceEntries);

        const payments = paymentsRes.data || [];
        const paymentByRequestId = payments.reduce((acc, payment) => {
          const requestId = getId(payment.requestId);
          if (!requestId) return acc;
          const existing = acc[requestId];
          if (!existing) {
            acc[requestId] = payment;
            return acc;
          }

          const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
          const currentTime = new Date(payment.updatedAt || payment.createdAt || 0).getTime();
          if (currentTime >= existingTime) acc[requestId] = payment;
          return acc;
        }, {});

        const unreadNotifications = notificationsRes.data || [];
        const alertsByRequestId = unreadNotifications.reduce((acc, notification) => {
          const type = String(notification.notificationType || notification.type || '').toLowerCase();
          const directRequestId = getId(notification.requestId || notification.data?.requestId);
          const assignmentId = getId(notification.assignmentId || notification.data?.assignmentId);
          const requestId = directRequestId || (assignmentId ? requestByAssignmentId[assignmentId] : null);
          if (!requestId) return acc;

          const current = acc[requestId] || { newEvidence: false, newApplicant: false, newMessage: false };
          if (type.includes('evidence')) current.newEvidence = true;
          if (type.includes('finder') || type.includes('applicant')) current.newApplicant = true;
          if (type.includes('message') || type.includes('chat')) current.newMessage = true;

          acc[requestId] = current;
          return acc;
        }, {});

        const enriched = requests.map((request) => {
          const assignment = assignmentByRequestId[request._id] || null;
          const payment = paymentByRequestId[request._id] || null;
          const evidence = assignment?._id ? evidenceByAssignmentId[assignment._id] || null : null;
          const lifecycleState = deriveOwnerLifecycleState({
            request,
            payment,
            assignment,
            evidence
          });

          return {
            ...request,
            _lifecycleState: lifecycleState,
            _alerts: alertsByRequestId[request._id] || { newEvidence: false, newApplicant: false, newMessage: false }
          };
        });

        setItems(enriched);
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleEdit = (request) => {
    navigate(`/owner/requests/${request._id}`);
  };

  const handleDelete = async (request) => {
    setDeleteTarget(request);
  };

  const confirmDelete = async () => {
    if (!deleteTarget?._id) return;

    try {
      setDeleteLoading(true);
      await requestApi.remove(deleteTarget._id);
      setItems((prev) => prev.filter((item) => item._id !== deleteTarget._id));
      toast.success('Draft deleted successfully.');
      setDeleteTarget(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handlePay = (request) => {
    navigate(`/owner/requests/${request._id}`);
  };

  const handleViewApplicants = (request) => {
    navigate(`/owner/requests/${request._id}`);
  };

  return (
    <div>
      <PageHeader title="My Requests" subtitle="Track pending, open, assigned, and completed requests" />

      {loading ? <LoadingSpinner text="Loading requests..." /> : null}

      {!loading && items.length === 0 ? (
        <EmptyState title="No requests available" description="Create a request to start the workflow." />
      ) : null}

      {!loading && items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <RequestCard
              key={item._id}
              request={item}
              lifecycleState={item._lifecycleState}
              alerts={item._alerts}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onPay={handlePay}
              onViewApplicants={handleViewApplicants}
            />
          ))}
        </div>
      ) : null}

      <GlassModal
        open={Boolean(deleteTarget)}
        title="Delete Draft Request?"
        subtitle="This action will cancel the draft and remove it from your list."
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        confirmText="Delete Draft"
        confirmClassName="rounded-lg border border-rose-600 bg-rose-600 text-white"
        loading={deleteLoading}
      >
        <div className="pnf-glass-soft rounded-xl p-3 text-sm text-slate-700">
          <p><span className="font-medium">Item:</span> {deleteTarget?.itemName || '-'}</p>
          <p><span className="font-medium">Category:</span> {deleteTarget?.itemCategory || '-'}</p>
        </div>
      </GlassModal>
    </div>
  );
};

export default OwnerRequestsPage;
