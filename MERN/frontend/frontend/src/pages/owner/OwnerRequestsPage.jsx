import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import EmptyState from '../../components/common/EmptyState';
import GlassModal from '../../components/common/GlassModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import OwnerRequestCard from '../../components/owner/OwnerRequestCard';
import { assignmentApi, evidenceApi, notificationApi, paymentApi, requestApi } from '../../services/api';
import { getErrorMessage } from '../../utils/helpers';
import { deriveOwnerLifecycleState } from '../../utils/requestLifecycle';
import '../../styles/owner/request.css';
import '../../styles/owner/dashboard.css';

const getId = (v) => {
  if (!v) return null;
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && v._id) return v._id;
  return null;
};

const FILTERS = [
  { label: 'All',        value: null },
  { label: 'Draft',      value: 'draft' },
  { label: 'Pending',    value: 'pending_payment' },
  { label: 'Open',       value: 'open' },
  { label: 'Assigned',   value: 'assigned' },
  { label: 'Evidence',   value: 'evidence_submitted' },
  { label: 'Completed',  value: 'completed' },
  { label: 'Attention',  value: '__attention__' },
];

const OwnerRequestsPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await requestApi.my();
        const requests = res.data || [];

        const [paymentsRes, notificationsRes, assignmentEntries] = await Promise.all([
          paymentApi.my().catch(() => ({ data: [] })),
          notificationApi.my({ limit: 200, unreadOnly: true }).catch(() => ({ data: [] })),
          Promise.all(
            requests.map(async (req) => {
              try {
                const aRes = await assignmentApi.byRequest(req._id);
                return [req._id, aRes.data || null];
              } catch { return [req._id, null]; }
            })
          )
        ]);

        const assignmentByReqId = Object.fromEntries(assignmentEntries);
        const reqByAssignmentId = assignmentEntries.reduce((acc, [rid, a]) => {
          if (a?._id) acc[a._id] = rid;
          return acc;
        }, {});

        const assignmentIds = Object.keys(reqByAssignmentId);
        const evidenceEntries = await Promise.all(
          assignmentIds.map(async (aid) => {
            try {
              const eRes = await evidenceApi.byAssignment(aid);
              return [aid, eRes.data || null];
            } catch { return [aid, null]; }
          })
        );
        const evidenceByAssignmentId = Object.fromEntries(evidenceEntries);

        const paymentByReqId = (paymentsRes.data || []).reduce((acc, p) => {
          const rid = getId(p.requestId);
          if (!rid) return acc;
          const ex = acc[rid];
          if (!ex || new Date(p.updatedAt || p.createdAt || 0) >= new Date(ex.updatedAt || ex.createdAt || 0)) acc[rid] = p;
          return acc;
        }, {});

        const alertsByReqId = (notificationsRes.data || []).reduce((acc, n) => {
          const type = String(n.notificationType || n.type || '').toLowerCase();
          const title = String(n.title || '').toLowerCase();
          const msg = String(n.message || '').toLowerCase();
          const rid = getId(n.requestId || n.data?.requestId) || (n.assignmentId ? reqByAssignmentId[getId(n.assignmentId)] : null);
          if (!rid) return acc;
          const cur = acc[rid] || { newEvidence: false, newApplicant: false, newMessage: false };
          if (type.includes('evidence') || title.includes('evidence') || msg.includes('evidence')) cur.newEvidence = true;
          if (type.includes('finder') || type.includes('assignment') || type.includes('applicant') || title.includes('application') || msg.includes('appl')) cur.newApplicant = true;
          if (type.includes('message') || type.includes('chat') || title.includes('message') || msg.includes('message')) cur.newMessage = true;
          acc[rid] = cur;
          return acc;
        }, {});

        const enriched = requests.map((req) => {
          const assignment = assignmentByReqId[req._id] || null;
          const payment = paymentByReqId[req._id] || null;
          const evidence = assignment?._id ? evidenceByAssignmentId[assignment._id] || null : null;
          const lifecycleState = deriveOwnerLifecycleState({ request: req, payment, assignment, evidence });
          return { ...req, _lifecycleState: lifecycleState, _alerts: alertsByReqId[req._id] || { newEvidence: false, newApplicant: false, newMessage: false } };
        });

        setItems(enriched);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const confirmDelete = async () => {
    if (!deleteTarget?._id) return;
    try {
      setDeleteLoading(true);
      await requestApi.remove(deleteTarget._id);
      setItems((prev) => prev.filter((i) => i._id !== deleteTarget._id));
      toast.success('Draft deleted successfully.');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const ATTENTION = ['inactive', 'expired', 'failed'];
  const filtered = items.filter((item) => {
    const matchFilter = !activeFilter
      ? true
      : activeFilter === '__attention__'
        ? ATTENTION.includes(item._lifecycleState)
        : item._lifecycleState === activeFilter;
    const matchSearch = !search || (item.itemName || '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="owner-page-enter">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          My Requests
        </h1>
        <p style={{ margin: '0.35rem 0 0', color: '#64748b', fontSize: '0.875rem' }}>
          Track pending, open, assigned, and completed requests
        </p>
      </div>

      {/* Filter Bar */}
      <div className="owner-filter-bar">
        {/* Search */}
        <input
          type="text"
          placeholder="🔍 Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '0.4rem 1rem', borderRadius: '100px', border: '1.5px solid rgba(15,23,42,0.1)', fontSize: '0.82rem', outline: 'none', minWidth: '180px', transition: 'border-color 0.2s' }}
          onFocus={(e) => { e.target.style.borderColor = '#f59e0b'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.1)'; }}
          onBlur={(e) => { e.target.style.borderColor = 'rgba(15,23,42,0.1)'; e.target.style.boxShadow = 'none'; }}
        />
        {FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            className={`owner-filter-chip${activeFilter === f.value ? ' active' : ''}`}
            onClick={() => setActiveFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner text="Loading requests…" /> : null}

      {!loading && filtered.length === 0 ? (
        <EmptyState title="No requests found" description={search ? 'Try a different search.' : 'Create a request to start the workflow.'} />
      ) : null}

      {!loading && filtered.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginTop: '0.5rem' }}>
          {filtered.map((item) => (
            <OwnerRequestCard
              key={item._id}
              request={item}
              lifecycleState={item._lifecycleState}
              alerts={item._alerts}
              onEdit={(r) => navigate(`/owner/requests/${r._id}`)}
              onDelete={(r) => setDeleteTarget(r)}
              onPay={(r) => navigate(`/owner/requests/${r._id}`)}
              onViewApplicants={(r) => navigate(`/owner/requests/${r._id}`)}
            />
          ))}
        </div>
      ) : null}

      <GlassModal
        open={Boolean(deleteTarget)}
        title="Delete Draft Request?"
        subtitle="This will permanently remove this draft."
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        confirmText="Delete Draft"
        confirmClassName="rounded-lg border border-rose-600 bg-rose-600 text-white"
        loading={deleteLoading}
      >
        <div className="pnf-glass-soft rounded-xl p-3 text-sm text-slate-700">
          <p><span className="font-medium">Item:</span> {deleteTarget?.itemName || '-'}</p>
          <p><span className="font-medium">Category:</span> {deleteTarget?.itemCategory || '-'}</p>
        </div>
      </GlassModal>
    </div>
  );
};

export default OwnerRequestsPage;
