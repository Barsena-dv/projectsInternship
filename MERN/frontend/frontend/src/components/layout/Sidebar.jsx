import { FiEdit3, FiFileText, FiUserCheck } from "react-icons/fi";
import { NavLink } from "react-router-dom";

const menuByRole = {
  owner: [
    { to: "/owner/create-request", label: "Create Request", icon: FiEdit3 },
    { to: "/owner/my-requests", label: "My Requests", icon: FiFileText },
  ],
  finder: [
    { to: "/finder/my-assignments", label: "My Assignments", icon: FiUserCheck },
  ],
};

export const Sidebar = ({ role }) => {
  const menuItems = menuByRole[role] ?? [];
  const roleLabel = role === "owner" ? "Owner" : "Finder";

  return (
    <aside className="sidebar-glass relative z-40 w-full border-b md:fixed md:inset-y-0 md:left-0 md:w-72 md:border-b-0 md:border-r">
      <div className="flex h-20 items-center justify-between border-b border-(--border) px-5">
        <div>
          <h1 className="theme-text text-xl font-bold tracking-tight">PostNFind</h1>
          <p className="text-(--primary) text-xs font-medium uppercase tracking-[0.14em]">Recovery Platform</p>
        </div>

        <span className="rounded-full border border-(--border) bg-(--bg) px-3 py-1 text-(--muted) text-xs font-semibold">
          {roleLabel}
        </span>
      </div>

      <nav className="flex gap-2 overflow-x-auto p-3 md:flex-col md:p-4">
        {menuItems.map((menuItem) => {
          const IconComponent = menuItem.icon;

          return (
            <NavLink
              key={menuItem.to}
              to={menuItem.to}
              className={({ isActive }) =>
                `inline-flex min-w-max items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? "gradient-primary text-white"
                    : "text-(--muted) hover:bg-(--bg-soft) hover:text-(--text)"
                }`
              }
            >
              <IconComponent className="h-4 w-4" />
              {menuItem.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="hidden p-4 md:block">
        <div className="glass-card rounded-2xl p-4 text-xs theme-muted">
          <p className="theme-text font-semibold">Quick Tip</p>
          <p className="mt-1 leading-relaxed">
            Keep request details complete to help finders verify evidence faster.
          </p>
        </div>
      </div>
    </aside>
  );
};
