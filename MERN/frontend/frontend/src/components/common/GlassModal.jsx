import { useEffect } from 'react';

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

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose, loading]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-md" onClick={!loading ? onClose : undefined} aria-hidden="true" />
      <div className="pnf-modal-panel relative w-full max-w-lg rounded-2xl p-5">
        <div className="mb-4">
          <h3 className="pnf-heading text-lg font-semibold">{title}</h3>
          {subtitle ? <p className="pnf-muted mt-1 text-sm">{subtitle}</p> : null}
        </div>

        <div>{children}</div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            className="pnf-btn-outline rounded-lg px-3 py-2 text-sm"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`${confirmClassName} rounded-lg px-3 py-2 text-sm`}
            onClick={onConfirm}
            disabled={loading || confirmDisabled}
          >
            {loading ? 'Please wait...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlassModal;
