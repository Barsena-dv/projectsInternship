import { FiMessageSquare, FiList, FiPlusCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import '../../../styles/owner/dashboard.css';

const ACTIONS = [
  { label: 'Create Request', icon: <FiPlusCircle size={16} />, to: '/owner/create-request', variant: 'primary' },
  { label: 'My Requests',    icon: <FiList size={16} />,       to: '/owner/requests',        variant: '' },
  { label: 'Chat',           icon: <FiMessageSquare size={16} />, to: '/owner/chat',            variant: '' },
];

const QuickActions = () => (
  <div className="owner-quick-actions flex items-center gap-2">
    {ACTIONS.map((a) => (
      <Link key={a.label} to={a.to} className={`owner-quick-btn flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${a.variant === 'primary' ? 'primary' : 'bg-white/5 border border-white/10 hover:border-amber-500/50 hover:text-amber-400'}`}>
        {a.icon}
        <span className="hidden sm:inline font-bold text-[13px]">{a.label}</span>
      </Link>
    ))}
  </div>
);

export default QuickActions;
