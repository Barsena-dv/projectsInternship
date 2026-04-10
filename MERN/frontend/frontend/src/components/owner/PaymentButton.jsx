import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { paymentApi, requestApi } from '../../services/api';
import { getErrorMessage } from '../../utils/helpers';
import GlassModal from '../common/GlassModal';

const PaymentButton = ({ request, onSuccess }) => {
  const defaultAmount = useMemo(() => {
    const plan = request?.planId || {};
    const planFee = Number(plan.price || plan.amount || 0);
    const reward = Number(request?.rewardAmount || 0);
    return Number(planFee + reward || 100);
  }, [request]);

  const [amount, setAmount] = useState(defaultAmount);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handlePay = async () => {
    try {
      setLoading(true);
      if (String(request?.requestStatus || '').toLowerCase() === 'draft') {
        await requestApi.publish(request._id);
      }

      const servicePlanId = request?.planId?._id || request?.planId;

      const createRes = await paymentApi.create({
        requestId: request._id,
        servicePlanId,
        amount: Number(amount),
        paymentMethod,
      });

      const paymentId = createRes?.data?._id;
      const transactionId = `txn_${Date.now()}`;

      await paymentApi.process(paymentId, transactionId);
      toast.success('Payment successful. Request is now published and open for finders.');
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
        <p className="text-sm font-medium text-slate-800">Complete payment to publish this request.</p>
        <button className="pnf-btn-primary mt-3 rounded-lg px-4 py-2 text-sm" onClick={() => setOpen(true)} type="button" disabled={loading}>
          Pay Now
        </button>
      </div>

      <GlassModal
        open={open}
        title="Complete Payment"
        subtitle="Use this secure flow to publish your request."
        onClose={() => setOpen(false)}
        onConfirm={handlePay}
        confirmText="Pay & Publish"
        loading={loading}
      >
        <div className="grid gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Amount</label>
            <input
              className="pnf-input"
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Payment Method</label>
            <select className="pnf-input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="upi">UPI</option>
              <option value="wallet">Wallet</option>
              <option value="credit_card">Credit Card</option>
              <option value="debit_card">Debit Card</option>
            </select>
          </div>
        </div>
      </GlassModal>
    </>
  );
};

export default PaymentButton;
