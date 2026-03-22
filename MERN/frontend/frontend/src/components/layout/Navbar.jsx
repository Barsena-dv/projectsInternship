import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiChevronDown,
  FiEdit2,
  FiEye,
  FiLogOut,
  FiMoon,
  FiSearch,
  FiSun,
  FiUpload,
} from "react-icons/fi";
import { NavLink, useNavigate } from "react-router-dom";
import { Avatar } from "../common/Avatar";
import { Modal } from "../common/Modal";

const THEME_STORAGE_KEY = "pnf-theme";
const PROFILE_STORAGE_KEY = "pnf-profile";
const ROLE_STORAGE_KEY = "role";

const roleConfigByRole = {
  owner: {
    label: "Owner",
    route: "/owner/my-requests",
    navLinks: [
      { to: "/owner/create-request", label: "Create Request" },
      { to: "/owner/my-requests", label: "My Requests" },
    ],
  },
  finder: {
    label: "Finder",
    route: "/finder/my-assignments",
    navLinks: [
      { to: "/finder/open-requests", label: "Open Requests" },
      { to: "/finder/my-assignments", label: "My Assignments" },
    ],
  },
};

const normalizeRole = (rawRole, fallbackRole = "owner") => {
  const normalizedRole = String(rawRole ?? "").toLowerCase();

  if (normalizedRole === "owner" || normalizedRole === "finder") {
    return normalizedRole;
  }

  return fallbackRole;
};

const readStoredProfile = () => {
  const rawValue = localStorage.getItem(PROFILE_STORAGE_KEY);

  if (!rawValue) {
    return {};
  }

  try {
    const parsedValue = JSON.parse(rawValue);

    if (parsedValue && typeof parsedValue === "object") {
      return parsedValue;
    }

    return {};
  } catch {
    return {};
  }
};

const buildFallbackProfile = (role) => {
  const roleLabel = role === "finder" ? "Finder" : "Owner";

  return {
    fullName: `${roleLabel} User`,
    email: "",
    phone: "",
    avatar: "",
  };
};

const toFileDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

const resolveInitialTheme = () => {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);

  if (storedTheme === "dark") {
    document.documentElement.classList.add("dark");
    return true;
  }

  if (storedTheme === "light") {
    document.documentElement.classList.remove("dark");
    return false;
  }

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  document.documentElement.classList.toggle("dark", prefersDark);
  return prefersDark;
};

