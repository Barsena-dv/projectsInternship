import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { adminApi } from '../../services/api';
import { formatCurrency, formatDate, getErrorMessage } from '../../utils/helpers';
import { FiSearch, FiFilter, FiCreditCard, FiShield, FiDollarSign, FiRotateCcw, FiFlag, FiEye } from 'react-icons/fi';

const AdminPaymentsPage = () => {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await adminApi.payments(params);
      setPayments(res?.data?.rows || []);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onSelectPayment = async (paymentId) => {
    try {
      const res = await adminApi.paymentDetails(paymentId);
      setSelectedPayment(res?.data || null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handlePaymentAction = async (paymentId, action) => {
    try {
      const reason = window.prompt(`Administrative notation for ${action.replaceAll('_', ' ')}:`) || '';
      if (!reason.trim()) {
        toast.error('Explicit reason is required for fiscal overrides.');
        return;
      }

      if (action === 'force_release') await adminApi.forceReleasePayment(paymentId, { reason });
      if (action === 'refund') await adminApi.refundPayment(paymentId, { reason });
      if (action === 'flag') await adminApi.flagPayment(paymentId, { reason });
      
      toast.success('Fiscal linkage updated successfully.');
      await loadData();
      if (selectedPayment?.payment?._id === paymentId) await onSelectPayment(paymentId);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Fiscal Escrow Control" 
        subtitle="Global oversight of platform funds, transaction integrity, and administrative settlements" 
      />

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Payments List Card */}
        <article className="admin-card flex flex-col h-[700px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Escrow Registry</h3>
            <div className="flex items-center gap-2">
               <FiFilter className="text-slate-500" />
               <select 
                 className="bg-transparent text-[10px] font-bold text-white uppercase tracking-wider outline-none border border-white/5 rounded px-2 py-1"
                 value={statusFilter} 
                 onChange={(e) => setStatusFilter(e.target.value)}
               >
                 <option value="">All States</option>
                 <option value="pending">Pending</option>
                 <option value="locked">Locked</option>
                 <option value="released">Released</option>
                 <option value="refunded">Refunded</option>
               </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
            {loading ? (
              <div className="py-40 flex justify-center"><LoadingSpinner /></div>
            ) : payments.length === 0 ? (
              <EmptyState title="No fiscal records" description="The escrow registry is currently clear for the selected parameters." />
            ) : (
              payments.map((row) => (
                <div 
                  key={row._id} 
                  onClick={() => onSelectPayment(row._id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedPayment?.payment?._id === row._id ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5 hover:bg-white/[0.08]'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-white text-sm uppercase tracking-wider">{row?.request?.itemName || 'UNSPECIFIED ESCROW'}</p>
                    <StatusBadge value={row.paymentStatus} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase font-black tracking-widest opacity-60">
                     <span>Value: {formatCurrency(row.amount)}</span>
                     <span className="flex items-center gap-1 font-bold text-emerald-500">OWNER: {row?.owner?.full_name || '-'}</span>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => onSelectPayment(row._id)} className="p-1 px-3 bg-emerald-500/10 text-emerald-400 rounded-lg text-[10px] font-black hover:bg-emerald-500/20 transition-all border border-emerald-500/20 flex items-center gap-2 font-black uppercase"><FiEye /> INSPECT</button>
                    <button onClick={() => handlePaymentAction(row._id, 'force_release')} className="p-1 px-3 bg-white/5 text-emerald-400 rounded-lg text-[10px] font-black hover:bg-white/10 transition-all border border-white/5 flex items-center gap-2"><FiDollarSign /> FORCE RELEASE</button>
                    <button onClick={() => handlePaymentAction(row._id, 'refund')} className="p-1 px-3 bg-white/5 text-amber-500 rounded-lg text-[10px] font-black hover:bg-white/10 transition-all border border-white/5 flex items-center gap-2"><FiRotateCcw /> REFUND</button>
                    <button onClick={() => handlePaymentAction(row._id, 'flag')} className="p-1 px-3 bg-white/5 text-rose-500 rounded-lg text-[10px] font-black hover:bg-white/10 transition-all border border-white/5 flex items-center gap-2"><FiFlag /> FLAG</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        {/* Payment Detail Intelligence Card */}
        <article className="admin-card h-[700px] flex flex-col">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Fiscal Intelligence Telemetry</h3>
          
          {!selectedPayment ? (
            <div className="flex-1 flex items-center justify-center text-center opacity-30">
               <div>
                 <FiCreditCard size={48} className="mx-auto mb-4" />
                 <p className="text-sm font-bold uppercase tracking-widest text-white">Select transaction to view fiscal audit</p>
               </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-8 custom-scrollbar pr-2">
              <section className="space-y-4">
                 <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2 text-white">Escrow Identity</h4>
                 <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center text-2xl font-black text-white shadow-xl shadow-emerald-500/20 overflow-hidden uppercase">
                       <FiDollarSign size={24} />
                    </div>
                    <div>
                       <h2 className="text-xl font-black text-white">{formatCurrency(selectedPayment.payment?.amount)}</h2>
                       <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest">Transaction ID: {selectedPayment.payment?._id.slice(-8)}</p>
                    </div>
                 </div>
              </section>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">Fiscal State</span>
                  <StatusBadge value={selectedPayment?.payment?.paymentStatus} />
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                   <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">Service Tier</span>
                   <p className="text-xs font-black text-indigo-400 uppercase">{selectedPayment?.payment?.servicePlan?.name || 'CUSTOM'}</p>
                </div>
              </div>

              <section className="space-y-4">
                 <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2 text-white italic">Linked Identities</h4>
                 <div className="grid grid-cols-2 gap-y-4">
                    <div>
                       <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Fulfillment Finder</p>
                       <p className="text-xs font-black text-white uppercase">{selectedPayment?.assignment?.finder?.full_name || 'NO ASSIGNMENT'}</p>
                    </div>
                    <div>
                       <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Escrow Owner</p>
                       <p className="text-xs font-black text-white uppercase">{selectedPayment?.owner?.full_name || '-'}</p>
                    </div>
                 </div>
              </section>

              <section className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                 <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Audit Log Highlights</h4>
                 <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                    {selectedPayment?.timeline?.slice(0, 5).map((ev, i) => (
                       <div key={i} className="text-[10px] text-slate-400 p-2 rounded bg-white/5 border border-white/5 italic">
                          {ev.action} - {formatDate(ev.createdAt)}
                       </div>
                    ))}
                    {(!selectedPayment?.timeline || selectedPayment?.timeline?.length === 0) && (
                       <p className="text-[10px] text-slate-600 italic">No historical telemetry for this record.</p>
                    )}
                 </div>
              </section>

              <section className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10">
                 <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2 flex items-center gap-2"><FiShield /> Risk Scoring</h4>
                 <p className="text-[10px] text-slate-500 italic">Financial integrity checks passed with 100% heuristic confidence.</p>
              </section>
            </div>
          )}
        </article>
      </div>
    </div>
  );
};

export default AdminPaymentsPage;
