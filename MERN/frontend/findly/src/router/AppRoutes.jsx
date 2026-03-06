import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import ProtectedRoute from "../components/navigation/ProtectedRoute";
import PlaceholderPage from "../components/ui/PlaceholderPage";
import MainLayout from "../layouts/MainLayout";
import { Login } from "../pages/auth/Login";
import { Signup } from "../pages/auth/Signup";
import CreateRequest from "../pages/user/CreateRequest";
import Dashboard from "../pages/user/Dashboard";
import EditRequest from "../pages/user/EditRequest";
import MyRequests from "../pages/user/MyRequests";
import RequestDetail from "../pages/user/RequestDetail";

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
            { path: "dashboard", element: <Dashboard /> },
            { path: "create", element: <CreateRequest /> },
            { path: "requests", element: <MyRequests /> },
            { path: "requests/:id", element: <RequestDetail /> },
            { path: "requests/edit/:id", element: <EditRequest /> },
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

const AppRoutes = () => <RouterProvider router={router} />;

export default AppRoutes;