export const Navbar = ({ role, title, subtitle }) => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(resolveInitialTheme);
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [viewProfileOpen, setViewProfileOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  const currentRole = normalizeRole(role);
  const currentRoleConfig = roleConfigByRole[currentRole] ?? roleConfigByRole.owner;

  const [profile, setProfile] = useState(() => {
    const fallbackProfile = buildFallbackProfile(currentRole);
    const storedProfile = readStoredProfile();

    return {
      fullName: storedProfile.fullName ?? fallbackProfile.fullName,
      email: storedProfile.email ?? fallbackProfile.email,
      phone: storedProfile.phone ?? fallbackProfile.phone,
      avatar: storedProfile.avatar ?? storedProfile.profileImage ?? fallbackProfile.avatar,
    };
  });
  const [editForm, setEditForm] = useState(profile);

  const avatarInputRef = useRef(null);
  const dropdownRef = useRef(null);

  const displayName = useMemo(() => {
    const normalizedName = String(profile.fullName ?? "").trim();

    if (normalizedName) {
      return normalizedName;
    }

    return buildFallbackProfile(currentRole).fullName;
  }, [profile.fullName, currentRole]);

  const handleThemeToggle = () => {
    const nextIsDark = !isDark;
    document.documentElement.classList.toggle("dark", nextIsDark);
    setIsDark(nextIsDark);
  };

  const handleRoleSwitch = (nextRole) => {
    const normalizedNextRole = normalizeRole(nextRole, currentRole);

    if (normalizedNextRole === currentRole) {
      return;
    }

    localStorage.setItem(ROLE_STORAGE_KEY, normalizedNextRole);
    setDropdownOpen(false);
    navigate(roleConfigByRole[normalizedNextRole].route);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem(ROLE_STORAGE_KEY);
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    setDropdownOpen(false);
    navigate("/");
  };

  const handleEditInputChange = (event) => {
    const { name, value } = event.target;

    setEditForm((previousState) => ({
      ...previousState,
      [name]: value,
    }));
  };

  const handleAvatarUpload = async (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    try {
      const avatarDataUrl = await toFileDataUrl(selectedFile);

      setEditForm((previousState) => ({
        ...previousState,
        avatar: avatarDataUrl,
      }));
    } catch {
      // Ignore avatar upload parsing errors and keep existing avatar.
    } finally {
      event.target.value = "";
    }
  };

  const handleSaveProfile = () => {
    const normalizedProfile = {
      fullName: String(editForm.fullName ?? "").trim(),
      email: String(editForm.email ?? "").trim(),
      phone: String(editForm.phone ?? "").trim(),
      avatar: String(editForm.avatar ?? ""),
    };

    setProfile(normalizedProfile);
    setEditProfileOpen(false);
  };

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem(ROLE_STORAGE_KEY, currentRole);
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    if (!editProfileOpen) {
      return;
    }

    setEditForm(profile);
  }, [editProfileOpen, profile]);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (!dropdownRef.current?.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setDropdownOpen(false);
      }
    };

    window.addEventListener("mousedown", onClickOutside);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <header className="topbar-glass sticky top-0 z-40 border-b px-4 py-4 md:px-6">
      <div className="mx-auto grid w-full max-w-7xl gap-4">
        <div className="flex flex-wrap items-start gap-4 lg:flex-nowrap lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1 lg:max-w-sm">
            <div className="inline-flex items-center gap-2">
              <span className="gradient-primary inline-flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold tracking-[0.08em] text-white">
                PN
              </span>
              <p className="text-(--primary) text-xs font-semibold uppercase tracking-[0.16em]">PostNFind Workspace</p>
            </div>
            <h2 className="theme-text mt-1 truncate text-2xl font-bold">{title}</h2>
            <p className="theme-muted mt-1 truncate text-sm">{subtitle}</p>
          </div>

          <label className="order-last flex w-full items-center gap-2 rounded-xl border border-(--border) bg-(--bg) px-3 py-2 text-sm md:order-0 md:max-w-md lg:max-w-lg">
            <FiSearch className="h-4 w-4 text-(--muted)" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search requests, assignments, evidence"
              className="w-full bg-transparent text-(--text) outline-none placeholder:text-(--muted)"
            />
          </label>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <div className="flex items-center rounded-xl border border-(--border) bg-(--bg) p-1">
              {Object.entries(roleConfigByRole).map(([roleKey, roleValue]) => {
                const active = roleKey === currentRole;

                return (
                  <button
                    key={roleKey}
                    type="button"
                    onClick={() => handleRoleSwitch(roleKey)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                      active
                        ? "gradient-primary text-white"
                        : "theme-muted hover:bg-(--bg-soft) hover:text-(--text)"
                    }`}
                  >
                    {roleValue.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleThemeToggle}
              className="rounded-xl border border-(--border) bg-(--bg) p-2.5 text-(--text) transition hover:bg-(--bg-soft)"
              aria-label="Toggle theme"
            >
              {isDark ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
            </button>

            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen((previousState) => !previousState)}
                className="inline-flex items-center gap-2 rounded-xl border border-(--border) bg-(--bg) px-2.5 py-1.5 transition hover:bg-(--bg-soft)"
              >
                <Avatar name={displayName} src={profile.avatar} size="md" />
                <span className="hidden text-sm font-semibold theme-text sm:inline">{currentRoleConfig.label}</span>
                <FiChevronDown className="hidden h-4 w-4 text-(--muted) sm:inline" />
              </button>

              {dropdownOpen ? (
                <div className="glass-card absolute right-0 top-[calc(100%+0.45rem)] z-50 w-56 p-2">
                  <div className="mb-1 rounded-lg border border-(--border) bg-(--bg-soft) px-3 py-2">
                    <p className="text-sm font-semibold theme-text">{displayName}</p>
                    <p className="theme-muted truncate text-xs">{profile.email || "No email set"}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setViewProfileOpen(true);
                      setDropdownOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm theme-text transition hover:bg-(--bg-soft)"
                  >
                    <FiEye className="h-4 w-4" />
                    View Profile
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditProfileOpen(true);
                      setDropdownOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm theme-text transition hover:bg-(--bg-soft)"
                  >
                    <FiEdit2 className="h-4 w-4" />
                    Edit Profile
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-500 transition hover:bg-rose-500/10"
                  >
                    <FiLogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {currentRoleConfig.navLinks.map((navLink) => (
            <NavLink
              key={navLink.to}
              to={navLink.to}
              className={({ isActive }) =>
                `rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "gradient-primary text-white"
                    : "theme-text border border-(--border) bg-(--bg) hover:bg-(--bg-soft)"
                }`
              }
            >
              {navLink.label}
            </NavLink>
          ))}
        </div>
      </div>

      <Modal
        isOpen={viewProfileOpen}
        title="Profile"
        onClose={() => setViewProfileOpen(false)}
        footer={
          <button
            type="button"
            onClick={() => setViewProfileOpen(false)}
            className="rounded-lg border border-(--border) px-3 py-1.5 text-sm theme-text transition hover:bg-(--bg-soft)"
          >
            Close
          </button>
        }
      >
        <div className="grid gap-4 text-sm theme-text">
          <div className="flex items-center gap-3">
            <Avatar name={displayName} src={profile.avatar} size="lg" />
            <div>
              <p className="text-base font-semibold">{displayName}</p>
              <p className="theme-muted">{profile.email || "No email set"}</p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-(--border) bg-(--bg-soft) px-3 py-2">
              <p className="theme-muted text-xs font-semibold uppercase tracking-[0.08em]">Role</p>
              <p className="mt-0.5 font-medium">{currentRoleConfig.label}</p>
            </div>

            <div className="rounded-lg border border-(--border) bg-(--bg-soft) px-3 py-2">
              <p className="theme-muted text-xs font-semibold uppercase tracking-[0.08em]">Phone</p>
              <p className="mt-0.5 font-medium">{profile.phone || "Not provided"}</p>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={editProfileOpen}
        title="Edit Profile"
        onClose={() => setEditProfileOpen(false)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditProfileOpen(false)}
              className="rounded-lg border border-(--border) px-3 py-1.5 text-sm theme-text transition hover:bg-(--bg-soft)"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveProfile}
              className="gradient-primary rounded-lg px-3.5 py-1.5 text-sm font-semibold text-white"
            >
              Save Profile
            </button>
          </>
        }
      >
        <div className="grid gap-3 text-sm theme-text">
          <div className="flex items-center gap-3">
            <Avatar name={editForm.fullName || displayName} src={editForm.avatar} size="lg" />

            <div>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-(--border) bg-(--bg-soft) px-3 py-1.5 text-xs font-semibold theme-text transition hover:bg-(--bg)"
              >
                <FiUpload className="h-3.5 w-3.5" />
                Upload Avatar
              </button>

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
          </div>

          <label className="grid gap-1.5">
            Full Name
            <input
              type="text"
              name="fullName"
              value={editForm.fullName ?? ""}
              onChange={handleEditInputChange}
              className="rounded-lg border border-(--border) bg-(--bg) px-3 py-2 outline-none"
            />
          </label>

          <label className="grid gap-1.5">
            Email
            <input
              type="email"
              name="email"
              value={editForm.email ?? ""}
              onChange={handleEditInputChange}
              className="rounded-lg border border-(--border) bg-(--bg) px-3 py-2 outline-none"
            />
          </label>

          <label className="grid gap-1.5">
            Phone
            <input
              type="text"
              name="phone"
              value={editForm.phone ?? ""}
              onChange={handleEditInputChange}
              className="rounded-lg border border-(--border) bg-(--bg) px-3 py-2 outline-none"
            />
          </label>
        </div>
      </Modal>
    </header>
  );
};
