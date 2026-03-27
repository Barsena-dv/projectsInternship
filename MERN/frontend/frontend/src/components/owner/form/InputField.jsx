import '../../../styles/owner/form.css';

/**
 * InputField — floating label input with icon and error support
 * Props: label, name, value, onChange, type, icon (ReactNode), error, required, as ('input'|'select'|'textarea'), children (for select options), rows
 */
const InputField = ({
  label,
  name,
  value,
  onChange,
  type = 'text',
  icon,
  error,
  required = false,
  as: Tag = 'input',
  children,
  rows = 3,
  placeholder = ' ',
  className = '',
  ...rest
}) => {
  const inputClass = Tag === 'input'
    ? 'owner-field-input'
    : Tag === 'select'
      ? 'owner-field-select'
      : 'owner-field-textarea';

  return (
    <div className={`owner-field${error ? ' has-error' : ''} ${className}`}>
      {Tag === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          rows={rows}
          placeholder={placeholder}
          className={inputClass}
          required={required}
          style={{ resize: 'vertical', paddingTop: '1.4rem' }}
          {...rest}
        />
      ) : Tag === 'select' ? (
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          className={inputClass}
          required={required}
          {...rest}
        >
          {children}
        </select>
      ) : (
        <input
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          type={type}
          placeholder={placeholder}
          className={inputClass}
          required={required}
          style={icon ? { paddingRight: '2.5rem' } : {}}
          {...rest}
        />
      )}

      <label htmlFor={name} className="owner-field-label">{label}{required ? ' *' : ''}</label>

      {icon ? <span className="owner-field-icon">{icon}</span> : null}

      {error ? (
        <p className="owner-field-error">⚠ {error}</p>
      ) : null}
    </div>
  );
};

export default InputField;
