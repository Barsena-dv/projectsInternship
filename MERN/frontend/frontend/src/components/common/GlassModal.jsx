import { useEffect } from 'react';
import { createPortal } from 'react-dom';

const GlassModal = ({
  open,
  title,
  subtitle,
  children,
  onClose,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmClassName = 'pnf-btn-primary',
  confirmDisabled = false,
  loading = false,
}) => {
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !loading) {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose, loading]);

  if (!open) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0" 
        style={{
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          animation: 'modalBackdropIn 200ms ease both',
        }}
        onClick={!loading ? onClose : undefined} 
        aria-hidden="true" 
      />
      
      {/* Panel */}
      <div 
        className="pnf-modal-panel relative w-full max-w-lg overflow-hidden"
        style={{
          borderRadius: '1.5rem',
          padding: '2rem',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08) inset',
          animation: 'modalPanelIn 300ms cubic-bezier(0.16, 1, 0.3, 1) both',
        }}
      >
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-violet-500/8 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="mb-5">
            <h3 style={{
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: 800,
              color: '#fff',
              letterSpacing: '-0.02em',
            }}>
              {title}
            </h3>
            {subtitle ? (
              <p style={{
                margin: '0.5rem 0 0',
                fontSize: '0.85rem',
                color: '#94a3b8',
                lineHeight: 1.5,
              }}>
                {subtitle}
              </p>
            ) : null}
          </div>

          <div style={{ color: '#cbd5e1' }}>{children}</div>

          <div className="mt-8 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '0.625rem 1.25rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#94a3b8',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: loading ? 0.5 : 1,
              }}
              onMouseEnter={(e) => { if (!loading) { e.target.style.background = 'rgba(255,255,255,0.08)'; e.target.style.color = '#e2e8f0'; } }}
              onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.05)'; e.target.style.color = '#94a3b8'; }}
            >
              {cancelText}
            </button>
            <button
              type="button"
              className={confirmClassName}
              onClick={onConfirm}
              disabled={loading || confirmDisabled}
              style={{
                padding: '0.625rem 1.25rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                borderRadius: '12px',
                transition: 'all 0.2s',
                cursor: (loading || confirmDisabled) ? 'not-allowed' : 'pointer',
                opacity: (loading || confirmDisabled) ? 0.5 : 1,
              }}
            >
              {loading ? 'Please wait...' : confirmText}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modalBackdropIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalPanelIn { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default GlassModal;
