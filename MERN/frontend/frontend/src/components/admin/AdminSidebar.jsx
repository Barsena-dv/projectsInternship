import { FiClock, FiShield, FiUsers } from "react-icons/fi";
import { NavLink, Outlet } from "react-router-dom";

export const AdminSidebar = () => {
    const baseStyle = "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition";

    const activeStyle = "bg-blue-600 text-white";

    const inactiveStyle = "text-slate-600 hover:bg-slate-100 hover:text-slate-900";

    return (
        <div className="mesh-backdrop flex min-h-dvh">

            <aside className="w-72 border-r border-slate-200/80 bg-white/85 backdrop-blur-sm">
                <div className="flex h-20 items-center justify-between border-b border-slate-200 px-5">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">PostNFind</h1>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Admin Console</p>
                    </div>

                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                        Admin
                    </span>
                </div>

                <nav className="p-4">
                    <NavLink
                        to="/admin/users"
                        className={({ isActive }) => `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`}
                    >
                        <FiUsers className="h-4 w-4" />
                        Users
                    </NavLink>
                </nav>

                <div className="space-y-2 px-4 pb-4">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                            <FiClock className="h-3.5 w-3.5" />
                            Coming Soon
                        </p>
                        <p className="mt-1 text-sm text-slate-600">Payments, disputes, and audit modules.</p>
                    </div>

                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        <p className="inline-flex items-center gap-2 font-semibold">
                            <FiShield className="h-4 w-4" />
                            Protected admin access
                        </p>
                    </div>
                </div>
            </aside>

            <main className="flex-1 p-4 sm:p-6 md:p-8">
                <Outlet />
            </main>
        </div>
    );
};