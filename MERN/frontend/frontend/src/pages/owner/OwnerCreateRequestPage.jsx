import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import RequestForm from '../../components/owner/RequestForm';
import { paymentApi, planApi, requestApi } from '../../services/api';
import '../../styles/owner/dashboard.css';
import { formatCurrency, getErrorMessage } from '../../utils/helpers';

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


  const handleSubmit = async (values, intent) => {
    setLoading(true);

    try {
      const payload = {
        intent: intent === 'pay_now' ? 'publish' : 'draft',
        itemName: values.itemName,
        itemCategory: values.itemCategory,
        itemDescription: values.description,
        brand: values.brand || undefined,
        model: values.model || undefined,
        color: values.color || undefined,
        uniqueIdentifiers: values.uniqueIdentifiers || undefined,
        serialNumber: values.serialNumber || undefined,
        lastSeenLocation: values.lastSeenLocation,
        lastSeenLat: values.lastSeenLat === '' ? undefined : Number(values.lastSeenLat),
        lastSeenLng: values.lastSeenLng === '' ? undefined : Number(values.lastSeenLng),
        lastSeenDatetime: values.lastSeenDatetime || undefined,
        serviceDeadline: values.serviceDeadline || undefined,
        planId: values.servicePlanId || undefined,
        rewardAmount: values.rewardAmount === '' ? undefined : Number(values.rewardAmount),
      };

      const requestRes = await requestApi.create(payload);
      const createdRequest = requestRes?.data;

      if (intent === 'pay_now') {
        const plan = plans.find((p) => String(p._id) === String(values.servicePlanId));
        const planFee = Number(plan?.price || 0);
        const rewardAmount = Number(values.rewardAmount || 0);
        const totalAmount = planFee + rewardAmount;
        
        const paymentMethod = values.paymentMethod || 'upi';

        const paymentRes = await paymentApi.create({
          requestId: createdRequest?._id,
          servicePlanId: values.servicePlanId,
          amount: totalAmount,
          paymentMethod,
        });

        const paymentId = paymentRes?.data?._id;
        const transactionId = `txn_${Date.now()}`;
        await paymentApi.process(paymentId, transactionId);
        toast.success(`Request is live. Payment locked: ${formatCurrency(totalAmount)}`);
      } else {
        toast.success('Draft saved. Complete details and payment when ready.');
      }

      navigate('/owner/requests');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (planLoading) return <LoadingSpinner text="Assembling service plans..." />;

  return (
    <div className="owner-page-enter">
      <PageHeader 
        title="Create New Request" 
        subtitle="Provide item details to help finders identify and recover your property" 
      />
      <div className="max-w-5xl mx-auto mt-6">
        <RequestForm plans={plans} loading={loading} onSubmit={handleSubmit} />
      </div>
    </div>
  );
};

export default OwnerCreateRequestPage;
