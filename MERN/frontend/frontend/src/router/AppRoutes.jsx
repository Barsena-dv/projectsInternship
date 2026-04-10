import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/common/ProtectedRoute';
import { getRoleHomePath } from '../contexts/AuthContext';
import { useAuth } from '../hooks/useAuth';
import DashboardLayout from '../layouts/DashboardLayout';

import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import VerifyFinderEmailPage from '../pages/auth/VerifyFinderEmailPage';

import ChatPage from '../pages/common/ChatPage';
import NotFoundPage from '../pages/common/NotFoundPage';
import NotificationsPage from '../pages/common/NotificationsPage';
import ProfilePage from '../pages/common/ProfilePage';
import UnauthorizedPage from '../pages/common/UnauthorizedPage';

import OwnerCreateRequestPage from '../pages/owner/OwnerCreateRequestPage';
import OwnerDashboardPage from '../pages/owner/OwnerDashboardPage';
import OwnerProfilePage from '../pages/owner/OwnerProfilePage';
import OwnerRequestDetailsPage from '../pages/owner/OwnerRequestDetailsPage';
import OwnerRequestsPage from '../pages/owner/OwnerRequestsPage';

import FinderAssignmentDetailsPage from '../pages/finder/FinderAssignmentDetailsPage';
import FinderAssignmentsPage from '../pages/finder/FinderAssignmentsPage';
import FinderAvailableRequestsPage from '../pages/finder/FinderAvailableRequestsPage';
import FinderDashboardPage from '../pages/finder/FinderDashboardPage';
import FinderRequestDetailsPage from '../pages/finder/FinderRequestDetailsPage';

import AdminLayout from '../layouts/AdminLayout';
import LandingLayout from '../layouts/LandingLayout';
import AdminAnalyticsPage from '../pages/admin/AdminAnalyticsPage';
import AdminAssignmentsPage from '../pages/admin/AdminAssignmentsPage';
import AdminChatMonitorPage from '../pages/admin/AdminChatMonitorPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminDisputesPage from '../pages/admin/AdminDisputesPage';
import AdminEvidencePage from '../pages/admin/AdminEvidencePage';
import AdminLogsPage from '../pages/admin/AdminLogsPage';
import AdminNotificationsPage from '../pages/admin/AdminNotificationsPage';
import AdminOverviewPage from '../pages/admin/AdminOverviewPage';
import AdminPaymentsPage from '../pages/admin/AdminPaymentsPage';
import AdminPayoutsPage from '../pages/admin/AdminPayoutsPage';
import AdminRefundsPage from '../pages/admin/AdminRefundsPage';
import AdminRequestsPage from '../pages/admin/AdminRequestsPage';
import AdminSecurityPage from '../pages/admin/AdminSecurityPage';
import AdminSettingsPage from '../pages/admin/AdminSettingsPage';
import AdminTrackingPage from '../pages/admin/AdminTrackingPage';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
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
			<Route path="/verify-finder-email" element={<VerifyFinderEmailPage />} />
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
					<Route path="/admin/tracking" element={<AdminTrackingPage />} />
					<Route path="/admin/evidence" element={<AdminEvidencePage />} />
					<Route path="/admin/chat-monitor" element={<AdminChatMonitorPage />} />
					<Route path="/admin/disputes" element={<AdminDisputesPage />} />
					<Route path="/admin/payments" element={<AdminPaymentsPage />} />
					<Route path="/admin/refunds" element={<AdminRefundsPage />} />
					<Route path="/admin/payouts" element={<AdminPayoutsPage />} />
					<Route path="/admin/notifications" element={<AdminNotificationsPage />} />
					<Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
					<Route path="/admin/security" element={<AdminSecurityPage />} />
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
