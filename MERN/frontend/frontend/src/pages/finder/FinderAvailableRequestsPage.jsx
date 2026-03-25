import { useEffect, useMemo, useState } from 'react';
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

  const requestCurrentLocation = () => {
    setLocationError('');

    if (!navigator.geolocation) {
      setLocating(false);
      setLocationError('Geolocation is not supported on this browser.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFinderLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocating(false);
      },
      () => {
        setLocating(false);
        setLocationError('Unable to access location. Enable location for nearby request discovery.');
      },
      {
        enableHighAccuracy: false,
        timeout: 12000,
        maximumAge: 60 * 1000,
      }
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
      const appliedRows = applicationsRes.data || [];
      const appliedSet = new Set(
        appliedRows
          .filter((row) => ['pending', 'accepted'].includes(String(row?.status || '').toLowerCase()))
          .map((row) => String(row?.request?._id || row?.request || ''))
          .filter(Boolean)
      );

      setItems(rows);
      setAppliedIds(appliedSet);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    requestCurrentLocation();
  }, []);

  useEffect(() => {
    load();
  }, []);

  const discovery = useMemo(() => {
    if (!finderLocation) {
      return {
        radiusKm: null,
        rows: items.map((item) => ({ ...item, _distanceKm: Number.POSITIVE_INFINITY })),
      };
    }

    const mapped = items
      .map((item) => ({
        ...item,
        _distanceKm: calculateDistanceKm(
          finderLocation,
          { lat: item?.lastSeenLat, lng: item?.lastSeenLng }
        ),
      }))
      .sort((a, b) => a._distanceKm - b._distanceKm);

    let chosenRadius = 5;
    let rows = [];

    for (let radius = 1; radius <= 5; radius += 1) {
      const inRange = mapped.filter((item) => item._distanceKm <= radius);
      if (inRange.length > 0) {
        chosenRadius = radius;
        rows = inRange;
        break;
      }
    }

    if (rows.length === 0) {
      rows = mapped.filter((item) => item._distanceKm <= 5);
    }

    return {
      radiusKm: chosenRadius,
      rows,
    };
  }, [finderLocation, items]);

  const accept = async (requestId, payload = {}) => {
    try {
      setAcceptingId(requestId);
      await assignmentApi.accept(requestId, payload);
      setAppliedIds((prev) => new Set(prev).add(String(requestId)));
      setItems((prev) => prev.filter((item) => String(item?._id) !== String(requestId)));
      setApplyState({ open: false, requestId: '', itemName: '', applyReason: '', finderRegion: '' });
      toast.success('Application sent');
    } catch (error) {
      const message = getErrorMessage(error);
      const lower = String(message || '').toLowerCase();

      if (lower.includes('already applied')) {
        setAppliedIds((prev) => new Set(prev).add(String(requestId)));
        toast.info('Application already sent. Waiting for owner approval.');
        return;
      }

      toast.error(message);

      if (
        lower.includes('already been assigned')
        || lower.includes('no longer open')
      ) {
        setItems((prev) => prev.filter((item) => String(item?._id) !== String(requestId)));
        await load();
      }
    } finally {
      setAcceptingId(null);
    }
  };

  const openApplyModal = (item) => {
    setApplyState({
      open: true,
      requestId: String(item?._id || ''),
      itemName: item?.itemName || 'Request',
      applyReason: '',
      finderRegion: '',
    });
  };

  const submitApply = async () => {
    if (!applyState.requestId) return;
    await accept(applyState.requestId, {
      applyReason: applyState.applyReason,
      finderRegion: applyState.finderRegion,
    });
  };

  const openRequestDetails = () => {
    if (!selectedRequest?._id) return;
    navigate(`/finder/requests/${selectedRequest._id}`);
    setSelectedRequest(null);
  };

  return (
    <div>
      <PageHeader
        title="Available Requests"
        subtitle="Nearby open requests are shown in expanding bands: 1 km to 5 km."
        actions={(
          <button type="button" className="pnf-btn-outline rounded-lg px-3 py-2 text-sm" onClick={requestCurrentLocation}>
            Refresh Location
          </button>
        )}
      />

      {loading ? <LoadingSpinner text="Loading available requests..." /> : null}

      {!loading ? (
        <section className="mb-4 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
          {locating ? <p>Detecting your location...</p> : null}
          {!locating && finderLocation && discovery.radiusKm ? (
            <p>
              Showing nearest requests within <span className="font-semibold">{discovery.radiusKm} km</span>
            </p>
          ) : null}
          {!locating && !finderLocation ? (
            <p className="text-amber-700">{locationError || 'Location unavailable. Distance filters are disabled.'}</p>
          ) : null}
        </section>
      ) : null}

      {!loading && discovery.rows.length === 0 ? <EmptyState title="No nearby open requests" description="No open tasks found within 5 km right now." /> : null}

      {!loading && discovery.rows.length > 0 ? (
        <div className="space-y-3">
          {discovery.rows.map((item) => (
            <article className="pnf-card p-4" key={item._id}>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <StatusBadge value={item.requestStatus} />
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {item?.planId?.planName || 'Service plan'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-900">{item.itemName}</h3>
                  <p className="mt-1 text-sm text-slate-600">{item.itemDescription || 'No description available'}</p>

                  <div className="mt-2 grid gap-1 text-xs text-slate-500 sm:grid-cols-2">
                    <p><span className="font-medium text-slate-700">Distance:</span> {formatDistance(item._distanceKm)}</p>
                    <p><span className="font-medium text-slate-700">Location:</span> {item.lastSeenLocation || '-'}</p>
                    <p>
                      <span className="font-medium text-slate-700">Reward:</span>{' '}
                      {formatCurrency(item?.planId?.rewardAmount || 0)}
                    </p>
                    <p><span className="font-medium text-slate-700">Time:</span> {formatDate(item.createdAt)}</p>
                    <p><span className="font-medium text-slate-700">Category:</span> {item.itemCategory || '-'}</p>
                  </div>
                </div>

                <div className="flex min-w-40 flex-col gap-2">
                  <button
                    type="button"
                    className="pnf-btn-outline rounded-lg px-3 py-2 text-sm"
                    onClick={() => setSelectedRequest(item)}
                  >
                    View Request
                  </button>
                  <button
                    type="button"
                    className="pnf-btn-primary rounded-lg px-3 py-2 text-sm"
                    onClick={() => openApplyModal(item)}
                    disabled={acceptingId === item._id || appliedIds.has(String(item._id))}
                  >
                    {acceptingId === item._id
                      ? 'Applying...'
                      : appliedIds.has(String(item._id))
                        ? 'Application sent'
                        : 'Quick Apply'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <GlassModal
        open={applyState.open}
        title="Apply For Assignment"
        subtitle="Add optional reason and your region for owner visibility."
        confirmText="Submit Application"
        onClose={() => setApplyState({ open: false, requestId: '', itemName: '', applyReason: '', finderRegion: '' })}
        onConfirm={submitApply}
        loading={acceptingId === applyState.requestId}
      >
        <div className="space-y-3 text-sm text-slate-700">
          <p>
            Request: <span className="font-semibold">{applyState.itemName || '-'}</span>
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Region</label>
            <input
              className="pnf-input"
              type="text"
              placeholder="Your working area or city"
              value={applyState.finderRegion}
              onChange={(e) => setApplyState((prev) => ({ ...prev, finderRegion: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Reason</label>
            <textarea
              className="pnf-input"
              rows={3}
              placeholder="Why are you a good fit for this request?"
              value={applyState.applyReason}
              onChange={(e) => setApplyState((prev) => ({ ...prev, applyReason: e.target.value }))}
            />
          </div>
        </div>
      </GlassModal>

      <GlassModal
        open={Boolean(selectedRequest)}
        title="Take This Request?"
        subtitle="Do you want to take this request?"
        confirmText="Yes, Open Details"
        cancelText="Not Now"
        onClose={() => setSelectedRequest(null)}
        onConfirm={openRequestDetails}
      >
        <div className="space-y-2 text-sm text-slate-700">
          <p><span className="font-semibold">{selectedRequest?.itemName || '-'}</span></p>
          <p>{selectedRequest?.itemDescription || 'No description available.'}</p>
          <p>
            Distance: {formatDistance(calculateDistanceKm(
              finderLocation,
              { lat: selectedRequest?.lastSeenLat, lng: selectedRequest?.lastSeenLng }
            ))}
          </p>
        </div>
      </GlassModal>
    </div>
  );
};

export default FinderAvailableRequestsPage;
