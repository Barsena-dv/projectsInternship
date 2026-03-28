import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { adminApi } from '../../services/api';
import { formatDate, getErrorMessage } from '../../utils/helpers';
import { FiSearch, FiFilter, FiLink, FiClock, FiActivity, FiXCircle, FiCheckCircle } from 'react-icons/fi';

const AdminAssignmentsPage = () => {
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [trackingAnalytics, setTrackingAnalytics] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await adminApi.assignments(params);
      setAssignments(res?.data?.rows || []);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onSelectAssignment = async (assignmentId) => {
    try {
      const [details, analytics] = await Promise.all([
        adminApi.assignmentDetails(assignmentId),
        adminApi.trackingAnalytics(assignmentId),
      ]);
      setSelectedAssignment(details?.data || null);
      setTrackingAnalytics(analytics?.data || null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleAssignmentStatus = async (assignmentId, status) => {
    try {
      const reason = window.prompt(`Administrative notation for status transition to ${status}:`) || '';
      if (!reason.trim()) {
        toast.error('Explicit reason is required for administrative overrides.');
        return;
      }
      await adminApi.updateAssignmentStatus(assignmentId, { status, reason });
      toast.success('Assignment state transitioned successfully.');
      await loadData();
      if (selectedAssignment?.assignment?._id === assignmentId) await onSelectAssignment(assignmentId);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleExtendDeadline = async (assignmentId) => {
    try {
      const input = window.prompt('Extension minutes (e.g., 60 for 1 hour):', '60');
      const extensionMinutes = Number(input || 0);
      if (!extensionMinutes || extensionMinutes <= 0) {
        toast.error('Invalid extension value provided.');
        return;
      }
      const reason = window.prompt('Extension notation:') || '';
      await adminApi.extendAssignmentDeadline(assignmentId, { extensionMinutes, reason });
      toast.success('Assignment deadline extended.');
      await loadData();
      if (selectedAssignment?.assignment?._id === assignmentId) await onSelectAssignment(assignmentId);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Active Engagements" 
        subtitle="Oversight of live mission assignments, discovery timelines, and integrity telemetry" 
      />

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Assignments List Card */}
        <article className="admin-card flex flex-col h-[700px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Active Linkages</h3>
            <div className="flex items-center gap-2">
               <FiFilter className="text-slate-500" />
               <select 
                 className="bg-transparent text-[10px] font-bold text-white uppercase tracking-wider outline-none border border-white/5 rounded px-2 py-1"
                 value={statusFilter} 
                 onChange={(e) => setStatusFilter(e.target.value)}
               >
                 <option value="">All States</option>
                 <option value="active">Active</option>
                 <option value="inactive">Inactive</option>
                 <option value="expired">Expired</option>
                 <option value="failed">Failed</option>
                 <option value="completed">Completed</option>
                 <option value="cancelled">Cancelled</option>
               </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
            {loading ? (
              <div className="py-40 flex justify-center"><LoadingSpinner /></div>
            ) : assignments.length === 0 ? (
              <EmptyState title="No active linkages" description="No assignments match the specified lifecycle state." />
            ) : (
              assignments.map((row) => (
                <div 
                  key={row._id} 
                  onClick={() => onSelectAssignment(row._id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedAssignment?.assignment?._id === row._id ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-white/5 border-white/5 hover:bg-white/[0.08]'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-white text-sm uppercase tracking-wider">{row?.request?.itemName || 'UNSPECIFIED MISSION'}</p>
                    <StatusBadge value={row.status} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase font-black tracking-widest opacity-60">
                     <span>Finder: {row?.finder?.full_name || '-'}</span>
                     <span className="flex items-center gap-1"><FiClock /> {formatDate(row.deadlineAt)}</span>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => onSelectAssignment(row._id)} className="p-1 px-3 bg-indigo-500/10 text-indigo-400 rounded-lg text-[10px] font-black hover:bg-indigo-500/20 transition-all border border-indigo-500/20 flex items-center gap-2"><FiLink /> INSPECT</button>
                    <button onClick={() => handleExtendDeadline(row._id)} className="p-1 px-3 bg-white/5 text-sky-400 rounded-lg text-[10px] font-black hover:bg-white/10 transition-all border border-white/5 flex items-center gap-2"><FiClock /> EXTEND</button>
                    <button onClick={() => handleAssignmentStatus(row._id, 'failed')} className="p-1 px-3 bg-white/5 text-rose-500 rounded-lg text-[10px] font-black hover:bg-white/10 transition-all border border-white/5 flex items-center gap-2"><FiXCircle /> FAIL</button>
                    <button onClick={() => handleAssignmentStatus(row._id, 'active')} className="p-1 px-3 bg-white/5 text-emerald-400 rounded-lg text-[10px] font-black hover:bg-white/10 transition-all border border-white/5 flex items-center gap-2"><FiCheckCircle /> ACTIVATE</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        {/* Assignment Intelligence View Card */}
        <article className="admin-card h-[700px] flex flex-col">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Discovery Intelligence Telemetry</h3>
          
          {!selectedAssignment ? (
            <div className="flex-1 flex items-center justify-center text-center opacity-30">
               <div>
                 <FiActivity size={48} className="mx-auto mb-4" />
                 <p className="text-sm font-bold uppercase tracking-widest text-white">Select linkage to view integrity data</p>
               </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-8 custom-scrollbar pr-2">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500 flex items-center justify-center text-2xl font-black text-white shadow-xl shadow-indigo-500/20 overflow-hidden uppercase">
                   {selectedAssignment.finder?.full_name[0] || 'A'}
                </div>
                <div>
                   <h2 className="text-xl font-black text-white">{selectedAssignment.finder?.full_name}</h2>
                   <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest">Acting Discovery Specialist</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">State Transition</span>
                  <StatusBadge value={selectedAssignment?.assignment?.status} />
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                   <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">Evidence State</span>
                   <StatusBadge value={selectedAssignment?.evidence?.verificationStatus || 'none'} />
                </div>
              </div>

              <section className="space-y-4">
                 <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">Engagement Meta</h4>
                 <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                       <div>
                         <p className="text-[10px] font-black text-slate-500 uppercase">Mission Identity</p>
                         <p className="text-sm font-bold text-white">{selectedAssignment?.owner?.full_name || '-'}</p>
                       </div>
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Discovery Roadmap (Timeline)</p>
                       <div className="space-y-1">
                          {selectedAssignment?.timeline?.slice(0, 3).map((ev, i) => (
                             <div key={i} className="text-[10px] text-slate-400 p-2 rounded bg-white/5 border border-white/5 italic">
                                {ev.action.replaceAll('_', ' ')} - {formatDate(ev.createdAt)}
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </section>

              <section className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                 <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Geospatial Integrity Audit</h4>
                 <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-slate-400 font-bold uppercase tracking-wider">Teleport/Jump Anomalies</span>
                       <span className={`font-black ${trackingAnalytics?.analytics?.suspiciousJumps > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{trackingAnalytics?.analytics?.suspiciousJumps || 0} detection(s)</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-slate-400 font-bold uppercase tracking-wider">Extended Inactivity</span>
                       <span className={`font-black ${trackingAnalytics?.analytics?.noMovementLongGap > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>{trackingAnalytics?.analytics?.noMovementLongGap || 0} gap(s)</span>
                    </div>
                    <div className="text-[10px] text-slate-500 italic mt-2">
                       Total tracking updates recorded: {selectedAssignment?.tracking?.length || 0}
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

export default AdminAssignmentsPage;
