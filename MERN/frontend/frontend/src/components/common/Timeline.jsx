export const Timeline = ({ items = [], className = "" }) => {
  if (!Array.isArray(items) || items.length === 0) {
    return <p className="theme-muted text-sm">No timeline data.</p>;
  }

  return (
    <ol className={`grid gap-4 ${className}`.trim()}>
      {items.map((item, index) => (
        <li key={`${item.label}-${index}`} className="relative grid grid-cols-[1.2rem_1fr] gap-3">
          <div className="relative flex justify-center">
            <span className="timeline-item-dot mt-1" />
            {index < items.length - 1 ? (
              <span className="absolute top-4 h-[calc(100%+0.55rem)] w-px bg-(--border)" />
            ) : null}
          </div>

          <div className="pb-0.5">
            <p className="theme-muted text-xs font-semibold uppercase tracking-[0.08em]">{item.label}</p>
            <p className="theme-text mt-0.5 text-sm font-medium">{item.value ?? "-"}</p>
          </div>
        </li>
      ))}
    </ol>
  );
};
