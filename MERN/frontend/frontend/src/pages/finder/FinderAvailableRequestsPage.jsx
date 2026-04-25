import { useEffect, useMemo, useState } from 'react';
import { FiActivity, FiMapPin, FiNavigation, FiTarget } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import EmptyState from '../../components/common/EmptyState';
import GlassModal from '../../components/common/GlassModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { assignmentApi, requestApi } from '../../services/api';
import { formatCurrency, formatDate, getErrorMessage } from '../../utils/helpers';
import { calculateDistanceKm, formatDistance } from '../../utils/locationDistance';

const FinderAvailableRequestsPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);
  const [appliedIds, setAppliedIds] = useState(() => new Set());
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [applyState, setApplyState] = useState({
    open: false,
    requestId: '',
    itemName: '',
    applyReason: '',
    finderRegion: '',
  });
  const [finderLocation, setFinderLocation] = useState(null);
  const [locating, setLocating] = useState(true);
  const [locationError, setLocationError] = useState('');
  const [filters, setFilters] = useState({
    query: '',
    category: 'all',
    sort: 'nearest',
    rewardMin: '',
  });

  const requestCurrentLocation = () => {
    setLocationError('');
    if (!navigator.geolocation) {
      setLocating(false);
      setLocationError('Geolocation protocol unsupported.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFinderLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocating(false);
        setLocationError('Signal lost. Enable location for discovery.');
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 60 * 1000 }
    );
  };

  const load = async () => {
    try {
      setLoading(true);
      const [res, applicationsRes] = await Promise.all([
        requestApi.available(),
        assignmentApi.myApplications().catch(() => ({ data: [] })),
      ]);
      const rows = (res.data || []).filter((row) => String(row?.requestStatus || '').toLowerCase() === 'open');
      const appliedSet = new Set(
        (applicationsRes.data || [])
          .filter((row) => ['pending', 'accepted'].includes(String(row?.status || '').toLowerCase()))
          .map((row) => String(row?.request?._id || row?.request || ''))
      );
      setItems(rows);
      setAppliedIds(appliedSet);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { requestCurrentLocation(); load(); }, []);

  const categories = useMemo(() => {
    const unique = new Set(items.map((item) => String(item?.itemCategory || '').trim()).filter(Boolean));
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const discovery = useMemo(() => {
    const now = Date.now();
    const mapped = items.map((item) => {
      const rewardAmount = Number(item?.planId?.rewardAmount || item?.rewardAmount || 0);
      const deadlineTs = new Date(item?.serviceDeadline || item?.lastSeenDatetime || item?.createdAt || now).getTime();
      const urgencyHours = Math.max((deadlineTs - now) / (1000 * 60 * 60), 0);

      return {
        ...item,
        _rewardAmount: rewardAmount,
        _urgencyHours: urgencyHours,
        _distanceKm: finderLocation
          ? calculateDistanceKm(finderLocation, { lat: item?.lastSeenLat, lng: item?.lastSeenLng })
          : Infinity,
      };
    });

    const normalizedQuery = String(filters.query || '').trim().toLowerCase();
    const minReward = Number(filters.rewardMin || 0);

    const filtered = mapped.filter((item) => {
      const queryMatches = !normalizedQuery
        || String(item?.itemName || '').toLowerCase().includes(normalizedQuery)
        || String(item?.itemDescription || '').toLowerCase().includes(normalizedQuery)
        || String(item?.lastSeenLocation || '').toLowerCase().includes(normalizedQuery);

      const categoryMatches = filters.category === 'all'
        || String(item?.itemCategory || '').toLowerCase() === String(filters.category || '').toLowerCase();

      const rewardMatches = item._rewardAmount >= minReward;
      return queryMatches && categoryMatches && rewardMatches;
    });

    filtered.sort((a, b) => {
      if (filters.sort === 'reward_high') return b._rewardAmount - a._rewardAmount;
      if (filters.sort === 'urgent') return a._urgencyHours - b._urgencyHours;
      if (filters.sort === 'newest') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      return a._distanceKm - b._distanceKm;
    });

    if (!finderLocation) return { radiusKm: null, rows: filtered };

    let chosenRadius = 5;
    let rows = [];
    for (let r = 1; r <= 5; r++) {
      const inRange = filtered.filter(item => item._distanceKm <= r);
      if (inRange.length > 0) { chosenRadius = r; rows = inRange; break; }
    }
    if (rows.length === 0) rows = filtered.filter(item => item._distanceKm <= 5);
    return { radiusKm: chosenRadius, rows };
  }, [finderLocation, items, filters]);

  const accept = async (requestId, payload = {}) => {
    try {
      setAcceptingId(requestId);
      await assignmentApi.accept(requestId, payload);
      setAppliedIds((prev) => new Set(prev).add(String(requestId)));
      setItems((prev) => prev.filter((item) => String(item?._id) !== String(requestId)));
      setApplyState({ open: false, requestId: '', itemName: '', applyReason: '', finderRegion: '' });
      toast.success('Synchronization initiated. Application broadcasted.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setAcceptingId(null);
    }
  };

  const openApplyModal = (item) => {
    setApplyState({
      open: true,
      requestId: String(item?._id || ''),
      itemName: item?.itemName || 'Target',
      applyReason: '',
      finderRegion: '',
    });
  };

  if (loading) return <LoadingSpinner text="Scanning frequencies..." />;

  const sectionLabel = "text-[10px] font-black text-emerald-500/60 uppercase tracking-[0.2em] mb-4 block";

  return (
    <div className="finder-page-enter finder-page-shell space-y-8">
      <PageHeader
        title="Signal Discovery"
        subtitle="Detection radar for nearby recovery missions within a 5km operational radius"
        actions={(
          <button onClick={requestCurrentLocation} className="pnf-btn-primary px-5! flex items-center gap-2">
            <FiNavigation size={14} /> <span className="uppercase text-[10px] tracking-widest">Recalibrate Radar</span>
          </button>
        )}
      />

      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Radar Status Side */}
        <div className="lg:col-span-4 space-y-6">
           <div className="finder-section-card bg-emerald-500/5 border-emerald-500/10!">
              <span className={sectionLabel}>Radar Analytics</span>
              <div className="space-y-6">
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-bold uppercase tracking-widest">Status</span>
                    {locating ? <span className="text-emerald-500 animate-pulse font-black">SCANNING...</span> : <span className="text-emerald-500 font-black">ACTIVE</span>}
                 </div>
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-bold uppercase tracking-widest">Radius</span>
                    <span className="text-white font-black">{discovery.radiusKm || '5'} KM</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-bold uppercase tracking-widest">Signals Found</span>
                    <span className="text-white font-black">{discovery.rows.length}</span>
                 </div>
                 <div className="pt-6 border-t border-white/5">
                    <p className="text-[10px] text-slate-500 italic leading-relaxed">
                      Signals are sorted by discovery proximity. Priority targets appear at the top of the interface.
                    </p>
                 </div>
              </div>
           </div>

           <div className="p-6 rounded-3xl bg-slate-950/80 border border-white/5 relative overflow-hidden group">
              <FiTarget className="absolute -right-4 -bottom-4 text-emerald-500/10" size={100} />
              <div className="relative z-10">
                 <h4 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-2">Tactical Note</h4>
                 <p className="text-xs text-slate-400 leading-relaxed italic">
                    Ensure your identification is synchronized before broadcast. Requester verification is required.
                 </p>
              </div>
           </div>
        </div>

        {/* Discovery List */}
        <div className="lg:col-span-8 space-y-6">
          <div className="finder-section-card bg-slate-950/70">
            <span className={sectionLabel}>Discovery Filters</span>
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
              <input
                className="pnf-input"
                type="text"
                placeholder="Search item/location"
                value={filters.query}
                onChange={(event) => setFilters((prev) => ({ ...prev, query: event.target.value }))}
              />
              <select
                className="pnf-input"
                value={filters.category}
                onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))}
              >
                <option value="all">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <input
                className="pnf-input"
                type="number"
                min="0"
                placeholder="Min reward"
                value={filters.rewardMin}
                onChange={(event) => setFilters((prev) => ({ ...prev, rewardMin: event.target.value }))}
              />
              <select
                className="pnf-input"
                value={filters.sort}
                onChange={(event) => setFilters((prev) => ({ ...prev, sort: event.target.value }))}
              >
                <option value="nearest">Sort: nearest</option>
                <option value="reward_high">Sort: reward high</option>
                <option value="urgent">Sort: urgent</option>
                <option value="newest">Sort: newest</option>
              </select>
            </div>
          </div>

          {discovery.rows.length === 0 ? (
            <EmptyState title="Operational Void" description="No open recovery signals detected on this frequency." />
          ) : (
            <div className="grid gap-4">
              {discovery.rows.map((item) => (
                <article key={item._id} className="f-card-interactive p-6 relative group overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-40 group-hover:opacity-100 transition-opacity">
                     <StatusBadge value={item.requestStatus} />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
                     <div className="hidden sm:flex w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 items-center justify-center text-emerald-500 shrink-0 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all duration-300">
                        <FiActivity size={32} />
                     </div>
                     <div className="flex-1 w-full">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 pr-16 sm:pr-12">
                           <h3 className="text-base sm:text-lg font-black text-white">{item.itemName}</h3>
                           <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest wrap-break-word max-w-full">
                             {item?.planId?.planName}
                           </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2 mb-4">{item.itemDescription || 'No description available'}</p>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6 pt-4 border-t border-white/5">
                           <div className="space-y-1">
                              <span className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase">Proximity</span>
                              <div className="text-xs font-black text-emerald-500">{formatDistance(item._distanceKm)}</div>
                           </div>
                           <div className="space-y-1 hidden sm:block">
                              <span className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase">Detection</span>
                              <div className="text-xs font-black text-white">{formatDate(item.createdAt)}</div>
                           </div>
                           <div className="space-y-1">
                              <span className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase">Extraction Reward</span>
                              <div className="text-xs font-black text-emerald-500">{formatCurrency(item?.planId?.rewardAmount || 0)}</div>
                           </div>
                        </div>

                        <div className="mt-6 sm:mt-8 flex justify-end gap-2 sm:gap-3">
                           <button onClick={() => setSelectedRequest(item)} className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl border border-white/10 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all w-full sm:w-auto text-center">Details</button>
                           <button 
                             onClick={() => openApplyModal(item)} 
                             disabled={appliedIds.has(String(item._id))}
                             className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_5px_15px_rgba(16,185,129,0.2)] disabled:opacity-50 w-full sm:w-auto text-center"
                           >
                             {appliedIds.has(String(item._id)) ? 'Signal Sent' : 'Engage'}
                           </button>
                        </div>
                     </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

      </div>

      <GlassModal
        open={applyState.open}
        title="Extraction Protocol"
        subtitle="Initialize your recovery proposal for the requester review."
        confirmText="Broadcast Proposal"
        onClose={() => setApplyState({ open: false, requestId: '', itemName: '', applyReason: '', finderRegion: '' })}
        onConfirm={() => accept(applyState.requestId, { applyReason: applyState.applyReason, finderRegion: applyState.finderRegion })}
        loading={acceptingId === applyState.requestId}
      >
        <div className="space-y-6 text-sm">
          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 mb-6">
             <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block mb-1">Target Identified</span>
             <p className="text-white font-bold">{applyState.itemName}</p>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Deployment Region</label>
            <input className="pnf-input" type="text" placeholder="Your operational base" value={applyState.finderRegion} onChange={(e) => setApplyState((prev) => ({ ...prev, finderRegion: e.target.value }))} />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Mission Rationale</label>
            <textarea className="pnf-input" rows={3} placeholder="Experience or proximity details..." value={applyState.applyReason} onChange={(e) => setApplyState((prev) => ({ ...prev, applyReason: e.target.value }))} />
          </div>
        </div>
      </GlassModal>

      {/* Simplified details modal */}
      <GlassModal
        open={Boolean(selectedRequest)}
        title="Signal Intel"
        confirmText="Initialize View"
        cancelText="Stow"
        onClose={() => setSelectedRequest(null)}
        onConfirm={() => { navigate(`/finder/requests/${selectedRequest._id}`); setSelectedRequest(null); }}
      >
        <div className="space-y-4">
           <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
              <FiMapPin className="text-emerald-500" />
              <div className="text-xs">
                 <span className="block text-slate-500">Last Known Pulse</span>
                 <span className="text-white font-bold">{selectedRequest?.lastSeenLocation}</span>
              </div>
           </div>
           <p className="text-sm text-slate-400 leading-relaxed italic border-l-2 border-emerald-500/30 pl-4">
             "{selectedRequest?.itemDescription || 'Operational summary unavailable.'}"
           </p>
        </div>
      </GlassModal>
    </div>
  );
};

export default FinderAvailableRequestsPage;
