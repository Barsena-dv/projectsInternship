import React from "react";
import { NavLink, Outlet } from "react-router-dom";

export const AdminSidebar = () => {
    const baseStyle =
        "flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition";

    const activeStyle =
        "bg-[#2563EB]/10 text-[#2563EB]";

    const inactiveStyle =
        "text-gray-600 hover:bg-gray-100 hover:text-[#1E40AF]";

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">

            {/* SIDEBAR */}
            <aside className="w-64 bg-white border-r border-gray-200 shadow-sm flex flex-col">

                {/* Header */}
                <div className="h-16 flex items-center px-6 border-b border-gray-200">
                    <h1 className="text-lg font-semibold text-[#1E40AF]">
                        PostNFind Admin
                    </h1>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-2">

                    <NavLink
                        to="/admin/dashboard"
                        className={({ isActive }) =>
                            `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`
                        }
                    >
                        Dashboard
                    </NavLink>

                    <NavLink
                        to="/admin/users"
                        className={({ isActive }) =>
                            `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`
                        }
                    >
                        Users
                    </NavLink>

                    <NavLink
                        to="/admin/agents"
                        className={({ isActive }) =>
                            `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`
                        }
                    >
                        Recovery Agents
                    </NavLink>

                    <NavLink
                        to="/admin/requests"
                        className={({ isActive }) =>
                            `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`
                        }
                    >
                        Requests
                    </NavLink>

                    <NavLink
                        to="/admin/payments"
                        className={({ isActive }) =>
                            `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`
                        }
                    >
                        Payments & Escrow
                    </NavLink>

                    <NavLink
                        to="/admin/disputes"
                        className={({ isActive }) =>
                            `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`
                        }
                    >
                        Disputes
                    </NavLink>

                    <NavLink
                        to="/admin/refunds"
                        className={({ isActive }) =>
                            `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`
                        }
                    >
                        Refund Logs
                    </NavLink>

                    <NavLink
                        to="/admin/audit"
                        className={({ isActive }) =>
                            `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`
                        }
                    >
                        Audit Logs
                    </NavLink>

                    <NavLink
                        to="/admin/settings"
                        className={({ isActive }) =>
                            `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`
                        }
                    >
                        Settings
                    </NavLink>

                </nav>

                {/* Footer */}
                <div className="px-4 py-4 border-t border-gray-200 text-xs text-gray-500">
                    Admin Control Panel
                </div>

            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 p-8">
                <Outlet />
            </main>

        </div>
    );
};