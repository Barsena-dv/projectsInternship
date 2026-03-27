import { titleCase } from '../../utils/helpers';

const toneMap = {
  draft: 'bg-slate-100 text-slate-700',
  pending_payment: 'bg-amber-100 text-amber-800',
  pending: 'bg-amber-100 text-amber-800',
  open: 'bg-sky-100 text-sky-800',
  assigned: 'bg-indigo-100 text-indigo-800',
  evidence_submitted: 'bg-violet-100 text-violet-800',
  evidence_rejected: 'bg-rose-100 text-rose-800',
  verified: 'bg-emerald-100 text-emerald-800',
  deadline_active: 'bg-blue-100 text-blue-800',
  active: 'bg-emerald-100 text-emerald-800',
  inactive: 'bg-amber-100 text-amber-800',
  expired: 'bg-rose-100 text-rose-800',
  failed: 'bg-rose-100 text-rose-800',
  completed: 'bg-emerald-100 text-emerald-800',
  released: 'bg-emerald-100 text-emerald-800',
  found: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-rose-100 text-rose-800',
  cancelled: 'bg-slate-200 text-slate-700',
  locked: 'bg-orange-100 text-orange-800',
  refunded: 'bg-purple-100 text-purple-800',
  compensation: 'bg-cyan-100 text-cyan-800',
  resolved: 'bg-green-100 text-green-800',
  suspended: 'bg-orange-100 text-orange-800',
  blocked: 'bg-rose-100 text-rose-800',
};

const StatusBadge = ({ value }) => {
  const key = String(value || '').toLowerCase();
  const tone = toneMap[key] || 'bg-slate-100 text-slate-700';
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>{titleCase(key || 'unknown')}</span>;
};

export default StatusBadge;
