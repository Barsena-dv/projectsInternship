const StatCard = ({ title, value, helper, icon }) => {
  return (
    <article style={{
      background: 'rgba(255, 255, 255, 0.03)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      borderRadius: '16px',
      padding: '1.25rem 1.375rem',
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      cursor: 'default',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.5)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
    }}
    >
      {/* Corner glow */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: '80px', height: '80px',
        background: 'radial-gradient(circle at top right, rgba(99,102,241,0.06), transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
        <div>
          <p style={{
            margin: 0,
            fontSize: '0.7rem',
            fontWeight: 700,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>
            {title}
          </p>
          <h3 style={{
            margin: '0.5rem 0 0',
            fontSize: '1.75rem',
            fontWeight: 800,
            color: '#f1f5f9',
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}>
            {value}
          </h3>
          {helper ? (
            <p style={{
              margin: '0.25rem 0 0',
              fontSize: '0.72rem',
              color: '#475569',
              fontWeight: 500,
            }}>
              {helper}
            </p>
          ) : null}
        </div>
        {icon ? (
          <div style={{
            width: '40px', height: '40px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6366f1',
            fontSize: '1.1rem',
            transition: 'all 0.3s',
          }}>
            {icon}
          </div>
        ) : null}
      </div>
    </article>
  );
};

export default StatCard;
