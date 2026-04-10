import { Link } from 'react-router-dom';
import { FiHome, FiAlertTriangle } from 'react-icons/fi';

const NotFoundPage = () => {
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
        top: '20%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative',
        zIndex: 10,
        textAlign: 'center',
        animation: 'pageSlideIn 500ms cubic-bezier(0.16, 1, 0.3, 1) both',
      }}>
        {/* Animated 404 */}
        <div style={{ position: 'relative', marginBottom: '2rem' }}>
          <h1 style={{
            margin: 0,
            fontSize: 'clamp(6rem, 20vw, 12rem)',
            fontWeight: 900,
            letterSpacing: '-0.06em',
            lineHeight: 1,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.15))',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            userSelect: 'none',
          }}>
            404
          </h1>
          {/* Floating icon */}
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '64px', height: '64px',
            borderRadius: '20px',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6366f1',
            animation: 'emptyFloat 3s ease-in-out infinite',
          }}>
            <FiAlertTriangle size={28} />
          </div>
        </div>

        <h2 style={{
          margin: 0,
          fontSize: '1.5rem',
          fontWeight: 800,
          color: '#e2e8f0',
          letterSpacing: '-0.02em',
        }}>
          Page Not Found
        </h2>
        <p style={{
          margin: '0.75rem 0 2rem',
          fontSize: '0.9rem',
          color: '#64748b',
          maxWidth: '400px',
          lineHeight: 1.6,
        }}>
          The page you're looking for doesn't exist or has been moved to a different location.
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
        @keyframes emptyFloat { 0%, 100% { transform: translate(-50%, -50%) translateY(0); } 50% { transform: translate(-50%, -50%) translateY(-10px); } }
      `}</style>
    </div>
  );
};

export default NotFoundPage;
