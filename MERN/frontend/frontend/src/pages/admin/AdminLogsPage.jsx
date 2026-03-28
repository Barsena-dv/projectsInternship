import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { adminApi } from '../../services/api';
import { formatDate, getErrorMessage } from '../../utils/helpers';
import { FiSearch, FiFilter, FiDownload, FiActivity, FiUser, FiGlobe, FiDatabase } from 'react-icons/fi';

const toCsv = (rows = []) => {
  if (!rows.length) return '';
  const keys = Object.keys(rows[0]);
  const header = keys.join(',');
  const lines = rows.map((row) => keys
    .map((key) => {
      const value = row[key] == null ? '' : String(row[key]);
      const escaped = value.replaceAll('"', '""');
      return `"${escaped}"`;
    })
    .join(','));

  return [header, ...lines].join('\n');
};

const downloadCsv = (filename, csvText) => {
  if (!csvText) {
    toast.info('No telemetry rows to export.');
    return;
  }
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const AdminLogsPage = () => {
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState([]);
  const [logSearch, setLogSearch] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = logSearch ? { search: logSearch, limit: 100 } : { limit: 100 };
      const res = await adminApi.auditLogs(params);
      setAuditLogs(res?.data?.logs || []);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [logSearch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const exportLogs = () => {
    const rows = auditLogs.map((log) => ({
      createdAt: formatDate(log.createdAt),
      action: log.action,
      entityType: log.entityType,
      user: log?.user?.full_name || '',
      email: log?.user?.email || '',
      details: JSON.stringify(log.details || {}),
    }));
    downloadCsv(`admin-audit-telem-${Date.now()}.csv`, toCsv(rows));
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Global Audit Telemetry" 
        subtitle="Unchangeable system-wide logs for activity tracking, security audits, and forensic reconstruction" 
        actions={(
          <button 
            onClick={exportLogs}
            className="px-4 py-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 transition-all font-bold text-xs uppercase tracking-widest flex items-center gap-2"
          >
            <FiDownload /> Export Registry
          </button>
        )}
      />

      <article className="admin-card flex flex-col h-[700px]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Historical System Stream</h3>
          <div className="relative w-72">
             <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
             <input 
               className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:border-indigo-500/50 outline-none transition-all"
               placeholder="Search by action, identity, or entity..."
               value={logSearch}
               onChange={(e) => setLogSearch(e.target.value)}
             />
          </div>
        </div>

        <div className="flex-1 overflow-x-auto custom-scrollbar">
          {loading ? (
             <div className="py-40 flex justify-center"><LoadingSpinner /></div>
          ) : auditLogs.length === 0 ? (
             <EmptyState title="No telemetry recorded" description="The system event stream is currently showing zero activity for this query." />
          ) : (
             <table className="admin-table">
               <thead>
                 <tr>
                    <th>Timestamp</th>
                    <th>Action Entity</th>
                    <th>Subject Entity</th>
                    <th>Origin Entity</th>
                    <th>Metadata Payload</th>
                 </tr>
               </thead>
               <tbody>
                 {auditLogs.map((log) => (
                    <tr key={log._id}>
                       <td className="text-xs font-bold text-slate-500">{formatDate(log.createdAt)}</td>
                       <td>
                          <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-500/10">
                             {log.action.replaceAll('_', ' ')}
                          </span>
                       </td>
                       <td>
                          <div className="flex items-center gap-2">
                             <FiDatabase className="text-slate-500" />
                             <span className="text-xs font-bold text-white uppercase">{log.entityType}</span>
                          </div>
                          <span className="text-[9px] text-slate-600 block font-mono">ID: {log.entityId?.slice(-6)}</span>
                       </td>
                       <td>
                          <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 uppercase text-[8px] font-black">
                                {log?.user?.full_name?.[0] || <FiGlobe />}
                             </div>
                             <div>
                                <span className="text-xs font-bold text-white block">{log?.user?.full_name || 'SYSTEM'}</span>
                                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{log?.user?.role || 'AUTO'}</span>
                             </div>
                          </div>
                       </td>
                       <td className="max-w-xs overflow-hidden text-ellipsis whitespace-nowrap text-[10px] text-slate-500 font-mono italic">
                          {JSON.stringify(log.details || {})}
                       </td>
                    </tr>
                 ))}
               </tbody>
             </table>
          )}
        </div>
      </article>
    </div>
  );
};

export default AdminLogsPage;
