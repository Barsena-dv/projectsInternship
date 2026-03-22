import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { Login } from "../components/Login";
import { Signup } from "../components/Signup";
import { AdminSidebar } from "../components/admin/AdminSidebar";
import { UserList } from "../components/admin/UserList";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { FinderAssignmentDetails } from "../pages/finder/FinderAssignmentDetails";
import { FinderMyAssignments } from "../pages/finder/FinderMyAssignments";
import { FinderOpenRequests } from "../pages/finder/FinderOpenRequests";
import { UploadEvidence } from "../pages/finder/UploadEvidence";
import { OwnerCreateRequest } from "../pages/owner/OwnerCreateRequest";
import { OwnerEvidenceView } from "../pages/owner/OwnerEvidenceView";
import { OwnerMyRequests } from "../pages/owner/OwnerMyRequests";
import { OwnerRequestDetails } from "../pages/owner/OwnerRequestDetails";

const roleHomeRouteMap = {
    owner: "/owner/my-requests",
    finder: "/finder/my-assignments",
    admin: "/admin/users",
};

const normalizeRole = (rawRole) => {
    const normalizedRole = String(rawRole ?? "").toLowerCase();

    if (normalizedRole === "owner" || normalizedRole === "finder" || normalizedRole === "admin") {
        return normalizedRole;
    }

    return "";
};

const ProtectedRoute = ({ allowedRoles, children }) => {
    const token = localStorage.getItem("token");
    const currentRole = normalizeRole(localStorage.getItem("role"));

    if (!token) {
        return <Navigate to="/" replace />;
    }

    if (!allowedRoles.includes(currentRole)) {
        const fallbackRoute = roleHomeRouteMap[currentRole] ?? "/";
        return <Navigate to={fallbackRoute} replace />;
    }

    return children;
};

const router = createBrowserRouter([
    { path: "/", element: <Login /> },
    { path: "/signup", element: <Signup /> },
    {
        path: "/owner",
        element: (
            <ProtectedRoute allowedRoles={["owner"]}>
                <DashboardLayout role="owner" />
            </ProtectedRoute>
        ),
        children: [
            { index: true, element: <Navigate to="my-requests" replace /> },
            { path: "create-request", element: <OwnerCreateRequest /> },
            { path: "my-requests", element: <OwnerMyRequests /> },
            { path: "request/:id", element: <OwnerRequestDetails /> },
            { path: "my-requests/:requestId/evidence", element: <OwnerEvidenceView /> },
        ],
    },
    {
        path: "/finder",
        element: (
            <ProtectedRoute allowedRoles={["finder"]}>
                <DashboardLayout role="finder" />
            </ProtectedRoute>
        ),
        children: [
            { index: true, element: <Navigate to="my-assignments" replace /> },
            { path: "open-requests", element: <FinderOpenRequests /> },
            { path: "my-assignments", element: <FinderMyAssignments /> },
            { path: "assignment/:id", element: <FinderAssignmentDetails /> },
            { path: "upload-evidence/:assignmentId", element: <UploadEvidence /> },
        ],
    },
    {
        path: "/admin",
        element: (
            <ProtectedRoute allowedRoles={["admin"]}>
                <AdminSidebar />
            </ProtectedRoute>
        ),
        children: [
            { index: true, element: <Navigate to="users" replace /> },
            { path: "users", element: <UserList /> },
        ],
    },
    { path: "*", element: <Navigate to="/" replace /> },
]);

const AppRoutes = ()=>{
        return <RouterProvider router={router} />
}

export default AppRoutes