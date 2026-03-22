const variantClassMap = {
  primary: "gradient-primary",
  accent: "gradient-accent",
};

export const GradientButton = ({
  type = "button",
  variant = "primary",
  className = "",
  children,
  ...props
}) => {
  const variantClass = variantClassMap[variant] ?? variantClassMap.primary;

  return (
    <button
      type={type}
      className={`gradient-button btn-glow ${variantClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
};
