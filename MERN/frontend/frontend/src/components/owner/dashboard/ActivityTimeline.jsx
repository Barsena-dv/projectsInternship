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
      {items.map((item, i) => {
        const type = String(item.type || '').toLowerCase();
        let statusClass = 'pending';
        if (type.includes('open')) statusClass = 'open';
        if (type.includes('completed') || type.includes('verified')) statusClass = 'completed';
        if (type.includes('failed') || type.includes('expired') || type.includes('cancelled')) statusClass = 'failed';

        return (
          <div key={item.id} className="owner-timeline-item">
            <div className="timeline-dot-wrap">
              <div className={`timeline-dot ${statusClass}`}>
                {ICON_MAP[item.type] || ICON_MAP.default}
              </div>
              {i < items.length - 1 && <div className="timeline-line" />}
            </div>
            <div className="timeline-content">
              <p className="timeline-title">{item.title}</p>
              <p className="timeline-meta">
                <span>{String(item.description || '').replace(/_/g, ' ')}</span>
                {item.timestamp && (
                  <span>
                    {new Date(item.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                )}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};


export default ActivityTimeline;
