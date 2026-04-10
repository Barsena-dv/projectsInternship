import { Link } from 'react-router-dom';
import { FiHome, FiLock } from 'react-icons/fi';

const UnauthorizedPage = () => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#030712',
      position: 'relative',
      overflow: 'hidden',
      padding: '2rem',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        top: '30%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(244,63,94,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative',
        zIndex: 10,
        textAlign: 'center',
        animation: 'pageSlideIn 500ms cubic-bezier(0.16, 1, 0.3, 1) both',
      }}>
        {/* Lock icon with shield effect */}
        <div style={{
          position: 'relative',
          display: 'inline-block',
          marginBottom: '2rem',
        }}>
          <div style={{
            width: '80px', height: '80px',
            borderRadius: '24px',
            background: 'rgba(244, 63, 94, 0.08)',
            border: '1px solid rgba(244, 63, 94, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f43f5e',
            margin: '0 auto',
            animation: 'emptyFloat 3s ease-in-out infinite',
          }}>
            <FiLock size={32} />
          </div>
          {/* Pulse ring */}
          <div style={{
            position: 'absolute',
            inset: '-12px',
            border: '1px solid rgba(244, 63, 94, 0.08)',
            borderRadius: '30px',
            animation: 'emptyPulse 3s ease-in-out infinite',
          }} />
        </div>

        <h2 style={{
          margin: 0,
          fontSize: '1.5rem',
          fontWeight: 800,
          color: '#e2e8f0',
          letterSpacing: '-0.02em',
        }}>
          Access Denied
        </h2>
        <p style={{
          margin: '0.75rem 0 2rem',
          fontSize: '0.9rem',
          color: '#64748b',
          maxWidth: '400px',
          lineHeight: 1.6,
        }}>
          You don't have the required permissions to access this page. Please sign in with the correct account.
        </p>

        <Link to="/" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 2rem',
          background: '#6366f1',
          color: '#fff',
          borderRadius: '14px',
          fontSize: '0.85rem',
          fontWeight: 700,
          transition: 'all 0.2s',
          boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)',
        }}>
          <FiHome size={16} />
          Return Home
        </Link>
      </div>

      <style>{`
        @keyframes emptyFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes emptyPulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.3; transform: scale(1.1); } }
      `}</style>
    </div>
  );
};

export default UnauthorizedPage;
