import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import { FiBell, FiSearch, FiUser } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import '../styles/admin-control.css';

const AdminLayout = () => {
  const { user } = useAuth();

  return (
    <div className="admin-wrapper">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col ml-[260px]">
        {/* Admin Top Header */}
        <header className="h-16 border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4 text-slate-400">
            <FiSearch size={18} className="cursor-pointer hover:text-white transition-colors" />
            <span className="text-xs font-medium uppercase tracking-widest opacity-30">Admin Control Layer</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative cursor-pointer group">
              <FiBell size={20} className="text-slate-400 group-hover:text-white transition-colors" />
              <div className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full border-2 border-slate-900" />
            </div>

            <div className="flex items-center gap-3 pl-6 border-l border-white/5">
              <div className="text-right">
                <p className="text-sm font-bold text-white">{user?.full_name}</p>
                <p className="text-[10px] text-indigo-400 font-black uppercase tracking-wider">Super Administrator</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-white/10 overflow-hidden">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt="Admin" className="w-full h-full object-cover" />
                ) : (
                  <FiUser className="text-white" size={20} />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Admin Main Content Container */}
        <main className="p-6 md:p-8 flex-1 overflow-x-hidden pnf-page-enter">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
