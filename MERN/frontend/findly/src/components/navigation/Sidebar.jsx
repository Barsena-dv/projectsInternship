import { NavLink } from 'react-router-dom';

const Sidebar = ({ isOpen, onClose, role }) => {
    const getNavLinks = () => {
        switch (role) {
            case 'ADMIN':
                return [
                    { name: 'Dashboard', path: '/admin/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                    { name: 'Users', path: '/admin/users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
                    { name: 'Requests', path: '/admin/requests', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
                    { name: 'Disputes', path: '/admin/disputes', icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                    { name: 'Reports', path: '/admin/reports', icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z' },
                    { name: 'Profile', path: '/admin/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                ];
            case 'FINDER':
                return [
                    { name: 'Dashboard', path: '/finder/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                    { name: 'Available Assignments', path: '/finder/available', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745V6a2 2 0 012-2h14a2 2 0 012 2v7.255zM12 4a3 3 0 110 6 3 3 0 010-6z' },
                    { name: 'My Assignments', path: '/finder/assignments', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2' },
                    { name: 'Verification', path: '/finder/verification', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
                    { name: 'Earnings', path: '/finder/earnings', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M12 16V15' },
                    { name: 'Profile', path: '/finder/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                ];
            default: // USER
                return [
                    { name: 'Dashboard', path: '/user/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                    { name: 'Create Request', path: '/user/create', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6' },
                    { name: 'My Requests', path: '/user/requests', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2' },
                    { name: 'Messages', path: '/user/messages', icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z' },
                    { name: 'Profile', path: '/user/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                ];
        }
    };

    const links = getNavLinks();

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed top-0 left-0 bottom-0 w-64 glass z-50 border-r border-gray-100
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="p-6 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-blue flex items-center justify-center text-white shadow-lg shadow-primary-blue/20">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.519 1.298-3.003 2.103-4.5M3 13V6a2 2 0 012-2h14a2 2 0 012 2v7" />
                            </svg>
                        </div>
                        <span className="font-bold text-xl text-text-primary tracking-tight">PostNFind</span>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                        <p className="px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                            {role} Menu
                        </p>
                        {links.map((link) => (
                            <NavLink
                                key={link.path}
                                to={link.path}
                                onClick={onClose}
                                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
                  ${isActive
                                        ? 'bg-primary-blue text-white shadow-md shadow-primary-blue/10'
                                        : 'text-text-secondary hover:bg-white/50 hover:text-text-primary'
                                    }
                `}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={link.icon} />
                                </svg>
                                {link.name}
                            </NavLink>
                        ))}
                    </nav>

                    {/* User Profile Summary (Bottom) */}
                    <div className="p-4 border-t border-gray-100 bg-white/30">
                        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/50 transition-colors cursor-pointer group">
                            <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white overflow-hidden shadow-sm">
                                <img src={`https://ui-avatars.com/api/?name=${role}&background=random`} alt="User" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-text-primary truncate capitalize leading-tight">
                                    Test {role.toLowerCase()}
                                </p>
                                <p className="text-xs text-text-secondary truncate">
                                    {role.toLowerCase()}@postnfind.com
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
