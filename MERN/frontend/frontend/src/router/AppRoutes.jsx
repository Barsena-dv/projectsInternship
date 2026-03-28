import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/common/ProtectedRoute';
import { useAuth } from '../hooks/useAuth';
import DashboardLayout from '../layouts/DashboardLayout';
import { getRoleHomePath } from '../contexts/AuthContext';

import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';

import NotFoundPage from '../pages/common/NotFoundPage';
import ChatPage from '../pages/common/ChatPage';
import NotificationsPage from '../pages/common/NotificationsPage';
import ProfilePage from '../pages/common/ProfilePage';
import UnauthorizedPage from '../pages/common/UnauthorizedPage';

import OwnerCreateRequestPage from '../pages/owner/OwnerCreateRequestPage';
import OwnerDashboardPage from '../pages/owner/OwnerDashboardPage';
import OwnerProfilePage from '../pages/owner/OwnerProfilePage';
import OwnerRequestDetailsPage from '../pages/owner/OwnerRequestDetailsPage';
import OwnerRequestsPage from '../pages/owner/OwnerRequestsPage';

import FinderDashboardPage from '../pages/finder/FinderDashboardPage';
import FinderAvailableRequestsPage from '../pages/finder/FinderAvailableRequestsPage';
import FinderAssignmentsPage from '../pages/finder/FinderAssignmentsPage';
import FinderAssignmentDetailsPage from '../pages/finder/FinderAssignmentDetailsPage';
import FinderRequestDetailsPage from '../pages/finder/FinderRequestDetailsPage';

import AdminLayout from '../layouts/AdminLayout';
import AdminOverviewPage from '../pages/admin/AdminOverviewPage';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import AdminRequestsPage from '../pages/admin/AdminRequestsPage';
import AdminAssignmentsPage from '../pages/admin/AdminAssignmentsPage';
import AdminDisputesPage from '../pages/admin/AdminDisputesPage';
import AdminPaymentsPage from '../pages/admin/AdminPaymentsPage';
import AdminLogsPage from '../pages/admin/AdminLogsPage';
import AdminSettingsPage from '../pages/admin/AdminSettingsPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import LandingLayout from '../layouts/LandingLayout';
import LandingPage from '../pages/public/LandingPage';

const HomeRedirect = () => {
	const { isAuthenticated, user } = useAuth();
	if (!isAuthenticated) return <Navigate to="/" replace />;
	return <Navigate to={getRoleHomePath(user?.role)} replace />;
};

const AppRoutes = () => {
	return (
		<Routes>
			<Route element={<LandingLayout />}>
				<Route path="/" element={<LandingPage />} />
			</Route>
			<Route path="/login" element={<LoginPage />} />
			<Route path="/register" element={<RegisterPage />} />
			<Route path="/forgot-password" element={<ForgotPasswordPage />} />
			<Route path="/reset-password/:token" element={<ResetPasswordPage />} />
			<Route path="/unauthorized" element={<UnauthorizedPage />} />

			<Route element={<ProtectedRoute allowedRoles={['owner', 'finder', 'admin']} />}>
				<Route element={<DashboardLayout />}>
					<Route path="/notifications" element={<NotificationsPage />} />
					<Route path="/profile" element={<ProfilePage />} />
				</Route>
			</Route>

			<Route element={<ProtectedRoute allowedRoles={['owner', 'finder']} />}>
				<Route element={<DashboardLayout />}>
					<Route path="/chat" element={<ChatPage />} />
					<Route path="/chat/:assignmentId" element={<ChatPage />} />
				</Route>
			</Route>

			<Route element={<ProtectedRoute allowedRoles={['owner']} />}>
				<Route element={<DashboardLayout />}>
					<Route path="/owner/dashboard" element={<OwnerDashboardPage />} />
					<Route path="/owner/create-request" element={<OwnerCreateRequestPage />} />
					<Route path="/owner/requests" element={<OwnerRequestsPage />} />
					<Route path="/owner/requests/:id" element={<OwnerRequestDetailsPage />} />
					<Route path="/owner/profile" element={<OwnerProfilePage />} />
					<Route path="/owner/*" element={<Navigate to="/owner/dashboard" replace />} />
				</Route>
			</Route>

			<Route element={<ProtectedRoute allowedRoles={['finder']} />}>
				<Route element={<DashboardLayout />}>
					<Route path="/finder/dashboard" element={<FinderDashboardPage />} />
					<Route path="/finder/requests" element={<FinderAvailableRequestsPage />} />
					<Route path="/finder/requests/:id" element={<FinderRequestDetailsPage />} />
					<Route path="/finder/assignments" element={<FinderAssignmentsPage />} />
					<Route path="/finder/assignments/:id" element={<FinderAssignmentDetailsPage />} />
					<Route path="/finder/*" element={<Navigate to="/finder/dashboard" replace />} />
				</Route>
			</Route>

			<Route element={<ProtectedRoute allowedRoles={['admin']} />}>
				<Route element={<AdminLayout />}>
					<Route path="/admin/dashboard" element={<AdminDashboardPage />} />
					<Route path="/admin/overview" element={<AdminOverviewPage />} />
					<Route path="/admin/users" element={<AdminUsersPage />} />
					<Route path="/admin/requests" element={<AdminRequestsPage />} />
					<Route path="/admin/assignments" element={<AdminAssignmentsPage />} />
					<Route path="/admin/disputes" element={<AdminDisputesPage />} />
					<Route path="/admin/payments" element={<AdminPaymentsPage />} />
					<Route path="/admin/logs" element={<AdminLogsPage />} />
					<Route path="/admin/settings" element={<AdminSettingsPage />} />
					<Route path="/admin/*" element={<Navigate to="/admin/overview" replace />} />
				</Route>
			</Route>

			<Route path="*" element={<NotFoundPage />} />
		</Routes>
	);
};

export default AppRoutes;
