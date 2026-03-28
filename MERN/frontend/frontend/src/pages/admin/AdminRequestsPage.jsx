import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { adminApi } from '../../services/api';
import { formatDate, getErrorMessage } from '../../utils/helpers';
import { FiSearch, FiFilter, FiFileText, FiTrash2, FiActivity, FiRotateCcw, FiEye } from 'react-icons/fi';

const AdminRequestsPage = () => {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await adminApi.requests(params);
      setRequests(res?.data?.rows || []);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onSelectRequest = async (requestId) => {
    try {
      const res = await adminApi.requestDetails(requestId);
      setSelectedRequest(res?.data || null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleRequestAction = async (requestId, action) => {
    try {
      const reason = window.prompt(`Administrative notation for ${action.replaceAll('_', ' ')}:`) || '';
      if (!reason.trim() && action !== 'reopen') {
        toast.error('Explicit reason is required for administrative overrides.');
        return;
      }

      if (action === 'delete') await adminApi.deleteRequest(requestId, { reason });
      if (action === 'force_close') await adminApi.forceCloseRequest(requestId, { reason });
      if (action === 'reopen') await adminApi.reopenRequest(requestId, { reason });
      
      toast.success('Administrative override executed successfully.');
      await loadData();
      if (selectedRequest?.request?._id === requestId) await onSelectRequest(requestId);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Mission Registry" 
        subtitle="Global oversight of lost item requests, lifecycle states, and administrative overrides" 
      />

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Requests List Card */}
        <article className="admin-card flex flex-col h-[700px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Mission Repository</h3>
            <div className="flex items-center gap-2">
               <FiFilter className="text-slate-500" />
               <select 
                 className="bg-transparent text-[10px] font-bold text-white uppercase tracking-wider outline-none border border-white/5 rounded px-2 py-1"
                 value={statusFilter} 
                 onChange={(e) => setStatusFilter(e.target.value)}
               >
                 <option value="">All Statuses</option>
                 <option value="draft">Draft</option>
                 <option value="open">Open</option>
                 <option value="assigned">Assigned</option>
                 <option value="completed">Completed</option>
                 <option value="expired">Expired</option>
                 <option value="failed">Failed</option>
               </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
            {loading ? (
              <div className="py-40 flex justify-center"><LoadingSpinner /></div>
            ) : requests.length === 0 ? (
              <EmptyState title="No matched missions" description="Try adjusting your state filter." />
            ) : (
              requests.map((row) => (
                <div 
                  key={row._id} 
                  onClick={() => onSelectRequest(row._id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedRequest?.request?._id === row._id ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-white/5 border-white/5 hover:bg-white/[0.08]'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-white text-sm uppercase tracking-wider">{row.itemName}</p>
                    <StatusBadge value={row.requestStatus} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase font-black tracking-widest opacity-60">
                     <span>Owner: {row?.owner?.full_name || '-'}</span>
                     <span>Payment: {row?.payment?.paymentStatus || 'none'}</span>
                  </div>
                  
                  <div className="mt-4 flex gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => onSelectRequest(row._id)} className="p-1 px-3 bg-indigo-500/10 text-indigo-400 rounded-lg text-[10px] font-black hover:bg-indigo-500/20 transition-all border border-indigo-500/20 flex items-center gap-2"><FiEye /> INSPECT</button>
                    <button onClick={() => handleRequestAction(row._id, 'force_close')} className="p-1 px-3 bg-white/5 text-amber-500 rounded-lg text-[10px] font-black hover:bg-white/10 transition-all border border-white/5 flex items-center gap-2"><FiActivity /> FORCE CLOSE</button>
                    <button onClick={() => handleRequestAction(row._id, 'delete')} className="p-1 px-3 bg-white/5 text-rose-500 rounded-lg text-[10px] font-black hover:bg-white/10 transition-all border border-white/5 flex items-center gap-2"><FiTrash2 /> DELETE</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        {/* Request Details View Card */}
        <article className="admin-card h-[700px] flex flex-col">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Mission Detailed Telemetry</h3>
          
          {!selectedRequest ? (
            <div className="flex-1 flex items-center justify-center text-center opacity-30">
               <div>
                 <FiFileText size={48} className="mx-auto mb-4" />
                 <p className="text-sm font-bold uppercase tracking-widest text-white">Select mission to view audit data</p>
               </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-8 custom-scrollbar pr-2">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-indigo-400 overflow-hidden">
                   {selectedRequest.request.itemImage ? <img src={selectedRequest.request.itemImage} className="w-full h-full object-cover" /> : <FiFileText size={24} />}
                </div>
                <div>
                   <h2 className="text-xl font-black text-white">{selectedRequest.request.itemName}</h2>
                   <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest">ID: {selectedRequest.request._id.slice(-8)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">Entity Status</span>
                  <StatusBadge value={selectedRequest?.request?.requestStatus} />
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                   <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">Payment State</span>
                   <StatusBadge value={selectedRequest?.payment?.paymentStatus || 'none'} />
                </div>
              </div>

              <section className="space-y-4">
                 <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">Related Entities</h4>
                 <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                       <div>
                         <p className="text-[10px] font-black text-slate-500 uppercase">Owner Identity</p>
                         <p className="text-sm font-bold text-white">{selectedRequest?.owner?.full_name || '-'}</p>
                       </div>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                       <div>
                         <p className="text-[10px] font-black text-slate-500 uppercase">Assigned Finder</p>
                         <p className="text-sm font-bold text-indigo-400">{selectedRequest?.assignment?.finder?.full_name || 'NO ACTIVE ASSIGNMENT'}</p>
                       </div>
                    </div>
                 </div>
              </section>

              <section className="space-y-4">
                 <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">Telemetry Audit</h4>
                 <div className="grid grid-cols-2 gap-y-4">
                    <div>
                       <p className="text-xs text-slate-400 mb-1 font-bold">Evidence Verified</p>
                       <p className="text-xs font-black text-white">{selectedRequest?.evidence?.verificationStatus?.toUpperCase() || 'NONE'}</p>
                    </div>
                    <div>
                       <p className="text-xs text-slate-400 mb-1 font-bold">Timeline Density</p>
                       <p className="text-xs font-black text-white">{selectedRequest?.timeline?.length || 0} events</p>
                    </div>
                    <div>
                       <p className="text-xs text-slate-400 mb-1 font-bold">Inactivity Marked</p>
                       <p className="text-xs font-black text-rose-400 uppercase">{selectedRequest?.assignment?.inactivityMarkedAt ? 'YES' : 'STABLE'}</p>
                    </div>
                    <div>
                       <p className="text-xs text-slate-400 mb-1 font-bold">Created At</p>
                       <p className="text-xs font-black text-white">{formatDate(selectedRequest?.request?.createdAt)}</p>
                    </div>
                 </div>
              </section>
            </div>
          )}
        </article>
      </div>
    </div>
  );
};

export default AdminRequestsPage;
