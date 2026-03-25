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
      <div className="relative w-full max-w-lg rounded-2xl border border-white/40 bg-white/70 p-5 shadow-[0_20px_70px_rgba(2,6,23,0.25)] backdrop-blur-xl">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
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
