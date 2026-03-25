import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import RequestForm from '../../components/owner/RequestForm';
import { paymentApi, planApi, requestApi } from '../../services/api';
import { formatCurrency } from '../../utils/helpers';
import { getErrorMessage } from '../../utils/helpers';

const OwnerCreateRequestPage = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [planLoading, setPlanLoading] = useState(true);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const res = await planApi.getAll();
        setPlans(res.data || []);
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setPlanLoading(false);
      }
    };

    loadPlans();
  }, []);

  const getPlanAmount = (planId) => {
    const plan = plans.find((item) => String(item._id) === String(planId));
    if (!plan) return 100;
    return Number(plan.price || plan.amount || plan.rewardAmount || 100);
  };

  const handleSubmit = async (values, intent) => {
    setLoading(true);

    try {
      const payload = {
        itemName: values.itemName,
        itemCategory: values.itemCategory,
        itemDescription: values.description,
        brand: values.brand || undefined,
        model: values.model || undefined,
        color: values.color || undefined,
        uniqueIdentifiers: values.uniqueIdentifiers || undefined,
        serialNumber: values.serialNumber || undefined,
        lastSeenLocation: values.lastSeenLocation,
        lastSeenLat: Number(values.lastSeenLat),
        lastSeenLng: Number(values.lastSeenLng),
        lastSeenDatetime: values.lastSeenDatetime || undefined,
        serviceDeadline: values.serviceDeadline || undefined,
        planId: values.servicePlanId,
      };

      const requestRes = await requestApi.create(payload);
      const createdRequest = requestRes?.data;

      if (intent === 'pay_now') {
        const amount = getPlanAmount(values.servicePlanId);
        const paymentMethod = values.paymentMethod || 'upi';

        const paymentRes = await paymentApi.create({
          requestId: createdRequest?._id,
          servicePlanId: values.servicePlanId,
          amount,
          paymentMethod,
        });

        const paymentId = paymentRes?.data?._id;
        const transactionId = `txn_${Date.now()}`;
        await paymentApi.process(paymentId, transactionId);
        toast.success(`Request is live. Payment locked: ${formatCurrency(amount)}`);
      } else {
        toast.success('Request saved as draft');
      }

      navigate('/owner/requests');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (planLoading) return <LoadingSpinner text="Loading plans..." />;

  return (
    <div>
      <PageHeader title="Create Request" subtitle="Post lost item details for finders" />
      <RequestForm plans={plans} loading={loading} onSubmit={handleSubmit} />
    </div>
  );
};

export default OwnerCreateRequestPage;
