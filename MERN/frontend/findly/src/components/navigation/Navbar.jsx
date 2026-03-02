import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Navbar = ({ onMenuClick }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <header className="sticky top-0 z-30 w-full glass border-b border-gray-100">
            <div className="px-4 md:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors text-text-secondary"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    <div className="hidden md:flex items-center gap-2 text-sm">
                        <span className="text-text-secondary capitalize">{user?.role?.toLowerCase()}</span>
                        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="font-semibold text-text-primary capitalize">Overview</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button className="p-2 rounded-lg text-text-secondary hover:bg-gray-100 transition-colors relative">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-white"></span>
                    </button>

                    <div className="h-8 w-[1px] bg-gray-200 hidden sm:block mx-1"></div>

                    <div className="flex items-center gap-3 pl-2">
                        <div className="hidden sm:block text-right">
                            <p className="text-xs font-bold text-text-primary leading-tight">{user?.fullName || 'Guest User'}</p>
                            <p className="text-[10px] text-text-secondary capitalize">{user?.role?.toLowerCase() || 'Anonymous'}</p>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="p-2 rounded-lg text-text-secondary hover:text-error hover:bg-error/5 transition-all title='Logout'"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>

                        <div className="w-10 h-10 rounded-xl bg-background border border-gray-100 flex items-center justify-center overflow-hidden hover:ring-4 hover:ring-primary-blue/5 transition-all">
                            <img src={`https://ui-avatars.com/api/?name=${user?.fullName || 'Guest'}&background=2563EB&color=fff`} alt="Profile" />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
