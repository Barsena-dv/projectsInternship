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

    // Prevent scrolling on body when modal is open
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
        className="absolute inset-0 bg-stone-950/40 backdrop-blur-md" 
        onClick={!loading ? onClose : undefined} 
        aria-hidden="true" 
      />
      
      {/* Panel */}
      <div className="pnf-modal-panel relative w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-white/10 overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="mb-4">
            <h3 className="pnf-heading text-xl font-bold text-white tracking-tight">{title}</h3>
            {subtitle ? <p className="text-stone-400 mt-1 text-sm leading-relaxed">{subtitle}</p> : null}
          </div>

          <div className="mt-2 text-stone-200">{children}</div>

          <div className="mt-8 flex items-center justify-end gap-3">
            <button
              type="button"
              className="pnf-btn-outline rounded-xl px-5 py-2.5 text-sm font-semibold transition-all hover:bg-white/5"
              onClick={onClose}
              disabled={loading}
            >
              {cancelText}
            </button>
            <button
              type="button"
              className={`${confirmClassName} rounded-xl px-5 py-2.5 text-sm font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition-all`}
              onClick={onConfirm}
              disabled={loading || confirmDisabled}
            >
              {loading ? 'Please wait...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default GlassModal;

