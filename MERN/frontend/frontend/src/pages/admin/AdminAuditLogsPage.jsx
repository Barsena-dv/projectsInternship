import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import { auditApi } from '../../services/api';
import { formatDate, getErrorMessage } from '../../utils/helpers';

const AdminAuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await auditApi.logs({ page: 1, limit: 50 });
        setLogs(res.data?.logs || []);
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div>
      <PageHeader title="Audit Logs" subtitle="Optional monitoring UI for platform-level actions" />

      {loading ? <LoadingSpinner text="Loading logs..." /> : null}

      {!loading && logs.length === 0 ? <EmptyState title="No logs found" description="No audit records available." /> : null}

      {!loading && logs.length > 0 ? (
        <section className="pnf-card overflow-x-auto p-4">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="px-2 py-2">Action</th>
                <th className="px-2 py-2">Entity</th>
                <th className="px-2 py-2">User</th>
                <th className="px-2 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr className="border-t border-slate-200" key={log._id}>
                  <td className="px-2 py-2 font-medium text-slate-800">{log.action}</td>
                  <td className="px-2 py-2 text-slate-600">{log.entityType}</td>
                  <td className="px-2 py-2 text-slate-600">{log.user?.full_name || '-'}</td>
                  <td className="px-2 py-2 text-slate-600">{formatDate(log.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </div>
  );
};

export default AdminAuditLogsPage;
