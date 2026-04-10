const LoadingSpinner = ({ text = 'Loading...' }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 1.5rem',
      minHeight: '280px',
      gap: '1.5rem',
      animation: 'pageSlideIn 400ms cubic-bezier(0.16, 1, 0.3, 1) both',
    }}>
      {/* SVG animated spinner */}
      <div style={{ position: 'relative', width: '48px', height: '48px' }}>
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ animation: 'spin 1.2s linear infinite' }}>
          <circle cx="24" cy="24" r="20" stroke="rgba(255,255,255,0.06)" strokeWidth="3" fill="none" />
          <circle cx="24" cy="24" r="20" stroke="url(#spinner-grad)" strokeWidth="3" fill="none"
            strokeLinecap="round" strokeDasharray="90 150" strokeDashoffset="0" />
          <defs>
            <linearGradient id="spinner-grad" x1="0" y1="0" x2="48" y2="48">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
        </svg>
        {/* Pulsing core */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '8px', height: '8px',
          borderRadius: '50%',
          background: '#6366f1',
          boxShadow: '0 0 16px rgba(99, 102, 241, 0.5)',
          animation: 'pulse 2s ease-in-out infinite',
        }} />
      </div>

      <div style={{ textAlign: 'center' }}>
        <p style={{
          margin: 0,
          fontSize: '0.8rem',
          fontWeight: 700,
          color: '#94a3b8',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          {text}
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); } 50% { opacity: 0.4; transform: translate(-50%, -50%) scale(0.6); } }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
