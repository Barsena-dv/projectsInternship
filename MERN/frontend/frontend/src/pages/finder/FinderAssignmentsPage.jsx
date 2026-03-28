import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiActivity, FiArrowRight, FiCheckCircle, FiClock, FiLayers, FiZap } from 'react-icons/fi';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { assignmentApi, evidenceApi } from '../../services/api';
import { deriveFinderLifecycleState, getFinderLifecycleMessage } from '../../utils/finderLifecycle';
import { formatDate, getErrorMessage } from '../../utils/helpers';

const FinderAssignmentsPage = () => {
  const [items, setItems] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ACTIVE'); // ACTIVE, APPLIED, HISTORY

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [res, myApplicationsRes] = await Promise.all([
          assignmentApi.my(),
          assignmentApi.myApplications().catch(() => ({ data: [] })),
        ]);

        const assignments = res.data || [];
        const pendingApplications = (myApplicationsRes.data || []).filter(
          (row) => String(row?.status || '').toLowerCase() === 'pending'
        );

        const evidencePairs = await Promise.all(
          assignments.map(async (assignment) => {
            const evidenceRes = await evidenceApi.byAssignment(assignment._id).catch(() => ({ data: null }));
            return [String(assignment._id), evidenceRes?.data || null];
          })
        );

        const evidenceByAssignmentId = Object.fromEntries(evidencePairs);

        setItems(
          assignments.map((assignment) => ({
            ...assignment,
            __evidence: evidenceByAssignmentId[String(assignment._id)] || null,
          }))
        );
        setApplications(pendingApplications);
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filteredItems = items.filter(item => {
    const state = deriveFinderLifecycleState({ assignment: item, evidence: item.__evidence });
    if (activeFilter === 'ACTIVE') return ['assigned', 'evidence_submitted', 'verified', 'inactive'].includes(state);
    if (activeFilter === 'HISTORY') return ['completed', 'expired', 'failed'].includes(state);
    return false;
  });

  if (loading) return <LoadingSpinner text="Synchronizing Mission Data..." />;

  const sectionLabel = "text-[10px] font-black text-emerald-500/60 uppercase tracking-[0.2em] mb-4 block";
  const tabStyle = (id) => `px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
    activeFilter === id ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-emerald-400 hover:bg-white/5'
  }`;

  return (
    <div className="finder-page-enter space-y-10">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <PageHeader 
          title="Mission Control" 
          subtitle="Comprehensive tracking of active discovery targets and application synchronization" 
        />
        <div className="flex p-1.5 bg-slate-950/50 backdrop-blur-xl rounded-2xl border border-white/5">
           <button onClick={() => setActiveFilter('ACTIVE')} className={tabStyle('ACTIVE')}>Active</button>
           <button onClick={() => setActiveFilter('APPLIED')} className={tabStyle('APPLIED')}>Applied</button>
           <button onClick={() => setActiveFilter('HISTORY')} className={tabStyle('HISTORY')}>History</button>
        </div>
      </div>

      <div className="space-y-6">
        {activeFilter === 'APPLIED' && (
          <div className="space-y-4">
             <span className={sectionLabel}>Signal Applications</span>
             {applications.length === 0 ? (
               <EmptyState title="No Outgoing Signals" description="You have no pending applications. Recalibrate your radar to find new targets." />
             ) : (
               <div className="grid gap-4">
                  {applications.map((item) => (
                    <article key={item._id} className="f-card-interactive p-6 flex flex-wrap items-center justify-between gap-6 border-l-4 border-l-emerald-500/30">
                       <div className="flex gap-4 items-center">
                          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                             <FiZap size={20} />
                          </div>
                          <div>
                             <h4 className="text-base font-black text-white">{item?.request?.itemName || 'Operational Task'}</h4>
                             <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Applied: {formatDate(item.createdAt)}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-6">
                          <StatusBadge value="pending" />
                          <Link to={`/finder/requests/${item?.request?._id || item?.request}`} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-emerald-500/10 transition-all text-emerald-500">
                             <FiArrowRight size={18} />
                          </Link>
                       </div>
                    </article>
                  ))}
               </div>
             )}
          </div>
        )}

        {(activeFilter === 'ACTIVE' || activeFilter === 'HISTORY') && (
          <div className="space-y-4">
             <span className={sectionLabel}>{activeFilter === 'ACTIVE' ? 'Live Mission Profiles' : 'Historical Data Logs'}</span>
             {filteredItems.length === 0 ? (
               <EmptyState 
                 title={activeFilter === 'ACTIVE' ? "No Live Signals" : "Archive Empty"} 
                 description={activeFilter === 'ACTIVE' ? "Active tracking list is clear. Check the discovery grid for new targets." : "No completed mission records found in the database."} 
               />
             ) : (
               <div className="grid gap-4">
                  {filteredItems.map((item) => {
                    const lifecycle = deriveFinderLifecycleState({ assignment: item, evidence: item.__evidence });
                    return (
                      <article key={item._id} className="f-card-interactive p-6 flex flex-wrap items-center justify-between gap-6">
                         <div className="flex gap-4 items-center">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${activeFilter === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 pulse' : 'bg-slate-800 text-slate-400'}`}>
                               {activeFilter === 'ACTIVE' ? <FiActivity size={20} /> : <FiCheckCircle size={20} />}
                            </div>
                            <div>
                               <h4 className="text-base font-black text-white">{item.request?.itemName || 'Operational Task'}</h4>
                               <div className="flex items-center gap-4 mt-1">
                                  <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Assigned: {formatDate(item.assignedAt || item.createdAt)}</p>
                                  <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-500/80 uppercase">
                                     <FiClock size={10} /> {getFinderLifecycleMessage(lifecycle)}
                                  </div>
                               </div>
                            </div>
                         </div>
                         <div className="flex items-center gap-6">
                            <StatusBadge value={lifecycle} />
                            <Link to={`/finder/assignments/${item._id}`} className="px-5 py-3 bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-xl hover:scale-110 transition-all shadow-lg">
                               Initialize Workbench
                            </Link>
                         </div>
                      </article>
                    );
                  })}
               </div>
             )}
          </div>
        )}
      </div>

      {/* Discovery Prompt Footer */}
      <div className="mt-12 p-8 rounded-[2.5rem] bg-emerald-500 text-slate-950 relative overflow-hidden group shadow-[0_20px_50px_rgba(16,185,129,0.2)]">
         <FiLayers className="absolute -right-6 -bottom-6 text-slate-950/10" size={180} />
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-md">
               <h3 className="text-2xl font-black mb-2 uppercase tracking-tighter">Expand Your Discovery Range</h3>
               <p className="text-sm font-bold opacity-80 leading-relaxed italic">
                 New signals are detected in real-time. Keep your operational radar synchronized for priority extraction rewards.
               </p>
            </div>
            <Link to="/finder/requests" className="px-8 py-4 bg-slate-950 text-emerald-500 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-900 transition-all whitespace-nowrap">
               Scan Available Signals
            </Link>
         </div>
      </div>
    </div>
  );
};

export default FinderAssignmentsPage;
