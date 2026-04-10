import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import EmptyState from '../../components/common/EmptyState';
import GlassModal from '../../components/common/GlassModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { assignmentApi, evidenceApi, requestApi } from '../../services/api';
import { getErrorMessage } from '../../utils/helpers';

const resolveFileUrl = (file) => file?.url || file?.secure_url || file?.fileUrl || file?.path || '';

const EvidenceFileItem = ({ file, index }) => {
  const type = String(file?.fileType || '').toLowerCase();
  const fileUrl = resolveFileUrl(file);
  const [isLoaded, setIsLoaded] = useState(type === 'document');
  const [hasError, setHasError] = useState(false);

  if (!fileUrl) {
    return (
      <div className="flex h-36 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 p-2 text-center text-xs text-rose-700">
        File URL missing
      </div>
    );
  }

  if (type === 'document') {
    return (
      <a
        className="flex h-36 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-2 text-center text-xs font-medium text-blue-700 hover:bg-blue-50"
        href={fileUrl}
        target="_blank"
        rel="noreferrer"
      >
        Open Document
      </a>
    );
  }

  return (
    <div className="relative h-36 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
      {!isLoaded && !hasError ? (
        <div className="absolute inset-0 flex animate-pulse items-center justify-center bg-slate-100 text-[11px] font-medium text-slate-500">
          Loading evidence...
        </div>
      ) : null}

      {hasError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-rose-50 p-2 text-center text-xs text-rose-700">
          Unable to load file
        </div>
      ) : null}

      {type === 'video' ? (
        <video
          className={`h-36 w-full object-cover transition-opacity ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          controls
          src={fileUrl}
          onLoadedData={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        >
          <track kind="captions" />
        </video>
      ) : (
        <a href={fileUrl} target="_blank" rel="noreferrer" className="block h-full w-full">
          <img
            className={`h-36 w-full object-cover transition-opacity ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            src={fileUrl}
            alt={`evidence-${index + 1}`}
            loading="lazy"
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
          />
        </a>
      )}
    </div>
  );
};

const EvidenceFiles = ({ files }) => {
  if (!Array.isArray(files) || files.length === 0) {
    return <p className="mt-2 text-xs text-slate-500">No files uploaded.</p>;
  }

  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {files.map((file, index) => {
        const key = file.cloudinaryId || resolveFileUrl(file) || `${index}`;
        return <EvidenceFileItem key={key} file={file} index={index} />;
      })}
    </div>
  );
};

const OwnerEvidenceVerificationPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [verifyState, setVerifyState] = useState({
    open: false,
    evidenceId: '',
    verified: true,
    notes: '',
    claimAnswers: {
      identifyingMarks: '',
      contents: '',
      proofReference: '',
    },
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const reqRes = await requestApi.my();
      const requests = reqRes.data || [];

      const items = await Promise.all(
        requests.map(async (request) => {
          try {
            const assignmentRes = await assignmentApi.byRequest(request._id);
            const assignment = assignmentRes?.data?.assignment || assignmentRes?.data || assignmentRes || null;
            if (!assignment?._id) return null;
            const evidenceRes = await evidenceApi.byAssignment(assignment._id).catch(() => ({ data: null }));
            const evidence = evidenceRes?.data || evidenceRes || null;
            return { request, assignment, evidence };
          } catch {
            return null;
          }
        })
      );

      setRows(items.filter(Boolean).filter((x) => x.evidence));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const verify = async (evidenceId, verified) => {
    setVerifyState({
      open: true,
      evidenceId,
      verified,
      notes: '',
      claimAnswers: {
        identifyingMarks: '',
        contents: '',
        proofReference: '',
      },
    });
  };

  const submitVerification = async () => {
    const { evidenceId, verified, notes, claimAnswers } = verifyState;
    if (!evidenceId) return;

    try {
      setActionLoading(true);
      await evidenceApi.verify(evidenceId, { verified, notes, claimAnswers });
      toast.success(verified ? 'Evidence accepted' : 'Evidence rejected');
      setVerifyState({
        open: false,
        evidenceId: '',
        verified: true,
        notes: '',
        claimAnswers: {
          identifyingMarks: '',
          contents: '',
          proofReference: '',
        },
      });
      await loadData();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Evidence Verification" subtitle="Review submitted finder evidence and accept/reject" />

      {loading ? <LoadingSpinner text="Loading evidence..." /> : null}

      {!loading && rows.length === 0 ? <EmptyState title="No evidence pending" description="Evidence submissions will appear here." /> : null}

      {!loading && rows.length > 0 ? (
        <div className="space-y-3">
          {rows.map(({ request, assignment, evidence }) => (
            <article key={evidence._id} className="pnf-card p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">{request.itemName}</h3>
                  <p className="text-sm text-slate-600">Finder: {assignment.finder?.full_name || '-'}</p>
                  <p className="mt-1 text-sm text-slate-500">{evidence.description || 'No description'}</p>
                  <EvidenceFiles files={evidence.files} />
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge value={evidence.verificationStatus} />
                  {evidence.verificationStatus === 'pending' ? (
                    <>
                      <button className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white" type="button" disabled={actionLoading} onClick={() => verify(evidence._id, true)}>
                        Accept
                      </button>
                      <button className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white" type="button" disabled={actionLoading} onClick={() => verify(evidence._id, false)}>
                        Reject
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <GlassModal
        open={verifyState.open}
        title={verifyState.verified ? 'Accept Evidence' : 'Reject Evidence'}
        subtitle={verifyState.verified ? 'Provide claim details for hidden-data matching before approval.' : 'Add rejection notes before submitting your decision.'}
        onClose={() => setVerifyState({
          open: false,
          evidenceId: '',
          verified: true,
          notes: '',
          claimAnswers: {
            identifyingMarks: '',
            contents: '',
            proofReference: '',
          },
        })}
        onConfirm={submitVerification}
        confirmText={verifyState.verified ? 'Accept' : 'Reject'}
        confirmClassName={verifyState.verified ? 'pnf-btn-primary' : 'rounded-lg border border-rose-600 bg-rose-600 text-white'}
        loading={actionLoading}
      >
        {verifyState.verified ? (
          <div className="mb-4 grid gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Identifying Marks</label>
              <input
                className="pnf-input"
                value={verifyState.claimAnswers.identifyingMarks}
                onChange={(e) => setVerifyState((prev) => ({
                  ...prev,
                  claimAnswers: { ...prev.claimAnswers, identifyingMarks: e.target.value },
                }))}
                placeholder="Color, scratches, sticker marks, unique traits"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Contents / Item Details</label>
              <input
                className="pnf-input"
                value={verifyState.claimAnswers.contents}
                onChange={(e) => setVerifyState((prev) => ({
                  ...prev,
                  claimAnswers: { ...prev.claimAnswers, contents: e.target.value },
                }))}
                placeholder="What was inside / exact details"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Proof Reference</label>
              <input
                className="pnf-input"
                value={verifyState.claimAnswers.proofReference}
                onChange={(e) => setVerifyState((prev) => ({
                  ...prev,
                  claimAnswers: { ...prev.claimAnswers, proofReference: e.target.value },
                }))}
                placeholder="Bill ID / IMEI / purchase screenshot reference"
              />
            </div>
          </div>
        ) : null}
        <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
        <textarea
          className="pnf-input"
          rows={4}
          placeholder="Optional notes for finder"
          value={verifyState.notes}
          onChange={(e) => setVerifyState((prev) => ({ ...prev, notes: e.target.value }))}
        />
      </GlassModal>
    </div>
  );
};

export default OwnerEvidenceVerificationPage;
