import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FiActivity, FiArrowRight, FiCheckCircle, FiClock, FiDollarSign, 
  FiLayers, FiSearch, FiStar, FiZap, FiTarget, FiTrendingUp, 
  FiShield, FiNavigation, FiCpu
} from 'react-icons/fi';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { assignmentApi, evidenceApi, notificationApi, payoutApi, requestApi } from '../../services/api';
import { deriveFinderLifecycleState, isDeadlineMissed } from '../../utils/finderLifecycle';
import { formatCurrency, formatDate, getErrorMessage } from '../../utils/helpers';
import { useScrollReveal } from '../../hooks/useScrollReveal';

const RevealWrapper = ({ children, className = '', delay = '' }) => {
  const [ref, isVisible] = useScrollReveal();
  return (
    <div ref={ref} className={`reveal-up ${isVisible ? 'is-visible' : ''} ${delay} ${className}`}>
      {children}
    </div>
  );
};

const FinderDashboardPage = () => {
  const { user, refreshMe } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('RADAR'); // RADAR, MISSIONS, FINANCE
  
  const [assignments, setAssignments] = useState([]);
  const [applications, setApplications] = useState([]);
  const [availableRequests, setAvailableRequests] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        // Sync user profile first for fresh ratings/stats
        await refreshMe().catch(() => {});

        const [assignmentRes, applicationRes, availableRes, payoutRes, notificationRes] = await Promise.all([
          assignmentApi.my(),
          assignmentApi.myApplications().catch(() => ({ data: [] })),
          requestApi.available().catch(() => ({ data: [] })),
          payoutApi.my().catch(() => ({ data: [] })),
          notificationApi.my({ page: 1, limit: 30 }).catch(() => ({ data: [] })),
        ]);

        const assignmentRows = assignmentRes?.data || [];
        const evidenceEntries = await Promise.all(
          assignmentRows.map(async (assignment) => {
            try {
              const evidenceRes = await evidenceApi.byAssignment(assignment._id);
              return [assignment._id, evidenceRes?.data || null];
            } catch {
              return [assignment._id, null];
            }
          })
        );

        const evidenceByAssignmentId = Object.fromEntries(evidenceEntries);
        const enrichedAssignments = assignmentRows.map((assignment) => ({
          ...assignment,
          _evidence: evidenceByAssignmentId[assignment._id] || null,
        }));

        setAssignments(enrichedAssignments);
        setApplications(applicationRes?.data || []);
        setAvailableRequests(availableRes?.data || []);
        setPayouts(payoutRes?.data || []);
        setNotifications(notificationRes?.data || []);
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const stats = useMemo(() => {
    // Liquid = Successfully transferred (processed) OR completed assignments' payouts
    const totalEarnings = payouts
      .filter((p) => {
        const isProcessed = String(p.payoutStatus || '').toLowerCase() === 'processed';
        const isLegacyCompleted = String(p.payoutStatus || '').toLowerCase() === 'pending' && 
                                 (p.assignment?.status === 'completed' || p.assignment?.request?.requestStatus === 'completed');
        return isProcessed || isLegacyCompleted;
      })
      .reduce((sum, p) => sum + Number(p.payoutAmount || 0), 0);

    // Pending = Processing (and NOT for a completed mission)
    const pendingPayoutCount = payouts
      .filter((p) => {
        const isPending = String(p.payoutStatus || '').toLowerCase() === 'pending';
        const isLegacyCompleted = (p.assignment?.status === 'completed' || p.assignment?.request?.requestStatus === 'completed');
        return isPending && !isLegacyCompleted;
      })
      .reduce((sum, p) => sum + Number(p.payoutAmount || 0), 0);

    // Escrow = Rewards from active assignments
    const activeAssignmentsList = assignments.filter((row) => {
      const lifecycle = deriveFinderLifecycleState({ assignment: row, evidence: row._evidence });
      return ['assigned', 'evidence_submitted', 'verified', 'inactive'].includes(lifecycle);
    });

    const activeEscrowReward = activeAssignmentsList.reduce((sum, row) => {
      // The total potential reward for this mission
      const baseAmount = Number(row?.request?.rewardAmount || row?.request?.planId?.rewardAmount || 0);
      
      // Calculate realistic potential based on plan split (defaults to Basic 85% if plan data missing)
      const plan = row?.request?.planId || row?.planId;
      const multiplier = plan ? (Number(plan.finderPercent || 15) + Number(plan.refundPercent || 70)) / 100 : 0.85;
      
      return sum + (baseAmount * multiplier);
    }, 0);

    // Combine any other independent pending payouts (processing or compensation)
    const independentPending = payouts
      .filter((p) => String(p.payoutStatus || '').toLowerCase() === 'pending')
      .filter((p) => !activeAssignmentsList.some(a => String(a._id) === String(p.assignment?._id || p.assignment)))
      .reduce((sum, p) => sum + Number(p.payoutAmount || 0), 0);

    const lockedValue = activeEscrowReward + independentPending;

    return {
      active: activeAssignmentsList.length,
      completed: assignments.filter((row) => deriveFinderLifecycleState({ assignment: row, evidence: row._evidence }) === 'completed').length,
      totalEarnings,
      pendingPayout: lockedValue,
      openRequests: availableRequests.length,
      pendingApps: applications.filter((row) => String(row?.status || '').toLowerCase() === 'pending').length,
      successRate: assignments.length ? Math.round((assignments.filter((a) => deriveFinderLifecycleState({ assignment: a, evidence: a._evidence }) === 'completed').length / assignments.length) * 100) : 0,
    };
  }, [assignments, applications, availableRequests.length, payouts]);

  const activeAssignments = useMemo(() => {
    return assignments
      .map((row) => {
        const lifecycle = deriveFinderLifecycleState({ assignment: row, evidence: row._evidence });
        const deadline = row?.deadlineAt || row?.request?.serviceDeadline;
        return {
          ...row,
          _lifecycle: lifecycle,
          _deadline: deadline,
          _deadlineMissed: isDeadlineMissed(deadline),
        };
      })
      .filter((row) => ['assigned', 'evidence_submitted', 'verified', 'inactive'].includes(row._lifecycle))
      .sort((a, b) => new Date(a._deadline || 0) - new Date(b._deadline || 0));
  }, [assignments]);

  if (loading) return <LoadingSpinner text="Initializing Tactical Interface..." />;

  const sectionLabel = "text-[10px] font-black text-emerald-500/60 uppercase tracking-[0.2em] mb-4 block";
  const tabBtnStyle = (id) => `flex items-center gap-3 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
    activeTab === id 
    ? 'bg-emerald-500 text-slate-950 shadow-[0_8px_20px_rgba(16,185,129,0.3)] scale-[1.05]' 
    : 'text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/5'
  }`;

  const DashboardStat = ({ title, value, helper, icon }) => (
    <div className="f-card-interactive p-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full -mr-8 -mt-8 group-hover:bg-emerald-500/10 transition-all duration-500" />
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{title}</p>
          <h3 className="text-2xl font-black text-white">{value}</h3>
          {helper && <p className="text-[10px] text-emerald-500/50 mt-1 font-bold italic">{helper}</p>}
        </div>
        <div className="p-3 bg-white/5 rounded-xl text-emerald-500 group-hover:scale-110 group-hover:bg-emerald-500/10 transition-all">
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="finder-page-enter space-y-8 pb-12 overflow-x-hidden">
      
      {/* Interactive Top Navbar/Tabs */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-6 pb-8 border-b border-white/5">
        <PageHeader
          title="Intelligence Hub"
          subtitle="Tactical discovery workbench and financial synchronization terminal"
        />
        <div className="flex p-2 bg-slate-950/40 backdrop-blur-2xl rounded-2xl border border-white/5 shadow-2xl">
           <button onClick={() => setActiveTab('RADAR')} className={tabBtnStyle('RADAR')}>
             <FiTarget size={14} className={activeTab === 'RADAR' ? 'animate-pulse' : ''} /> Radar
           </button>
           <button onClick={() => setActiveTab('MISSIONS')} className={tabBtnStyle('MISSIONS')}>
             <FiLayers size={14} className={activeTab === 'MISSIONS' ? 'animate-bounce' : ''} /> Missions
           </button>
           <button onClick={() => setActiveTab('FINANCE')} className={tabBtnStyle('FINANCE')}>
             <FiTrendingUp size={14} className={activeTab === 'FINANCE' ? 'animate-pulse' : ''} /> Finance
           </button>
        </div>
      </div>

      {/* Dynamic Content Switching */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* --- RADAR TAB --- */}
        {activeTab === 'RADAR' && (
          <div className="space-y-8">
            {/* High-Level Pulse Grid */}
            <RevealWrapper delay="reveal-delay-100">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <DashboardStat title="Total Liquidity" value={formatCurrency(stats.totalEarnings)} helper={`${formatCurrency(stats.pendingPayout)} processing`} icon={<FiDollarSign size={20} />} />
                <DashboardStat title="Discovery Accuracy" value={`${stats.successRate}%`} helper="Extraction efficiency" icon={<FiCheckCircle size={20} />} />
                <DashboardStat title="Nearby Signals" value={stats.openRequests} helper="Active in discover radius" icon={<FiNavigation size={20} />} />
                <DashboardStat title="Trust Protocol" value={`${Number(user?.ratingAvg || 0).toFixed(1)}`} helper="Verified credibility" icon={<FiShield size={20} />} />
              </div>
            </RevealWrapper>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
              
              {/* Radar Visualizer Card */}
              <RevealWrapper className="lg:col-span-12 xl:col-span-7" delay="reveal-delay-200">
                  <div className="finder-section-card f-hologram-effect group overflow-hidden">
                     <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8 sm:mb-10">
                        <div>
                          <span className={sectionLabel}>Operational Radar</span>
                          <h3 className="text-xl sm:text-2xl font-black text-white">Active Signal Map</h3>
                        </div>
                        <div className="f-pulse-radar hidden sm:block" />
                     </div>

                     <div className="relative aspect-[3/4] sm:aspect-video min-h-[350px] sm:min-h-[400px] rounded-3xl bg-slate-950 border border-white/5 flex items-center justify-center overflow-hidden group">
                        {/* SVG Scanned Grid Background */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                        
                        {/* Custom SVG Radar Visualizer */}
                        <svg viewBox="0 0 400 400" className="w-full h-full sm:w-[80%] sm:h-[80%] opacity-60 sm:opacity-100">
                           {/* Radial Rings */}
                           <circle cx="200" cy="200" r="150" fill="none" stroke="#10b981" strokeWidth="0.5" strokeDasharray="4 8" opacity="0.2" />
                           <circle cx="200" cy="200" r="100" fill="none" stroke="#10b981" strokeWidth="0.5" strokeDasharray="4 8" opacity="0.1" />
                           <circle cx="200" cy="200" r="50" fill="none" stroke="#10b981" strokeWidth="0.5" strokeDasharray="4 8" opacity="0.05" />
                           
                           {/* Axis Lines */}
                           <line x1="50" y1="200" x2="350" y2="200" stroke="#10b981" strokeWidth="0.5" opacity="0.1" />
                           <line x1="200" y1="50" x2="200" y2="350" stroke="#10b981" strokeWidth="0.5" opacity="0.1" />
                           
                           {/* Data Points (Target Points) */}
                           {activeAssignments.map((a, i) => {
                              const angle = (i * 137.5) % 360;
                              const radius = 40 + (i * 20) % 100;
                              const x = 200 + radius * Math.cos(angle * Math.PI / 180);
                              const y = 200 + radius * Math.sin(angle * Math.PI / 180);
                              return (
                                <g key={a._id} className="cursor-pointer">
                                   <circle cx={x} cy={y} r="3" fill="#10b981">
                                      <animate attributeName="opacity" values="1;0.2;1" dur="2s" repeatCount="indefinite" begin={`${i*0.3}s`} />
                                   </circle>
                                   <circle cx={x} cy={y} r="8" fill="none" stroke="#10b981" strokeWidth="0.5">
                                      <animate attributeName="r" values="8;15" dur="1.5s" repeatCount="indefinite" />
                                      <animate attributeName="opacity" values="0.4;0" dur="1.5s" repeatCount="indefinite" />
                                   </circle>
                                </g>
                              );
                           })}

                           {/* Radar Sweep Effect */}
                           <circle cx="200" cy="200" r="180" fill="url(#radarGradient)" className="origin-center animate-[spin_5s_linear_infinite]" style={{ transformOrigin: '200px 200px' }} />
                           
                           <defs>
                              <linearGradient id="radarGradient" x1="0" y1="0" x2="1" y2="1">
                                 <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                                 <stop offset="50%" stopColor="#10b981" stopOpacity="0" />
                              </linearGradient>
                           </defs>
                        </svg>

                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none w-full px-4 sm:px-6 z-10">
                           <p className="text-[8px] sm:text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-2 sm:mb-3 opacity-60">Discovery Node 01</p>
                           <h4 className="text-base sm:text-2xl font-black text-white drop-shadow-lg leading-tight px-4">{activeAssignments.length} High Priority Signals</h4>
                        </div>

                        <div className="absolute top-4 sm:top-6 left-4 sm:left-6 text-[8px] sm:text-[9px] font-black text-emerald-500/40 uppercase tracking-widest flex items-center gap-2">
                           <FiActivity size={10} /> Live Frequency Tracking
                        </div>

                        <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 flex flex-col sm:flex-row justify-between gap-2 sm:gap-4">
                           <div className="px-3 sm:px-5 py-2 sm:py-2.5 bg-slate-900/60 backdrop-blur-xl rounded-xl border border-white/5 text-[7px] sm:text-[9px] font-bold text-slate-400 font-mono tracking-tight text-center sm:text-left overflow-hidden text-ellipsis whitespace-nowrap">
                              SECURE_LAT: 28.6° N | SECURE_LON: 77.2° E
                           </div>
                           <div className="px-4 sm:px-5 py-2 sm:py-2.5 bg-emerald-500 text-slate-950 rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest cursor-pointer hover:scale-105 transition-all shadow-xl text-center">
                              Calibrate Radar
                           </div>
                        </div>
                     </div>
                  </div>
              </RevealWrapper>

              {/* Discovery Feed Column */}
              <div className="lg:col-span-12 xl:col-span-5 space-y-6">
                 <RevealWrapper className="h-full" delay="reveal-delay-300">
                    <div className="finder-section-card h-full overflow-hidden">
                    <span className={sectionLabel}>Discovery Stream</span>
                    <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3">
                       <FiZap className="text-emerald-500" /> Tactical Monitoring
                    </h3>

                    <div className="space-y-6 pnf-sidebar-scroll max-h-[460px] pr-2 overflow-y-auto">
                       {notifications.length === 0 ? (
                         <div className="text-center py-12 opacity-30">
                            <FiCpu size={40} className="mx-auto mb-4 text-emerald-500/50" />
                            <p className="text-xs italic">No activity on this frequency</p>
                         </div>
                       ) : (
                         notifications.slice(0, 8).map((n) => (
                           <button key={n._id} className="w-full text-left p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all group">
                              <div className="flex justify-between items-start mb-2">
                                 <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{formatDate(n.createdAt)}</span>
                                 {!n.isRead && <div className="f-pulse-radar !w-2 !h-2" />}
                              </div>
                              <p className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{n.title}</p>
                              <p className="text-xs text-slate-500 line-clamp-1 mt-1">{n.message}</p>
                           </button>
                         ))
                       )}
                    </div>

                    <Link to="/notifications" className="mt-8 pt-6 border-t border-white/5 block text-center text-[10px] font-black text-emerald-500/50 uppercase tracking-widest hover:text-emerald-400 transition-colors py-3 sm:py-0 border border-emerald-500/10 sm:border-0 rounded-xl sm:rounded-none">
                      View Secure Intelligence Archive
                    </Link>
                 </div>
                 </RevealWrapper>
              </div>

            </div>
          </div>
        )}

        {/* --- MISSIONS TAB --- */}
        {activeTab === 'MISSIONS' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 sm:gap-4">
               <div>
                  <span className={sectionLabel}>Mission Control</span>
                  <h3 className="text-xl sm:text-3xl font-black text-white">Target List</h3>
               </div>
               <Link to="/finder/requests" className="pnf-btn-primary !px-6 sm:!px-8 text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-black w-full sm:w-auto text-center">Find New Targets</Link>
            </div>

            {activeAssignments.length === 0 ? (
              <EmptyState title="Operational Void" description="You have no active mission profiles. Deploy now to start reward synchronization." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                 {activeAssignments.map((a) => (
                   <div key={a._id} className="f-card-interactive p-6 flex flex-col group relative">
                      <div className="absolute top-4 right-4 group-hover:scale-110 transition-transform">
                         <StatusBadge value={a._lifecycle} />
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="text-base sm:text-lg font-black text-white mb-2 pr-12 sm:pr-16">{a?.request?.itemName}</h4>
                        <p className="text-[10px] sm:text-xs text-slate-500 italic mb-4 sm:mb-6">{a?.request?.lastSeenLocation}</p>
                        
                        <div className="space-y-4 mb-8">
                           <div>
                              <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">
                                 <span>Mission Reward</span>
                                 <div className="flex flex-col items-end">
                                    <span className="text-emerald-500">{formatCurrency(a?.request?.rewardAmount)}</span>
                                    {a?.request?.planId && (
                                      <span className="text-[8px] text-slate-500 font-medium">
                                        ₹{Number((a.request.rewardAmount * (a.request.planId.finderPercent || 15)) / ((a.request.planId.finderPercent || 15) + (a.request.planId.refundPercent || 70))).toFixed(0)} Guaranteed
                                      </span>
                                    )}
                                 </div>
                              </div>
                              <div className="f-mini-chart-bar">
                                 <div className="f-mini-chart-inner" style={{ width: `${(a.request?.planId?.finderPercent || 15) + (a.request?.planId?.refundPercent || 70)}%` }} />
                              </div>
                           </div>
                           <div className="flex items-center gap-2 text-xs text-slate-400">
                              <FiClock size={12} className={a._deadlineMissed ? 'text-rose-500' : 'text-emerald-500'} />
                              <span className={a._deadlineMissed ? 'text-rose-500 font-bold' : ''}>
                                {a._deadlineMissed ? 'EXPIRED' : `ACTIVE UNTIL ${formatDate(a._deadline)}`}
                              </span>
                           </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/5 flex justify-between items-center bg-slate-900/20 -mx-6 -mb-6 px-6 py-4 rounded-b-3xl mt-auto">
                         <div className="flex -space-x-2">
                            {[1,2,3].map(i => <div key={i} className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500/20 border border-slate-900 flex items-center justify-center text-[7px] sm:text-[8px] font-black text-emerald-500">M</div>)}
                         </div>
                          <Link to={`/finder/assignments/${a._id}`} className="px-4 sm:px-5 py-2 sm:py-2.5 bg-emerald-500 text-slate-950 rounded-xl hover:scale-105 sm:hover:scale-110 transition-all shadow-[0_5px_20px_rgba(16,185,129,0.3)] font-black text-[9px] sm:text-[10px] uppercase tracking-widest flex items-center gap-2">
                             Access Mission <FiArrowRight size={14} />
                          </Link>
                      </div>
                   </div>
                 ))}
              </div>
            )}
          </div>
        )}

         {/* --- FINANCE TAB --- */}
        {activeTab === 'FINANCE' && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-3 gap-6">
               <div className="finder-section-card flex flex-col items-center justify-center text-center py-10 shadow-[0_10px_40px_rgba(0,0,0,0.3)]">
                  <span className={sectionLabel}>Locked Discovery Reward</span>
                  <div className="text-4xl font-black text-white mb-2">{formatCurrency(stats.pendingPayout)}</div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Awaiting Tactical Verification</p>
               </div>
               <div className="finder-section-card flex flex-col items-center justify-center text-center py-10 bg-emerald-500/10 border-emerald-500/20 shadow-[0_10px_40px_rgba(16,185,129,0.1)]">
                  <span className={sectionLabel}>Liquid Extractions</span>
                  <div className="text-4xl font-black text-emerald-500 mb-2">{formatCurrency(stats.totalEarnings)}</div>
                  <p className="text-[10px] text-emerald-500/50 uppercase tracking-widest font-black">Successfully Synthesized</p>
               </div>
               <div className="finder-section-card flex flex-col items-center justify-center text-center py-10 shadow-[0_10px_40px_rgba(0,0,0,0.3)]">
                  <span className={sectionLabel}>Mission Efficiency</span>
                 <div className="text-4xl font-black text-white mb-2">{stats.successRate}%</div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Successful Extraction Ratio</p>
               </div>
            </div>

            <div className="finder-section-card !p-0 overflow-hidden border border-white/5">
               <div className="p-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                <div>
                  <span className={sectionLabel}>Financial Ledger</span>
                  <h3 className="text-xl font-black text-white">Synchronized Payouts</h3>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[8px] font-black text-emerald-500/40 uppercase tracking-widest">Signal Status</span>
                   <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] text-white font-bold uppercase tracking-tighter">Live Uplink</span>
                   </div>
                </div>
              </div>
              <div className="p-8 max-h-[60vh] overflow-y-auto pnf-sidebar-scroll">
                  <div className="overflow-x-auto pnf-sidebar-scroll">
                    <table className="w-full min-w-[600px]">
                       <thead>
                          <tr className="border-b border-white/5">
                             <th className="pb-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Transaction ID</th>
                             <th className="pb-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Target Item</th>
                             <th className="pb-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount</th>
                             <th className="pb-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                             <th className="pb-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                          </tr>
                       </thead>
                        <tbody className="divide-y divide-white/5">
                           {payouts.length === 0 ? (
                              <tr><td colSpan="5" className="py-20 text-center text-xs text-slate-500 italic">No financial movements detected on this sector.</td></tr>
                           ) : (
                              payouts.map((p) => (
                                 <tr key={p._id} className="hover:bg-emerald-500/[0.02] transition-colors group">
                                    <td className="py-6 text-xs font-black text-slate-500 group-hover:text-emerald-500 transition-colors uppercase tracking-widest font-mono">#{(p._id || p.id || '').slice(-6).toUpperCase()}</td>
                                    <td className="py-6 pr-4">
                                       <p className="text-sm font-bold text-white mb-1">
                                         {p.assignment?.request?.itemName || p.settlementReason || 'Tactical Operation'}
                                       </p>
                                       <div className="flex items-center gap-2">
                                          <span className={`text-[8px] px-1.5 py-0.5 rounded border ${p.payoutCategory === 'compensation' ? 'text-amber-500 border-amber-500/30 bg-amber-500/5' : 'text-sky-500 border-sky-500/30 bg-sky-500/5'} font-black uppercase tracking-tighter`}>
                                            {p.payoutCategory === 'compensation' ? 'Search Fee' : 'Capture Bonus'}
                                          </span>
                                          <span className="text-[9px] text-slate-600 font-medium uppercase tracking-widest">
                                            {(p.payoutStatus === 'processed' || p.assignment?.status === 'completed' || p.assignment?.request?.requestStatus === 'completed') ? 'Synchronized' : 'In Transit'}
                                          </span>
                                       </div>
                                    </td>
                                    <td className="py-6 text-sm font-black text-emerald-500">{formatCurrency(p.payoutAmount)}</td>
                                    <td className="py-6"><StatusBadge value={p.payoutStatus} /></td>
                                    <td className="py-6 text-right text-[10px] text-slate-500 font-bold uppercase">{formatDate(p.createdAt)}</td>
                                 </tr>
                              ))
                           )}
                        </tbody>
                    </table>
                  </div>
               </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default FinderDashboardPage;
