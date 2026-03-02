
const InputField = ({
    label,
    type = 'text',
    placeholder,
    value,
    onChange,
    error,
    name,
    required = false,
    className = ''
}) => {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {label && (
                <label className="text-sm font-medium text-text-primary px-1">
                    {label} {required && <span className="text-error">*</span>}
                </label>
            )}
            <input
                type={type}
                name={name}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                required={required}
                className={`
          w-full px-4 py-2.5 rounded-lg border bg-white/50 backdrop-blur-sm
          transition-all duration-200 outline-none
          ${error
                        ? 'border-error ring-1 ring-error/20'
                        : 'border-gray-200 focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/10'
                    }
          placeholder:text-gray-400 text-text-primary
        `}
            />
            {error && <p className="text-xs text-error px-1">{error}</p>}
        </div>
    );
};

export default InputField;
