const EmptyState = ({ title = 'No data found', description = 'Try again later.' }) => {
  return (
    <div className="pnf-panel p-6 text-center">
      <h3 className="pnf-heading text-lg font-semibold">{title}</h3>
      <p className="pnf-muted mt-1 text-sm">{description}</p>
    </div>
  );
};

export default EmptyState;
