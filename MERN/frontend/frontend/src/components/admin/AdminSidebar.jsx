import {
    FiAlertTriangle,
    FiBarChart2,
    FiBell,
    FiCamera,
    FiCreditCard,
    FiDollarSign,
    FiFileText,
    FiGrid,
    FiLink,
    FiLogOut,
    FiMapPin,
    FiMessageSquare,
    FiRotateCcw,
    FiSearch,
    FiSettings,
    FiShield,
    FiUsers,
} from 'react-icons/fi';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const ADMIN_NAV = [
  { label: 'Dashboard', to: '/admin/overview', icon: FiGrid, group: 'control' },
  { label: 'User Management', to: '/admin/users', icon: FiUsers, group: 'operations' },
  { label: 'Request Management', to: '/admin/requests', icon: FiFileText, group: 'operations' },
  { label: 'Assignment Management', to: '/admin/assignments', icon: FiLink, group: 'operations' },
  { label: 'Tracking Monitoring', to: '/admin/tracking', icon: FiMapPin, group: 'operations' },
  { label: 'Evidence Monitoring', to: '/admin/evidence', icon: FiCamera, group: 'operations' },
  { label: 'Chat Monitoring', to: '/admin/chat-monitor', icon: FiMessageSquare, group: 'operations' },
  { label: 'Payment Management', to: '/admin/payments', icon: FiCreditCard, group: 'financial' },
  { label: 'Refund Management', to: '/admin/refunds', icon: FiRotateCcw, group: 'financial' },
  { label: 'Payout Management', to: '/admin/payouts', icon: FiDollarSign, group: 'financial' },
  { label: 'Dispute Management', to: '/admin/disputes', icon: FiAlertTriangle, group: 'financial' },
  { label: 'Notification Control', to: '/admin/notifications', icon: FiBell, group: 'governance' },
  { label: 'Analytics Dashboard', to: '/admin/analytics', icon: FiBarChart2, group: 'governance' },
  { label: 'Audit Logs', to: '/admin/logs', icon: FiSearch, group: 'governance' },
  { label: 'Security Signals', to: '/admin/security', icon: FiShield, group: 'governance' },
  { label: 'System Settings', to: '/admin/settings', icon: FiSettings, group: 'governance' },
];

const NAV_GROUPS = [
  { id: 'control', label: 'Control' },
  { id: 'operations', label: 'Operations' },
  { id: 'financial', label: 'Financial' },
  { id: 'governance', label: 'Governance' },
];

const AdminSidebar = () => {
  const { logout } = useAuth();

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-header">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <FiShield className="text-white" size={18} />
        </div>
        <div>
          <h1 className="text-white font-black tracking-tight text-sm">PostNFind</h1>
          <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Admin Control</p>
        </div>
      </div>

      <nav className="admin-sidebar-nav custom-scrollbar">
        {NAV_GROUPS.map((group) => (
          <div key={group.id} className="mb-4">
            <p className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{group.label}</p>
            {ADMIN_NAV.filter((item) => item.group === group.id).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
        >
          <FiLogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
