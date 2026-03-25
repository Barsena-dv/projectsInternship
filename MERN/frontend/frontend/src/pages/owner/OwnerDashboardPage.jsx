import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { requestApi } from '../../services/api';
import { getErrorMessage } from '../../utils/helpers';

const OwnerDashboardPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await requestApi.my();
        setRequests(response.data || []);
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const stats = useMemo(() => {
    const totalRequests = requests.length;
    const activeAssignments = requests.filter((item) => item.requestStatus === 'assigned').length;
    const completedRequests = requests.filter((item) => item.requestStatus === 'completed').length;

    return { totalRequests, activeAssignments, completedRequests };
  }, [requests]);

  return (
    <div>
      <PageHeader title="Owner Dashboard" subtitle="Overview of request and payment lifecycle" />

      {loading ? <LoadingSpinner text="Loading dashboard..." /> : null}

      {!loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Total Requests" value={stats.totalRequests} />
          <StatCard title="Active Assignments" value={stats.activeAssignments} />
          <StatCard title="Completed Requests" value={stats.completedRequests} />
        </div>
      ) : null}
    </div>
  );
};

export default OwnerDashboardPage;
