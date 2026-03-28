import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { adminApi } from '../../services/api';
import { getErrorMessage } from '../../utils/helpers';
import { FiSearch, FiFilter, FiAlertTriangle, FiCheckCircle, FiXCircle, FiMessageSquare } from 'react-icons/fi';

const AdminDisputesPage = () => {
  const [loading, setLoading] = useState(true);
  const [disputes, setDisputes] = useState([]);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await adminApi.disputes(params);
      setDisputes(res?.data?.rows || []);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onSelectDispute = async (disputeId) => {
    try {
      const res = await adminApi.disputeDetails(disputeId);
      setSelectedDispute(res?.data || null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleResolveDispute = async (disputeId, decision) => {
    try {
      const resolutionDetails = window.prompt('Resolution Details (Audit Visibility):') || '';
      if (!resolutionDetails.trim()) {
        toast.error('Explicit resolution details are mandatory for audit compliance.');
        return;
      }

      const penalizeFinder = decision === 'owner_wins' ? window.confirm('Apply discovery penalty to Finder identity?') : false;
      const penalizeOwner = decision === 'finder_wins' ? window.confirm('Apply fulfillment penalty to Owner identity?') : false;

      await adminApi.resolveDispute(disputeId, {
        adminDecision: decision,
        resolutionDetails,
        penalizeFinder,
        penalizeOwner,
      });

      toast.success('Dispute resolved and settlement updated.');
      await loadData();
      if (selectedDispute?.dispute?._id === disputeId) await onSelectDispute(disputeId);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Dispute Laboratory" 
        subtitle="Neutral adjudication of mission disagreements, evidence audits, and identity integrity" 
      />

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Disputes List Card */}
        <article className="admin-card flex flex-col h-[700px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Active Adjudications</h3>
            <div className="flex items-center gap-2">
               <FiFilter className="text-slate-500" />
               <select 
                 className="bg-transparent text-[10px] font-bold text-white uppercase tracking-wider outline-none border border-white/5 rounded px-2 py-1"
                 value={statusFilter} 
                 onChange={(e) => setStatusFilter(e.target.value)}
               >
                 <option value="">All States</option>
                 <option value="open">Open</option>
                 <option value="resolved">Resolved</option>
               </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
            {loading ? (
              <div className="py-40 flex justify-center"><LoadingSpinner /></div>
            ) : disputes.length === 0 ? (
              <EmptyState title="No active adjudications" description="The dispute registry is currently clear." />
            ) : (
              disputes.map((row) => (
                <div 
                  key={row._id} 
                  onClick={() => onSelectDispute(row._id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedDispute?.dispute?._id === row._id ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/5 border-white/5 hover:bg-white/[0.08]'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-white text-sm uppercase tracking-wider">{String(row.reason || 'UNSPECIFIED REASON').replaceAll('_', ' ')}</p>
                    <StatusBadge value={row.status} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase font-black tracking-widest opacity-60">
                     <span>Raised by: {row?.raisedBy?.full_name || '-'}</span>
                     <span className="flex items-center gap-1"><FiAlertTriangle className="text-amber-500" /> High Friction</span>
                  </div>
                  
                  <div className="mt-4 flex gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => onSelectDispute(row._id)} className="p-1 px-3 bg-amber-500/10 text-amber-500 rounded-lg text-[10px] font-black hover:bg-amber-500/20 transition-all border border-amber-500/20 flex items-center gap-2"><FiSearch /> AUDIT CASE</button>
                    {row.status === 'open' && (
                       <>
                         <button onClick={() => handleResolveResolveDispute(row._id, 'finder_wins')} className="p-1 px-3 bg-white/5 text-emerald-400 rounded-lg text-[10px] font-black hover:bg-white/10 transition-all border border-white/5 flex items-center gap-2 font-black italic">! FINDER CORRECT</button>
                         <button onClick={() => handleResolveDispute(row._id, 'owner_wins')} className="p-1 px-3 bg-white/5 text-rose-500 rounded-lg text-[10px] font-black hover:bg-white/10 transition-all border border-white/5 flex items-center gap-2 font-black italic">! OWNER CORRECT</button>
                       </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        {/* Dispute Adjudication Card */}
        <article className="admin-card h-[700px] flex flex-col">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Case Intelligence Center</h3>
          
          {!selectedDispute ? (
            <div className="flex-1 flex items-center justify-center text-center opacity-30">
               <div>
                 <FiAlertTriangle size={48} className="mx-auto mb-4" />
                 <p className="text-sm font-bold uppercase tracking-widest text-white">Select case to initiate neutral audit</p>
               </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-8 custom-scrollbar pr-2">
              <section className="space-y-4">
                 <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">Contesting Entities</h4>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                       <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Owner Registry</p>
                       <p className="text-sm font-bold text-white">{selectedDispute?.assignment?.request?.owner?.full_name || '-'}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                       <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Finder Registry</p>
                       <p className="text-sm font-bold text-white">{selectedDispute?.assignment?.finder?.full_name || '-'}</p>
                    </div>
                 </div>
              </section>

              <section className="space-y-4">
                 <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">Evidence & Forensics</h4>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                       <p className="text-[10px] font-black text-indigo-400 uppercase mb-1">Verification Status</p>
                       <StatusBadge value={selectedDispute?.evidence?.verificationStatus || 'none'} />
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                       <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Tracking Precision</p>
                       <p className="text-xs font-black text-white italic">{selectedDispute?.tracking?.length || 0} pings recorded</p>
                    </div>
                 </div>
              </section>

              <section className="space-y-4">
                 <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2"><FiMessageSquare /> Negotiation Logs</h4>
                 <div className="p-4 rounded-xl bg-white/5 border border-white/5 max-h-40 overflow-y-auto custom-scrollbar">
                    {selectedDispute?.chatHistory?.messages?.length > 0 ? (
                       <div className="space-y-2">
                          {selectedDispute?.chatHistory?.messages.slice(-5).map((m, i) => (
                             <div key={i} className="text-[10px] text-slate-400 border-b border-white/5 pb-1">
                                <span className="font-black text-white">{m.sender?.full_name}:</span> {m.content}
                             </div>
                          ))}
                       </div>
                    ) : (
                       <p className="text-[10px] text-slate-600 italic">No communication telemetry recorded for this linkage.</p>
                    )}
                 </div>
              </section>

              <section className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                 <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3">Administrative Decision</h4>
                 {selectedDispute?.dispute?.status === 'resolved' ? (
                    <div className="space-y-2">
                       <p className="text-xs text-white font-bold"><span className="text-slate-500 uppercase">Outcome:</span> {selectedDispute.dispute.adminDecision.replace('_', ' ')}</p>
                       <p className="text-[10px] text-slate-400 italic">" {selectedDispute.dispute.resolutionDetails} "</p>
                    </div>
                 ) : (
                    <div className="text-[10px] text-amber-500/60 font-black tracking-widest italic animate-pulse">
                       PENDING ADJUDICATION...
                    </div>
                 )}
              </section>
            </div>
          )}
        </article>
      </div>
    </div>
  );
};

export default AdminDisputesPage;
