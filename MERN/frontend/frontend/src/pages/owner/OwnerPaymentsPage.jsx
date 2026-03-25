import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import EmptyState from '../../components/common/EmptyState';
import GlassModal from '../../components/common/GlassModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { paymentApi, planApi, requestApi } from '../../services/api';
import { formatCurrency, formatDate, getErrorMessage } from '../../utils/helpers';

const OwnerPaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [createForm, setCreateForm] = useState({ requestId: '', servicePlanId: '', amount: '', paymentMethod: 'upi' });
  const [processState, setProcessState] = useState({ open: false, paymentId: '', transactionId: '' });
  const [releaseState, setReleaseState] = useState({ open: false, paymentId: '', reason: '' });

  const loadData = async () => {
    try {
      setLoading(true);
      const [paymentRes, requestRes, planRes] = await Promise.all([
        paymentApi.my(),
        requestApi.my(),
        planApi.getAll(),
      ]);

      const reqData = requestRes.data || [];
      const planData = planRes.data || [];

      setPayments(paymentRes.data || []);
      setRequests(reqData);
      setPlans(planData);

      setCreateForm((prev) => ({
        ...prev,
        requestId: prev.requestId || reqData.find((r) => r.requestStatus === 'pending_payment')?._id || '',
        servicePlanId: prev.servicePlanId || planData[0]?._id || '',
      }));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const createPayment = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await paymentApi.create({
        ...createForm,
        amount: Number(createForm.amount || 0),
      });
      toast.success('Payment record created');
      await loadData();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActionLoading(false);
    }
  };

  const processPayment = async (paymentId) => {
    setProcessState({ open: true, paymentId, transactionId: `txn_${Date.now()}` });
  };

  const submitProcessPayment = async () => {
    const { paymentId, transactionId } = processState;
    if (!paymentId || !transactionId) {
      toast.error('Transaction ID is required.');
      return;
    }

    try {
      setActionLoading(true);
      await paymentApi.process(paymentId, transactionId);
      toast.success('Payment processed and locked in escrow');
      setProcessState({ open: false, paymentId: '', transactionId: '' });
      await loadData();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActionLoading(false);
    }
  };

  const releasePayment = async (paymentId) => {
    setReleaseState({ open: true, paymentId, reason: '' });
  };

  const submitReleasePayment = async () => {
    const { paymentId, reason } = releaseState;
    if (!paymentId) return;

    try {
      setActionLoading(true);
      await paymentApi.release(paymentId, reason);
      toast.success('Payment released successfully');
      setReleaseState({ open: false, paymentId: '', reason: '' });
      await loadData();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActionLoading(false);
    }
  };

  const pendingRequests = requests.filter((r) => r.requestStatus === 'pending_payment');

  return (
    <div>
      <PageHeader title="Payments" subtitle="Create, process, and release payments through the lifecycle" />

      {loading ? <LoadingSpinner text="Loading payments..." /> : null}

      {!loading ? (
        <section className="pnf-card mb-4 p-5">
          <h2 className="text-lg font-semibold text-slate-900">Create Payment Record</h2>
          <form className="mt-3 grid gap-3 md:grid-cols-4" onSubmit={createPayment}>
            <select className="pnf-input" value={createForm.requestId} onChange={(e) => setCreateForm((prev) => ({ ...prev, requestId: e.target.value }))} required>
              <option value="">Select Request</option>
              {pendingRequests.map((r) => (
                <option key={r._id} value={r._id}>{r.itemName}</option>
              ))}
            </select>

            <select className="pnf-input" value={createForm.servicePlanId} onChange={(e) => setCreateForm((prev) => ({ ...prev, servicePlanId: e.target.value }))} required>
              <option value="">Select Plan</option>
              {plans.map((plan) => (
                <option key={plan._id} value={plan._id}>{plan.planName}</option>
              ))}
            </select>

            <input className="pnf-input" placeholder="Amount" type="number" value={createForm.amount} onChange={(e) => setCreateForm((prev) => ({ ...prev, amount: e.target.value }))} required />

            <button className="pnf-btn-primary rounded-lg px-3 py-2 text-sm" type="submit" disabled={actionLoading}>
              Create
            </button>
          </form>
        </section>
      ) : null}

      {!loading && payments.length === 0 ? <EmptyState title="No payments found" description="Create a payment record for pending requests." /> : null}

      {!loading && payments.length > 0 ? (
        <div className="space-y-3">
          {payments.map((payment) => (
            <article key={payment._id} className="pnf-card p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">{payment.request?.itemName || 'Request'}</h3>
                  <p className="text-sm text-slate-600">{formatCurrency(payment.amount)} • {formatDate(payment.createdAt)}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge value={payment.paymentStatus} />
                  {payment.paymentStatus === 'pending' ? (
                    <button className="pnf-btn-outline rounded-lg px-3 py-1.5 text-xs" type="button" onClick={() => processPayment(payment._id)} disabled={actionLoading}>
                      Process
                    </button>
                  ) : null}
                  {payment.paymentStatus === 'locked' ? (
                    <button className="pnf-btn-primary rounded-lg px-3 py-1.5 text-xs" type="button" onClick={() => releasePayment(payment._id)} disabled={actionLoading}>
                      Release
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <GlassModal
        open={processState.open}
        title="Process Payment"
        subtitle="Enter a transaction reference to lock this payment in escrow."
        onClose={() => setProcessState({ open: false, paymentId: '', transactionId: '' })}
        onConfirm={submitProcessPayment}
        confirmText="Process"
        loading={actionLoading}
      >
        <label className="mb-1 block text-sm font-medium text-slate-700">Transaction ID</label>
        <input
          className="pnf-input"
          value={processState.transactionId}
          onChange={(e) => setProcessState((prev) => ({ ...prev, transactionId: e.target.value }))}
          placeholder="txn_xxx"
        />
      </GlassModal>

      <GlassModal
        open={releaseState.open}
        title="Release Payment"
        subtitle="Add an optional reason for releasing this payment."
        onClose={() => setReleaseState({ open: false, paymentId: '', reason: '' })}
        onConfirm={submitReleasePayment}
        confirmText="Release"
        loading={actionLoading}
      >
        <label className="mb-1 block text-sm font-medium text-slate-700">Reason</label>
        <textarea
          className="pnf-input"
          rows={3}
          value={releaseState.reason}
          onChange={(e) => setReleaseState((prev) => ({ ...prev, reason: e.target.value }))}
          placeholder="Optional release note"
        />
      </GlassModal>
    </div>
  );
};

export default OwnerPaymentsPage;
