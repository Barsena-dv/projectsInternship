import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { extractArray } from "../../services/apiUtils";

const roleBadgeClassMap = {
  owner: "border-cyan-200 bg-cyan-50 text-cyan-700",
  finder: "border-blue-200 bg-blue-50 text-blue-700",
  admin: "border-purple-200 bg-purple-50 text-purple-700",
};

const statusBadgeClassMap = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  suspended: "border-amber-200 bg-amber-50 text-amber-700",
  banned: "border-rose-200 bg-rose-50 text-rose-700",
};

export const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/users/users");
      setUsers(extractArray(response.data, ["users"]));
    } catch (error) {
      const message = error.response?.data?.message ?? "Failed to fetch users";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const roleSummary = useMemo(() => {
    return users.reduce(
      (accumulator, user) => {
        const role = String(user.role ?? "owner").toLowerCase();

        if (role === "finder") {
          accumulator.finders += 1;
        } else if (role === "admin") {
          accumulator.admins += 1;
        } else {
          accumulator.owners += 1;
        }

        return accumulator;
      },
      { owners: 0, finders: 0, admins: 0 },
    );
  }, [users]);

  return (
    <section className="grid gap-4">
      <div className="surface-panel rounded-2xl p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Admin</p>
            <h3 className="mt-1 text-2xl font-bold text-slate-900">User Management</h3>
            <p className="mt-1 text-sm text-slate-600">Monitor platform accounts and role distribution.</p>
          </div>

          <button
            type="button"
            onClick={fetchUsers}
            disabled={loading}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Total</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{users.length}</p>
          </div>
          <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">Owners</p>
            <p className="mt-1 text-xl font-bold text-cyan-700">{roleSummary.owners}</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Finders</p>
            <p className="mt-1 text-xl font-bold text-blue-700">{roleSummary.finders}</p>
          </div>
          <div className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-purple-700">Admins</p>
            <p className="mt-1 text-xl font-bold text-purple-700">{roleSummary.admins}</p>
          </div>
        </div>
      </div>

      <div className="surface-panel overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-900 text-slate-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold">Email</th>
                <th className="px-4 py-3 text-left font-semibold">Phone</th>
                <th className="px-4 py-3 text-left font-semibold">Role</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Verified</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const userRole = String(user.role ?? "owner").toLowerCase();
                  const accountStatus = String(user.accountStatus ?? "active").toLowerCase();
                  const roleClassName =
                    roleBadgeClassMap[userRole] ?? "border-slate-200 bg-slate-50 text-slate-700";
                  const statusClassName =
                    statusBadgeClassMap[accountStatus] ?? "border-slate-200 bg-slate-50 text-slate-700";

                  return (
                    <tr key={String(user._id ?? user.id)} className="border-t border-slate-200 hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-900">{user.fullName ?? "N/A"}</td>
                      <td className="px-4 py-3 text-slate-600">{user.email ?? "N/A"}</td>
                      <td className="px-4 py-3 text-slate-600">{user.phone ?? "N/A"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${roleClassName}`}
                        >
                          {userRole}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${statusClassName}`}
                        >
                          {accountStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{user.isVerified ? "Yes" : "No"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
