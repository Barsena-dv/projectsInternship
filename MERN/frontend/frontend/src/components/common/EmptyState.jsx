const EmptyState = ({ title = 'No data found', description = 'Try again later.' }) => {
  return (
    <div className="pnf-card p-6 text-center">
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
};

export default EmptyState;
