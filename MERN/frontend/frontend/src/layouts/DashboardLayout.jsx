import { Outlet } from 'react-router-dom';
import RoleSidebar from '../components/common/RoleSidebar';
import TopNavbar from '../components/common/TopNavbar';
import { useAuth } from '../hooks/useAuth';

const DashboardLayout = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-dvh">
      <TopNavbar />
      <div className="mx-auto grid max-w-300 gap-4 px-4 py-4 md:grid-cols-[240px_1fr] md:px-6">
        <RoleSidebar role={user?.role} />
        <main className="pnf-page-enter">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
