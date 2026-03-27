import '../../../styles/owner/dashboard.css';

const ICON_MAP = {
  open:               '🔓',
  draft:              '📝',
  pending_payment:    '💳',
  assigned:           '👤',
  evidence_submitted: '📷',
  verified:           '✅',
  completed:          '🏁',
  failed:             '❌',
  expired:            '⏰',
  cancelled:          '🚫',
  inactive:           '😴',
  default:            '📋',
};

const ActivityTimeline = ({ items = [] }) => {
  if (!items.length) return <p style={{ fontSize: '0.82rem', color: '#9ca3af', textAlign: 'center', padding: '1rem 0', margin: 0 }}>No recent activity</p>;

  return (
    <div className="owner-timeline">
      {items.map((item, i) => (
        <div key={item.id} className="owner-timeline-item">
          <div className="timeline-dot-wrap">
            <div className="timeline-dot">{ICON_MAP[item.type] || ICON_MAP.default}</div>
            {i < items.length - 1 && <div className="timeline-line" />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="timeline-title">{item.title}</p>
            <p className="timeline-meta">{String(item.description || '').replace(/_/g, ' ')} · {item.timestamp ? new Date(item.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityTimeline;
