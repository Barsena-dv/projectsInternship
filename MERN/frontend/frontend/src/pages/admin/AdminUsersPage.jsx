import { useState } from 'react';
import { toast } from 'react-toastify';
import ComingSoon from '../../components/common/ComingSoon';
import PageHeader from '../../components/common/PageHeader';
import { adminApi } from '../../services/api';
import { USER_STATUSES } from '../../utils/constants';
import { getErrorMessage } from '../../utils/helpers';

const AdminUsersPage = () => {
  const [form, setForm] = useState({ userId: '', status: 'active', isApproved: true });
  const [loading, setLoading] = useState(false);

  const verifyFinder = async () => {
    if (!form.userId) return;
    try {
      setLoading(true);
      await adminApi.verifyFinder(form.userId, form.isApproved);
      toast.success(`Finder ${form.isApproved ? 'verified' : 'rejected'} successfully`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async () => {
    if (!form.userId) return;
    try {
      setLoading(true);
      await adminApi.updateUserStatus(form.userId, form.status);
      toast.success('User status updated');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Users Management" subtitle="Verify finder accounts and update user status" />

      <ComingSoon
        title="Users list endpoint is not exposed under current backend app routes"
        description="Admin actions are fully wired. Provide a userId below to verify finder or update status."
      />

      <section className="pnf-card mt-4 grid gap-3 p-5 md:grid-cols-3">
        <input
          className="pnf-input"
          placeholder="User ID"
          value={form.userId}
          onChange={(e) => setForm((prev) => ({ ...prev, userId: e.target.value }))}
        />

        <select className="pnf-input" value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}>
          {USER_STATUSES.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>

        <select className="pnf-input" value={String(form.isApproved)} onChange={(e) => setForm((prev) => ({ ...prev, isApproved: e.target.value === 'true' }))}>
          <option value="true">Finder Verification: Approve</option>
          <option value="false">Finder Verification: Reject</option>
        </select>

        <button className="pnf-btn-outline rounded-lg px-3 py-2 text-sm" type="button" onClick={verifyFinder} disabled={loading}>
          Verify Finder
        </button>

        <button className="pnf-btn-primary rounded-lg px-3 py-2 text-sm" type="button" onClick={updateStatus} disabled={loading}>
          Update Status
        </button>
      </section>
    </div>
  );
};

export default AdminUsersPage;
