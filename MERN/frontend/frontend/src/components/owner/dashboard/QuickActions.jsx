import { FiCreditCard, FiList, FiPlusCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import '../../../styles/owner/dashboard.css';

const ACTIONS = [
  { label: 'Create Request', icon: <FiPlusCircle size={14} />, to: '/owner/create-request', variant: 'primary' },
  { label: 'My Requests',    icon: <FiList size={14} />,       to: '/owner/requests',        variant: '' },
  { label: 'Payments',       icon: <FiCreditCard size={14} />, to: '/owner/payments',         variant: '' },
];

const QuickActions = () => (
  <div className="owner-quick-actions">
    {ACTIONS.map((a) => (
      <Link key={a.label} to={a.to} className={`owner-quick-btn${a.variant ? ` ${a.variant}` : ''}`}>
        {a.icon} {a.label}
      </Link>
    ))}
  </div>
);

export default QuickActions;
