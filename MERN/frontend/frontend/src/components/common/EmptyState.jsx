import { FiInbox } from 'react-icons/fi';

const EmptyState = ({ 
  title = 'No data found', 
  description = 'Try again later.',
  icon,
  actionText,
  onAction 
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 2rem',
      textAlign: 'center',
      animation: 'pageSlideIn 400ms cubic-bezier(0.16, 1, 0.3, 1) both',
    }}>
      {/* Animated ring + icon */}
      <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
        <div style={{
          width: '72px', height: '72px',
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b',
          animation: 'emptyFloat 4s ease-in-out infinite',
        }}>
          {icon || <FiInbox size={28} />}
        </div>
        {/* Pulse ring */}
        <div style={{
          position: 'absolute',
          inset: '-8px',
          border: '1px solid rgba(255, 255, 255, 0.04)',
          borderRadius: '24px',
          animation: 'emptyPulse 3s ease-in-out infinite',
        }} />
      </div>

      <h3 style={{
        margin: 0,
        fontSize: '1rem',
        fontWeight: 700,
        color: '#e2e8f0',
        letterSpacing: '-0.01em',
      }}>
        {title}
      </h3>
      <p style={{
        margin: '0.5rem 0 0',
        fontSize: '0.82rem',
        color: '#64748b',
        maxWidth: '320px',
        lineHeight: 1.6,
      }}>
        {description}
      </p>

      {actionText && onAction && (
        <button
          onClick={onAction}
          style={{
            marginTop: '1.25rem',
            padding: '0.5rem 1.5rem',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#fff',
            background: '#6366f1',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
          }}
        >
          {actionText}
        </button>
      )}

      <style>{`
        @keyframes emptyFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes emptyPulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.3; transform: scale(1.08); } }
      `}</style>
    </div>
  );
};

export default EmptyState;
