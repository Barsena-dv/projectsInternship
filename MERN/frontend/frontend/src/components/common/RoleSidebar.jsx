import { NavLink } from 'react-router-dom';
import { navByRole } from '../../utils/navigation';

const RoleSidebar = ({ role }) => {
  const navItems = navByRole[role] || [];

  return (
    <aside className="pnf-card h-fit p-3 md:sticky md:top-24">
      <nav className="space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block rounded-xl px-3 py-2 text-sm transition ${
                isActive ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
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
