const PAYMENT_OPEN_STATUSES = new Set(['locked', 'released']);

export const normalizeStatus = (value, fallback = 'unknown') => String(value || fallback).toLowerCase();

export const deriveOwnerLifecycleState = ({ request, payment, assignment, evidence }) => {
  const requestStatus = normalizeStatus(request?.requestStatus);
  const paymentStatus = normalizeStatus(payment?.paymentStatus, 'none');
  const evidenceStatus = normalizeStatus(evidence?.verificationStatus, 'none');

  if (requestStatus === 'completed' || requestStatus === 'found' || paymentStatus === 'released' || assignment?.status === 'completed') {
    return 'completed';
  }

  if (requestStatus === 'assigned') {
    if (evidenceStatus === 'verified') return 'verified';
    if (Boolean(assignment?.evidenceSubmitted) || evidenceStatus === 'pending') return 'evidence_submitted';
    return 'assigned';
  }

  if (requestStatus === 'open' || PAYMENT_OPEN_STATUSES.has(paymentStatus)) {
    return 'open';
  }

  if (requestStatus === 'pending_payment') {
    if (!payment) return 'draft';
    if (paymentStatus === 'pending') return 'pending_payment';
    return 'draft';
  }

  return requestStatus;
};

export const getLifecycleLabel = (state) => {
  switch (state) {
    case 'draft':
      return 'Draft';
    case 'pending_payment':
      return 'Pending Payment';
    case 'open':
      return 'Open';
    case 'assigned':
      return 'Assigned';
    case 'evidence_submitted':
      return 'Evidence Submitted';
    case 'verified':
      return 'Verified';
    case 'completed':
      return 'Completed';
    default:
      return state;
  }
};

export const getLifecycleTone = (state) => {
  switch (state) {
    case 'draft':
      return 'bg-slate-100 text-slate-700';
    case 'pending_payment':
      return 'bg-amber-100 text-amber-800';
    case 'open':
      return 'bg-sky-100 text-sky-800';
    case 'assigned':
      return 'bg-indigo-100 text-indigo-800';
    case 'evidence_submitted':
      return 'bg-violet-100 text-violet-800';
    case 'verified':
      return 'bg-emerald-100 text-emerald-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};
