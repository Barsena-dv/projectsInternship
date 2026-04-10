import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiDollarSign, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { adminApi } from '../../services/api';
import { formatCurrency, formatDate, getErrorMessage } from '../../utils/helpers';

const AdminPayoutsPage = () => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);

  const loadRows = useCallback(async () => {
    try {
      setLoading(true);
      const paymentsRes = await adminApi.payments({ status: 'released', limit: 120 });
      const payments = paymentsRes?.data?.rows || [];

      const detailsList = await Promise.all(
        payments.map(async (payment) => {
          try {
            const details = await adminApi.paymentDetails(payment._id);
            return details?.data || null;
          } catch {
            return null;
          }
        })
      );

      const mapped = detailsList
        .filter(Boolean)
        .map((details) => ({
          paymentId: details?.payment?._id,
          requestName: details?.payment?.request?.itemName || 'Unknown request',
          finder: details?.assignment?.finder?.full_name || '-',
          amount: details?.payment?.amount || 0,
          payout: details?.payout || null,
          releasedAt: details?.payment?.releasedAt,
          paymentStatus: details?.payment?.paymentStatus,
        }));

      setRows(mapped);
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
    if (!q) return rows;
    return rows.filter((row) => (
      String(row.requestName).toLowerCase().includes(q)
      || String(row.finder).toLowerCase().includes(q)
      || String(row.paymentId).toLowerCase().includes(q)
    ));
  }, [rows, query]);

  const pendingValue = rows
    .filter((row) => !row.payout || row.payout?.payoutStatus === 'pending')
    .reduce((sum, row) => sum + Number(row.amount || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payout Management"
        subtitle="Control finder settlements derived from released payments and monitor payout processing states"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <article className="admin-card">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Payout Rows</p>
          <p className="text-3xl text-white font-black mt-2">{rows.length}</p>
        </article>
        <article className="admin-card border-amber-500/20">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Pending Payout Value</p>
          <p className="text-3xl text-amber-400 font-black mt-2">{formatCurrency(pendingValue)}</p>
        </article>
        <article className="admin-card border-emerald-500/20">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Processed Payouts</p>
          <p className="text-3xl text-emerald-400 font-black mt-2">{rows.filter((row) => row.payout?.payoutStatus === 'processed').length}</p>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <article className="admin-card h-162.5 flex flex-col">
          <div className="flex items-center justify-between mb-4 gap-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Payout Registry</h3>
            <div className="relative w-72">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-indigo-500/40"
                placeholder="Search payout rows"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
            {loading ? <LoadingSpinner /> : null}
            {!loading && filtered.length === 0 ? <EmptyState title="No payout rows" description="No released payments mapped to payout rows." /> : null}
            {!loading && filtered.map((row) => (
              <button
                key={row.paymentId}
                type="button"
                onClick={() => setSelected(row)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${selected?.paymentId === row.paymentId ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-white/5 border-white/5 hover:bg-white/8'}`}
              >
                <div className="flex justify-between items-center gap-3">
                  <p className="text-sm text-white font-black uppercase tracking-wide truncate">{row.requestName}</p>
                  <StatusBadge value={row.payout?.payoutStatus || 'pending'} />
                </div>
                <p className="text-xs text-slate-300 mt-1">Finder: {row.finder}</p>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-3">{formatCurrency(row.amount)}</p>
              </button>
            ))}
          </div>
        </article>

        <article className="admin-card h-162.5 flex flex-col">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Payout Detail</h3>
          {!selected ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState title="Select a payout row" description="Choose a payment-linked payout to inspect transaction state." />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Request</p>
                <p className="text-sm font-black text-white mt-1">{selected.requestName}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Payout Status</p>
                  <StatusBadge value={selected.payout?.payoutStatus || 'pending'} />
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Amount</p>
                  <p className="text-xl font-black text-emerald-400">{formatCurrency(selected.amount)}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Released At</p>
                  <p className="text-xs text-slate-300">{formatDate(selected.releasedAt)}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Finder</p>
                  <p className="text-xs text-slate-300">{selected.finder}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20">
                <h4 className="text-xs uppercase tracking-widest font-black text-indigo-300 mb-2 flex items-center gap-2">
                  <FiDollarSign /> Payout Operations
                </h4>
                <p className="text-xs text-slate-300">
                  This module tracks payout lifecycle directly from released payments and payout records. Payout creation is automated by payment release and dispute workflows on the backend.
                </p>
              </div>
            </div>
          )}
        </article>
      </div>
    </div>
  );
};

export default AdminPayoutsPage;
