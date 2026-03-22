import { useEffect } from "react";

const maxWidthClassBySize = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
};

export const Modal = ({
  isOpen,
  title,
  onClose,
  children,
  footer,
  size = "md",
}) => {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const widthClass = maxWidthClassBySize[size] ?? maxWidthClassBySize.md;

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className={`modal-panel glass-card w-full ${widthClass} p-5 sm:p-6`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="theme-text text-lg font-semibold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-(--border) px-2.5 py-1 text-sm theme-text transition hover:bg-(--bg-soft)"
          >
            Close
          </button>
        </div>

        <div>{children}</div>

        {footer ? <div className="mt-5 flex justify-end gap-2">{footer}</div> : null}
      </div>
    </div>
  );
};
