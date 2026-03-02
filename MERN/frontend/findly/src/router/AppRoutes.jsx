import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import PlaceholderPage from "../components/ui/PlaceholderPage";
import MainLayout from "../layouts/MainLayout";
import { Login } from "../pages/auth/Login";
import { Signup } from "../pages/auth/Signup";
import ProtectedRoute from "../components/navigation/ProtectedRoute";

const router = createBrowserRouter([
    // Auth Routes
    { path: "/", element: <Login /> },
    { path: "/signup", element: <Signup /> },

    // User Routes
    {
        path: "/user",
        element: (
            <ProtectedRoute allowedRoles={['USER']}>
                <MainLayout role="USER" />
            </ProtectedRoute>
        ),
        children: [
            { path: "", element: <Navigate to="dashboard" replace /> },
            { path: "dashboard", element: <PlaceholderPage title="User Dashboard" /> },
            { path: "create", element: <PlaceholderPage title="Create Lost Item Request" /> },
            { path: "requests", element: <PlaceholderPage title="My Requests" /> },
            { path: "messages", element: <PlaceholderPage title="Messages & Chat" /> },
            { path: "profile", element: <PlaceholderPage title="User Profile" /> },
        ]
    },

    // Finder Routes
    {
        path: "/finder",
        element: (
            <ProtectedRoute allowedRoles={['FINDER']}>
                <MainLayout role="FINDER" />
            </ProtectedRoute>
        ),
        children: [
            { path: "", element: <Navigate to="dashboard" replace /> },
            { path: "dashboard", element: <PlaceholderPage title="Finder Dashboard" /> },
            { path: "available", element: <PlaceholderPage title="Available Assignments" /> },
            { path: "assignments", element: <PlaceholderPage title="My Assignments" /> },
            { path: "verification", element: <PlaceholderPage title="Verification Status" /> },
            { path: "earnings", element: <PlaceholderPage title="Finder Earnings" /> },
            { path: "profile", element: <PlaceholderPage title="Finder Profile" /> },
        ]
    },

    // Admin Routes
    {
        path: "/admin",
        element: (
            <ProtectedRoute allowedRoles={['ADMIN']}>
                <MainLayout role="ADMIN" />
            </ProtectedRoute>
        ),
        children: [
            { path: "", element: <Navigate to="dashboard" replace /> },
            { path: "dashboard", element: <PlaceholderPage title="Admin Dashboard" /> },
            { path: "users", element: <PlaceholderPage title="User Management" /> },
            { path: "requests", element: <PlaceholderPage title="Request Management" /> },
            { path: "disputes", element: <PlaceholderPage title="Dispute Resolution" /> },
            { path: "reports", element: <PlaceholderPage title="System Reports" /> },
            { path: "profile", element: <PlaceholderPage title="Admin Profile" /> },
        ]
    },

    // Fallback
    { path: "*", element: <Navigate to="/" replace /> }
]);

const AppRoutes = () => {
    return <RouterProvider router={router} />;
};

export default AppRoutes;