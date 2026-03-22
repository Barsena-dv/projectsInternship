import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "./Navbar";

const pageMetaByPath = {
  "/owner/create-request": {
    title: "Create Lost Item Request",
    subtitle: "Save request details as draft and publish once ready.",
  },
  "/owner/my-requests": {
    title: "My Requests",
    subtitle: "Review all requests and open details for workflow actions.",
  },
  "/owner/request": {
    title: "Request Details",
    subtitle: "Track payment, assignment, evidence, and timeline.",
  },
  "/owner/my-requests/evidence": {
    title: "View Evidence",
    subtitle: "Review uploaded evidence and confirm assignment outcome.",
  },
  "/finder/open-requests": {
    title: "Open Requests",
    subtitle: "Pick a request and accept assignment to start recovery.",
  },
  "/finder/my-assignments": {
    title: "My Assignments",
    subtitle: "Review assignments and open details to continue workflow.",
  },
  "/finder/assignment": {
    title: "Assignment Details",
    subtitle: "Track payment, evidence, and timeline updates.",
  },
  "/finder/upload-evidence": {
    title: "Upload Evidence",
    subtitle: "Submit proof for your accepted assignment.",
  },
};

const fallbackMetaByRole = {
  owner: {
    title: "Owner Dashboard",
    subtitle: "Manage your recovery workflow.",
  },
  finder: {
    title: "Finder Dashboard",
    subtitle: "Handle assignment and evidence workflow.",
  },
};

const resolveMetaByPath = (pathname) => {
  const directMeta = pageMetaByPath[pathname];

  if (directMeta) {
    return directMeta;
  }

  if (pathname.startsWith("/finder/upload-evidence")) {
    return pageMetaByPath["/finder/upload-evidence"];
  }

  if (pathname.startsWith("/finder/assignment/")) {
    return pageMetaByPath["/finder/assignment"];
  }

  if (pathname.startsWith("/owner/request/")) {
    return pageMetaByPath["/owner/request"];
  }

  if (pathname.startsWith("/owner/my-requests/") && pathname.includes("/evidence")) {
    return pageMetaByPath["/owner/my-requests/evidence"];
  }

  return undefined;
};

export const DashboardLayout = ({ role }) => {
  const location = useLocation();
  const matchedMeta = resolveMetaByPath(location.pathname);
  const fallbackMeta = fallbackMetaByRole[role] ?? fallbackMetaByRole.owner;
  const currentMeta = matchedMeta ?? fallbackMeta;

  return (
    <div className="app-shell">
      <div className="relative z-10 flex min-h-dvh flex-col">
        <Navbar role={role} title={currentMeta.title} subtitle={currentMeta.subtitle} />

        <main className="flex-1 px-4 pb-6 pt-5 sm:px-5 md:px-6 lg:px-8">
          <div className="animate-in mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
