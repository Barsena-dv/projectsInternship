import { NavLink } from 'react-router-dom';
import { 
  FiGrid, FiUsers, FiFileText, FiLink, FiAlertTriangle, 
  FiCreditCard, FiSearch, FiSettings, FiBell, FiShield, FiLogOut 
} from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';

const ADMIN_NAV = [
  { label: 'Overview', to: '/admin/overview', icon: FiGrid },
  { label: 'Users', to: '/admin/users', icon: FiUsers },
  { label: 'Requests', to: '/admin/requests', icon: FiFileText },
  { label: 'Assignments', to: '/admin/assignments', icon: FiLink },
  { label: 'Disputes', to: '/admin/disputes', icon: FiAlertTriangle },
  { label: 'Payments', to: '/admin/payments', icon: FiCreditCard },
  { label: 'Audit Logs', to: '/admin/logs', icon: FiSearch },
  { label: 'System Health', to: '/admin/health', icon: FiShield },
  { label: 'Settings', to: '/admin/settings', icon: FiSettings },
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
        <div className="mb-4">
          <p className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Main Menu</p>
          {ADMIN_NAV.slice(0, 6).map((item) => (
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

        <div>
          <p className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">System</p>
          {ADMIN_NAV.slice(6).map((item) => (
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
