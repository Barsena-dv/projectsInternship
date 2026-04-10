import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiAlertTriangle, FiCheckCircle, FiImage, FiShield } from 'react-icons/fi';
import { toast } from 'react-toastify';
import EmptyState from '../../components/common/EmptyState';
import GlassModal from '../../components/common/GlassModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { adminApi } from '../../services/api';
import { formatDate, getErrorMessage } from '../../utils/helpers';

const AdminEvidencePage = () => {
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [details, setDetails] = useState(null);
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [actionModal, setActionModal] = useState({ open: false, mode: '', note: '' });

  const loadAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.assignments({ limit: 120 });
      setAssignments(res?.data?.rows || []);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDetails = useCallback(async (assignmentId) => {
    if (!assignmentId) return;
    try {
      const res = await adminApi.assignmentDetails(assignmentId);
      setDetails(res?.data || null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const filtered = useMemo(() => assignments.filter((row) => {
    const hasEvidence = Boolean(row.evidenceSubmitted);
    if (verificationFilter === 'all') return hasEvidence;
    if (verificationFilter === 'verified') return row.evidenceVerified === true;
    if (verificationFilter === 'pending') return hasEvidence && row.evidenceVerified === false;
    return true;
  }), [assignments, verificationFilter]);

  const executeOverride = async () => {
    if (!selectedId) return;
    try {
      const reason = actionModal.note.trim() || 'Admin evidence override.';
      if (actionModal.mode === 'approve') {
        await adminApi.updateAssignmentStatus(selectedId, { status: 'completed', reason: `Evidence override approved: ${reason}` });
        toast.success('Evidence override accepted and assignment marked completed.');
      }
      if (actionModal.mode === 'flag') {
        await adminApi.updateAssignmentStatus(selectedId, { status: 'failed', reason: `Evidence flagged as suspicious: ${reason}` });
        toast.success('Evidence flagged as fake and assignment marked failed.');
      }
      setActionModal({ open: false, mode: '', note: '' });
      await loadAssignments();
      await loadDetails(selectedId);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Evidence Monitoring"
        subtitle="Review evidence payloads, override outcomes, and flag suspicious submissions"
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <article className="admin-card h-170 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Evidence Queue</h3>
            <select
              value={verificationFilter}
              onChange={(event) => setVerificationFilter(event.target.value)}
              className="bg-transparent text-[10px] uppercase tracking-wider font-black border border-white/5 rounded px-2 py-1 text-white"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
            {loading ? <div className="py-32"><LoadingSpinner /></div> : null}
            {!loading && filtered.length === 0 ? <EmptyState title="No evidence rows" description="No assignments with evidence in this filter." /> : null}
            {!loading && filtered.map((row) => {
              const selected = selectedId === row._id;
              return (
                <button
                  type="button"
                  key={row._id}
                  onClick={() => {
                    setSelectedId(row._id);
                    loadDetails(row._id);
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${selected ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-white/5 border-white/5 hover:bg-white/8'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-white uppercase tracking-wide truncate">{row?.request?.itemName || 'Unknown Request'}</p>
                    <StatusBadge value={row.evidenceVerified ? 'verified' : row.evidenceSubmitted ? 'pending' : 'none'} />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Finder: {row?.finder?.full_name || '-'}</p>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-3">Updated {formatDate(row.updatedAt)}</p>
                </button>
              );
            })}
          </div>
        </article>

        <article className="admin-card h-170 flex flex-col">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Evidence Forensics</h3>
          {!details?.evidence ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState title="Select an evidence row" description="Choose an assignment to view files and verification data." />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-5">
              <section className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Verification</p>
                  <StatusBadge value={details.evidence.verificationStatus || 'pending'} />
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Files Uploaded</p>
                  <p className="text-2xl text-white font-black">{details?.evidence?.files?.length || 0}</p>
                </div>
              </section>

              <section className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <h4 className="text-xs font-black text-white uppercase tracking-wider mb-3">Media Assets</h4>
                <div className="space-y-2">
                  {(details?.evidence?.files || []).map((file, index) => (
                    <a
                      key={`${file.url}-${index}`}
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/5 hover:border-indigo-500/20"
                    >
                      <span className="text-xs text-slate-300 flex items-center gap-2">
                        <FiImage className="text-indigo-400" /> {file.fileType || 'file'}
                      </span>
                      <span className="text-[10px] text-indigo-300 uppercase tracking-wider font-black">Open</span>
                    </a>
                  ))}
                </div>
              </section>

              <section className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20">
                <h4 className="text-xs font-black text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <FiShield /> Admin Override Controls
                </h4>
                <p className="text-xs text-slate-300 mb-4">
                  Use override actions only when verification requires direct intervention. All overrides are logged as assignment status updates.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="px-3 py-2 text-[10px] uppercase tracking-widest font-black rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-2"
                    onClick={() => setActionModal({ open: true, mode: 'approve', note: '' })}
                  >
                    <FiCheckCircle /> Override Verified
                  </button>
                  <button
                    type="button"
                    className="px-3 py-2 text-[10px] uppercase tracking-widest font-black rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-2"
                    onClick={() => setActionModal({ open: true, mode: 'flag', note: '' })}
                  >
                    <FiAlertTriangle /> Flag Fake Evidence
                  </button>
                </div>
              </section>
            </div>
          )}
        </article>
      </div>

      <GlassModal
        open={actionModal.open}
        onClose={() => setActionModal({ open: false, mode: '', note: '' })}
        onConfirm={executeOverride}
        title={actionModal.mode === 'approve' ? 'Override Evidence as Verified' : 'Flag Evidence as Fake'}
        subtitle="Document an auditable reason before applying this action."
        confirmText={actionModal.mode === 'approve' ? 'Apply Verification Override' : 'Flag Evidence'}
        confirmClassName={actionModal.mode === 'approve' ? 'pnf-btn-primary' : 'pnf-btn-primary bg-rose-600 border-rose-600'}
      >
        <textarea
          className="w-full min-h-28 bg-slate-900/80 border border-white/10 rounded-xl p-3 text-sm text-white outline-none"
          value={actionModal.note}
          onChange={(event) => setActionModal((prev) => ({ ...prev, note: event.target.value }))}
          placeholder="Write clear evidence justification for this override..."
        />
      </GlassModal>
    </div>
  );
};

export default AdminEvidencePage;
