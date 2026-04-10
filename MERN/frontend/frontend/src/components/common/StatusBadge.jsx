import { titleCase } from '../../utils/helpers';

const toneMap = {
  draft:              { bg: 'rgba(148,163,184,0.10)', text: '#94a3b8', dot: '#94a3b8' },
  pending_payment:    { bg: 'rgba(245,158,11,0.10)', text: '#fbbf24', dot: '#f59e0b' },
  pending:            { bg: 'rgba(245,158,11,0.10)', text: '#fbbf24', dot: '#f59e0b' },
  open:               { bg: 'rgba(56,189,248,0.10)', text: '#38bdf8', dot: '#0ea5e9' },
  assigned:           { bg: 'rgba(99,102,241,0.10)', text: '#a5b4fc', dot: '#6366f1' },
  evidence_submitted: { bg: 'rgba(139,92,246,0.10)', text: '#c4b5fd', dot: '#8b5cf6' },
  evidence_rejected:  { bg: 'rgba(244,63,94,0.10)', text: '#fb7185', dot: '#f43f5e' },
  verified:           { bg: 'rgba(16,185,129,0.10)', text: '#6ee7b7', dot: '#10b981' },
  deadline_active:    { bg: 'rgba(59,130,246,0.10)', text: '#93c5fd', dot: '#3b82f6' },
  active:             { bg: 'rgba(16,185,129,0.10)', text: '#6ee7b7', dot: '#10b981' },
  inactive:           { bg: 'rgba(245,158,11,0.08)', text: '#fcd34d', dot: '#f59e0b' },
  expired:            { bg: 'rgba(244,63,94,0.10)', text: '#fb7185', dot: '#f43f5e' },
  failed:             { bg: 'rgba(244,63,94,0.10)', text: '#fb7185', dot: '#f43f5e' },
  completed:          { bg: 'rgba(16,185,129,0.10)', text: '#6ee7b7', dot: '#10b981' },
  released:           { bg: 'rgba(16,185,129,0.10)', text: '#6ee7b7', dot: '#10b981' },
  found:              { bg: 'rgba(16,185,129,0.10)', text: '#6ee7b7', dot: '#10b981' },
  rejected:           { bg: 'rgba(244,63,94,0.10)', text: '#fb7185', dot: '#f43f5e' },
  cancelled:          { bg: 'rgba(148,163,184,0.08)', text: '#94a3b8', dot: '#64748b' },
  locked:             { bg: 'rgba(251,146,60,0.10)', text: '#fdba74', dot: '#fb923c' },
  refunded:           { bg: 'rgba(168,85,247,0.10)', text: '#d8b4fe', dot: '#a855f7' },
  compensation:       { bg: 'rgba(6,182,212,0.10)', text: '#67e8f9', dot: '#06b6d4' },
  resolved:           { bg: 'rgba(34,197,94,0.10)', text: '#86efac', dot: '#22c55e' },
  suspended:          { bg: 'rgba(251,146,60,0.10)', text: '#fdba74', dot: '#fb923c' },
  blocked:            { bg: 'rgba(244,63,94,0.10)', text: '#fb7185', dot: '#f43f5e' },
  processed:          { bg: 'rgba(16,185,129,0.10)', text: '#6ee7b7', dot: '#10b981' },
};

const defaultTone = { bg: 'rgba(148,163,184,0.08)', text: '#94a3b8', dot: '#64748b' };

const StatusBadge = ({ value }) => {
  const key = String(value || '').toLowerCase();
  const tone = toneMap[key] || defaultTone;
  
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 12px 4px 10px',
      borderRadius: '100px',
      fontSize: '0.7rem',
      fontWeight: 700,
      letterSpacing: '0.03em',
      textTransform: 'uppercase',
      color: tone.text,
      background: tone.bg,
      border: `1px solid ${tone.bg}`,
      backdropFilter: 'blur(8px)',
      whiteSpace: 'nowrap',
      lineHeight: 1.4,
      animation: 'badgeFadeIn 300ms cubic-bezier(0.16, 1, 0.3, 1) both',
    }}>
      <span style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: tone.dot,
        flexShrink: 0,
        boxShadow: `0 0 6px ${tone.dot}40`,
      }} />
      {titleCase(key || 'unknown')}

      <style>{`
        @keyframes badgeFadeIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </span>
  );
};

export default StatusBadge;
