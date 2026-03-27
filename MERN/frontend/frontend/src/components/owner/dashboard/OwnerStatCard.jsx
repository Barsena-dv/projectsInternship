import '../../../styles/owner/dashboard.css';

const ACCENTS = [
  'stat-accent-indigo',
  'stat-accent-blue',
  'stat-accent-green',
  'stat-accent-amber',
  'stat-accent-red',
  'stat-accent-teal',
  'stat-accent-violet',
];

const OwnerStatCard = ({ title, value, icon = '📊', helper, gradientIndex = 0 }) => {
  const accent = ACCENTS[gradientIndex % ACCENTS.length];
  return (
    <article className={`owner-stat-card ${accent}`}>
      <div className="stat-icon-wrap">{icon}</div>
      <div className="stat-value">{value ?? '—'}</div>
      <div className="stat-title">{title}</div>
      {helper ? <div className="stat-helper">{helper}</div> : null}
    </article>
  );
};

export default OwnerStatCard;
