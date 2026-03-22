export const AssignmentCard = ({ assignment, onUpload, actionLoading }) => {
  const itemName =
    assignment.itemName ??
    assignment.request?.itemName ??
    assignment.requestId?.itemName ??
    "Unknown item";
  const status = String(assignment.status ?? assignment.assignmentStatus ?? "accepted").toLowerCase();

  const statusClassNameMap = {
    accepted: "bg-cyan-50 text-cyan-700 border-cyan-200",
    searching: "bg-blue-50 text-blue-700 border-blue-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-rose-50 text-rose-700 border-rose-200",
  };

  const statusClassName = statusClassNameMap[status] ?? "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <article className="surface-panel rounded-2xl p-5 transition hover:-translate-y-0.5 hover:shadow-lg sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{itemName}</h3>
          <p className="mt-2 text-sm text-slate-500">Finder workflow status</p>
        </div>

        <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusClassName}`}>
          {status}
        </span>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onUpload}
          disabled={actionLoading}
          className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Upload Evidence
        </button>
      </div>
    </article>
  );
};
