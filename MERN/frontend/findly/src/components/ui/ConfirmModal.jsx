import { useEffect } from 'react';

const ConfirmModal = ({
    isOpen,
    title = 'Are you sure?',
    message = 'This action cannot be undone.',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
    danger = true,
}) => {
    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[999] flex items-center justify-center p-4"
            aria-modal="true"
            role="dialog"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Dialog */}
            <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 flex flex-col gap-4 animate-[fadeInScale_0.18s_ease]">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto
                    ${danger ? 'bg-red-50' : 'bg-primary-blue/10'}`}>
                    {danger ? (
                        <svg className="w-6 h-6 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6 text-primary-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                </div>

                {/* Text */}
                <div className="text-center">
                    <h3 className="text-base font-bold text-text-primary">{title}</h3>
                    <p className="text-sm text-text-secondary mt-1">{message}</p>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 mt-1">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-text-primary text-sm font-semibold hover:bg-gray-50 transition-colors"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-2.5 rounded-lg text-white text-sm font-semibold transition-colors
                            ${danger
                                ? 'bg-error hover:bg-red-700'
                                : 'bg-primary-blue hover:bg-deep-indigo'}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
