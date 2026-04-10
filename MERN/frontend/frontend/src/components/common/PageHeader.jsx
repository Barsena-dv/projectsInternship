const PageHeader = ({ title, subtitle, actions }) => {
  return (
    <div className="pnf-page-header" style={{
      marginBottom: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      position: 'relative',
      paddingLeft: '1rem',
    }}>
      {/* Accent bar */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: '4px',
        bottom: '4px',
        width: '3px',
        borderRadius: '4px',
        background: 'linear-gradient(180deg, #6366f1, #a78bfa)',
      }} />

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem' }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: 800,
            color: '#fff',
            letterSpacing: '-0.03em',
            lineHeight: 1.2,
          }}>
            {title}
          </h1>
          {subtitle ? (
            <p style={{
              margin: '0.35rem 0 0',
              fontSize: '0.85rem',
              color: '#94a3b8',
              fontWeight: 400,
            }}>
              {subtitle}
            </p>
          ) : null}
        </div>
        {actions ? <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>{actions}</div> : null}
      </div>
    </div>
  );
};

export default PageHeader;
