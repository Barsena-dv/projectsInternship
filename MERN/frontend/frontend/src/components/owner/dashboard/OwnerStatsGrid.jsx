import OwnerStatCard from './OwnerStatCard';
import '../../../styles/owner/dashboard.css';

/**
 * StatsGrid — responsive 4-col grid of gradient stat cards
 * Props: stats[] = [{ title, value, icon, helper, gradientIndex }]
 */
const OwnerStatsGrid = ({ stats = [] }) => (
  <div className="owner-stats-grid owner-stagger">
    {stats.map((s, i) => (
      <OwnerStatCard key={s.title} {...s} gradientIndex={i} />
    ))}
  </div>
);

export default OwnerStatsGrid;
