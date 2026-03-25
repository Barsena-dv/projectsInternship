const ComingSoon = ({ title = 'Coming Soon', description = 'This feature is in progress.' }) => {
  return (
    <section className="pnf-card p-6">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </section>
  );
};

export default ComingSoon;
