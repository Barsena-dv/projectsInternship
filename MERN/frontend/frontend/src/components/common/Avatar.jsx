const sizeClassByToken = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

const getInitials = (name) => {
  const cleanName = String(name ?? "").trim();

  if (!cleanName) {
    return "PN";
  }

  const parts = cleanName.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
};

export const Avatar = ({ name, src, size = "md", className = "" }) => {
  const sizeClass = sizeClassByToken[size] ?? sizeClassByToken.md;

  return (
    <div className={`avatar-shell ${sizeClass} ${className}`.trim()}>
      {src ? (
        <img src={src} alt={name ?? "Avatar"} className="avatar-image" />
      ) : (
        <span className="font-semibold tracking-wide">{getInitials(name)}</span>
      )}
    </div>
  );
};
