
export const PrimaryButton = ({
    children,
    onClick,
    type = 'button',
    disabled = false,
    className = '',
    fullWidth = false
}) => {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`
        px-6 py-2.5 rounded-lg font-semibold text-white
        bg-primary-blue hover:bg-deep-indigo active:scale-[0.98]
        transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
        shadow-md shadow-primary-blue/20
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
        >
            {children}
        </button>
    );
};

export const SecondaryButton = ({
    children,
    onClick,
    type = 'button',
    disabled = false,
    className = '',
    fullWidth = false
}) => {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`
        px-6 py-2.5 rounded-lg font-semibold text-text-primary
        bg-white border border-gray-200 hover:bg-gray-50 active:scale-[0.98]
        transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
        >
            {children}
        </button>
    );
};
