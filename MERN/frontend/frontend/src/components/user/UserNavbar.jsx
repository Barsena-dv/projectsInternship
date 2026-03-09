import React from "react";
import { NavLink, Outlet } from "react-router-dom";

export const UserNavbar = () => {
    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col">

            {/* NAVBAR */}
            <nav className="bg-white border-b border-gray-200 shadow-sm">

                <div className="max-w-7xl mx-auto px-6">

                    <div className="flex items-center justify-between h-16">

                        {/* Logo */}
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-semibold text-[#1E40AF]">
                                PostNFind
                            </span>
                        </div>

                        {/* Navigation Links */}
                        <div className="hidden md:flex items-center gap-8 text-sm font-medium">

                            <NavLink
                                to="/user/userlist"
                                className={({ isActive }) =>
                                    isActive
                                        ? "text-[#2563EB] border-b-2 border-[#2563EB] pb-1"
                                        : "text-gray-600 hover:text-[#2563EB] transition"
                                }
                            >
                                Users
                            </NavLink>

                            <NavLink
                                to="/user/requests"
                                className={({ isActive }) =>
                                    isActive
                                        ? "text-[#2563EB] border-b-2 border-[#2563EB] pb-1"
                                        : "text-gray-600 hover:text-[#2563EB] transition"
                                }
                            >
                                My Requests
                            </NavLink>

                            <NavLink
                                to="/user/payments"
                                className={({ isActive }) =>
                                    isActive
                                        ? "text-[#2563EB] border-b-2 border-[#2563EB] pb-1"
                                        : "text-gray-600 hover:text-[#2563EB] transition"
                                }
                            >
                                Payments
                            </NavLink>

                            <NavLink
                                to="/user/messages"
                                className={({ isActive }) =>
                                    isActive
                                        ? "text-[#2563EB] border-b-2 border-[#2563EB] pb-1"
                                        : "text-gray-600 hover:text-[#2563EB] transition"
                                }
                            >
                                Messages
                            </NavLink>

                        </div>

                        {/* Profile */}
                        <div className="flex items-center gap-4">
                            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                                U
                            </div>
                        </div>

                    </div>

                </div>

            </nav>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
                <Outlet />
            </main>

        </div>
    );
};