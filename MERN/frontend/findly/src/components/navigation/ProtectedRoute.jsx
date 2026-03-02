import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { user, loading, isAuthenticated } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-12 h-12 border-4 border-primary-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        // If user's role is not in allowedRoles, redirect to their own dashboard
        const dashboardMap = {
            'ADMIN': '/admin/dashboard',
            'FINDER': '/finder/dashboard',
            'USER': '/user/dashboard'
        };
        return <Navigate to={dashboardMap[user.role] || '/'} replace />;
    }

    return children;
};

export default ProtectedRoute;
