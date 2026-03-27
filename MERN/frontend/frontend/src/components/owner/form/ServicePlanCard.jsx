import '../../../styles/owner/form.css';

/**
 * ServicePlanCard — selectable plan/category card with hover glow
 * Props: id, name, description, icon, selected, onSelect
 */
const ServicePlanCard = ({ id, name, description, icon = '📦', selected = false, onSelect }) => (
  <div
    className={`owner-plan-card${selected ? ' selected' : ''}`}
    onClick={() => onSelect(id)}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === 'Enter' && onSelect(id)}
  >
    <div className="plan-check">✓</div>
    <div className="plan-icon">{icon}</div>
    <div className="plan-name">{name}</div>
    {description ? <div className="plan-desc">{description}</div> : null}
  </div>
);

export default ServicePlanCard;
