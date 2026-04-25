import { NavLink } from 'react-router-dom';
import { navByRole } from '../../utils/navigation';

const RoleSidebar = ({ role }) => {
  const navItems = navByRole[role] || [];

  return (
    <aside className="pnf-card h-fit p-3 md:sticky md:top-24 pnf-sidebar-modern">
      <nav className="space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block rounded-xl px-3 py-2 text-sm font-medium transition ${
                isActive ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-300/30' : 'text-slate-300 hover:bg-white/6 hover:text-white border border-transparent'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default RoleSidebar;
