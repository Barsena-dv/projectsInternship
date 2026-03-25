const StatCard = ({ title, value, helper }) => {
  return (
    <article className="pnf-card p-5">
      <p className="text-sm text-slate-500">{title}</p>
      <h3 className="mt-2 text-2xl font-semibold text-slate-800">{value}</h3>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </article>
  );
};

export default StatCard;
