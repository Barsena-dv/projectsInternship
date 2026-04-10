import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiRotateCcw, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';
import EmptyState from '../../components/common/EmptyState';
import GlassModal from '../../components/common/GlassModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { adminApi } from '../../services/api';
import { formatCurrency, formatDate, getErrorMessage } from '../../utils/helpers';

const AdminRefundsPage = () => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState({ open: false, paymentId: '', reason: '' });

  const loadRows = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.payments({ limit: 120 });
      setRows(res?.data?.rows || []);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (!['pending', 'locked', 'refunded'].includes(String(row.paymentStatus || '').toLowerCase())) return false;
      if (!q) return true;
      return String(row?.request?.itemName || '').toLowerCase().includes(q)
        || String(row?.owner?.full_name || '').toLowerCase().includes(q)
        || String(row?._id || '').toLowerCase().includes(q);
    });
  }, [rows, query]);

  const executeRefund = async () => {
    try {
      if (!modal.paymentId) return;
      await adminApi.refundPayment(modal.paymentId, { reason: modal.reason || 'Admin refund management action' });
      toast.success('Refund processed successfully.');
      setModal({ open: false, paymentId: '', reason: '' });
      await loadRows();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const totalRefunded = rows
    .filter((row) => String(row.paymentStatus) === 'refunded')
    .reduce((sum, row) => sum + Number(row.refundAmount || row.amount || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Refund Management"
        subtitle="Control refund decisions, monitor refund exposure, and enforce reversible transaction governance"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <article className="admin-card">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Refund Candidates</p>
          <p className="text-3xl text-amber-400 font-black mt-2">{filtered.filter((r) => r.paymentStatus !== 'refunded').length}</p>
        </article>
        <article className="admin-card">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Refunded Count</p>
          <p className="text-3xl text-indigo-400 font-black mt-2">{rows.filter((r) => r.paymentStatus === 'refunded').length}</p>
        </article>
        <article className="admin-card">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Refunded Amount</p>
          <p className="text-3xl text-rose-400 font-black mt-2">{formatCurrency(totalRefunded)}</p>
        </article>
      </div>

      <article className="admin-card p-4">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Refund Queue</h3>
          <div className="relative w-72">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-indigo-500/40"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search request or owner"
            />
          </div>
        </div>

        {loading ? <LoadingSpinner /> : null}
        {!loading && filtered.length === 0 ? <EmptyState title="No refund rows" description="No matching transactions in the refund module." /> : null}

        {!loading && filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Request</th>
                  <th>Owner</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row._id}>
                    <td className="text-xs font-bold text-white">{row?.request?.itemName || '-'}</td>
                    <td className="text-xs text-slate-300">{row?.owner?.full_name || '-'}</td>
                    <td className="text-xs text-slate-300">{formatCurrency(row.amount)}</td>
                    <td><StatusBadge value={row.paymentStatus} /></td>
                    <td className="text-xs text-slate-500">{formatDate(row.createdAt)}</td>
                    <td>
                      {row.paymentStatus !== 'refunded' ? (
                        <button
                          type="button"
                          onClick={() => setModal({ open: true, paymentId: row._id, reason: '' })}
                          className="px-3 py-1 rounded-lg text-[10px] uppercase tracking-widest font-black bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center gap-1"
                        >
                          <FiRotateCcw /> Refund
                        </button>
                      ) : (
                        <span className="text-[10px] text-emerald-400 uppercase font-black tracking-widest">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </article>

      <GlassModal
        open={modal.open}
        onClose={() => setModal({ open: false, paymentId: '', reason: '' })}
        onConfirm={executeRefund}
        title="Process Refund"
        subtitle="A refund will move funds back to the owner and update settlement timelines."
        confirmText="Confirm Refund"
      >
        <textarea
          className="w-full min-h-28 bg-slate-900/80 border border-white/10 rounded-xl p-3 text-sm text-white outline-none"
          value={modal.reason}
          onChange={(event) => setModal((prev) => ({ ...prev, reason: event.target.value }))}
          placeholder="Add a clear audit reason for this refund decision..."
        />
      </GlassModal>
    </div>
  );
};

export default AdminRefundsPage;
