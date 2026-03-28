import { Navigate } from 'react-router-dom';

const AdminDashboardPage = () => {
  // The monolithic dashboard has been decentralized into specialized pages 
  // under the new Admin Control Layer. Redirecting to the primary overview.
  return <Navigate to="/admin/overview" replace />;
};

export default AdminDashboardPage;
