import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/common/ProtectedRoute';
import { useAuth } from '../hooks/useAuth';
import DashboardLayout from '../layouts/DashboardLayout';

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

import { getRoleHomePath } from '../contexts/AuthContext';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';

const HomeRedirect = () => {
	const { isAuthenticated, user } = useAuth();
	if (!isAuthenticated) return <Navigate to="/login" replace />;
	return <Navigate to={getRoleHomePath(user?.role)} replace />;
};

const AppRoutes = () => {
	return (
		<Routes>
			<Route path="/" element={<HomeRedirect />} />
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
				<Route element={<DashboardLayout />}>
					<Route path="/admin/dashboard" element={<AdminDashboardPage />} />
					<Route path="/admin/*" element={<Navigate to="/admin/dashboard" replace />} />
				</Route>
			</Route>

			<Route path="*" element={<NotFoundPage />} />
		</Routes>
	);
};

export default AppRoutes;
