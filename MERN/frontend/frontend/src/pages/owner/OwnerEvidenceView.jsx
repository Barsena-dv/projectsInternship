import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { extractArray } from "../../services/apiUtils";
import {
    confirmAssignmentDecision,
    getLatestAssignmentByRequestId,
} from "../../services/assignmentService";
import { getEvidenceByAssignmentId, resolveEvidenceUrl } from "../../services/evidenceService";
import { setPaymentStatusOverride } from "../../services/paymentService";

const getEvidenceFileUrl = (evidence) =>
  evidence.fileUrl ??
  evidence.mediaUrl ??
  evidence.url ??
  evidence.file?.url ??
  evidence.filePath ??
  evidence.path ??
  evidence.imageUrl ??
  evidence.videoUrl ??
  evidence.evidenceUrl;

const getEvidenceCaption = (evidence) => evidence.caption ?? evidence.description ?? "No caption provided";

const isVideoFile = (evidence, fileUrl) => {
  const mimeLikeType = String(evidence.mimeType ?? evidence.fileType ?? evidence.type ?? "").toLowerCase();

  if (mimeLikeType.includes("video") || mimeLikeType === "video") {
    return true;
  }

  return /\.(mp4|webm|ogg|mov|avi|mkv)(\?.*)?$/i.test(String(fileUrl ?? ""));
};

const getDecisionFromStatus = (status) => {
  const normalizedStatus = String(status ?? "").toLowerCase();

  if (["confirmed", "completed", "complete", "done"].includes(normalizedStatus)) {
    return "confirmed";
  }

  if (["rejected", "declined"].includes(normalizedStatus)) {
    return "rejected";
  }

  return "";
};

const getDecisionLabel = (decision) => {
  if (decision === "confirmed") {
    return "Completed";
  }

  if (decision === "rejected") {
    return "Rejected, continue search";
  }

  return "Pending";
};

const getPaymentStatusMeta = (paymentStatus) => {
  const normalizedStatus = String(paymentStatus ?? "").toLowerCase();

  if (normalizedStatus === "locked") {
    return {
      label: "Payment Locked",
      className: "border-blue-200 bg-blue-50 text-blue-700",
    };
  }

  if (normalizedStatus === "released") {
    return {
      label: "Payment Released to Finder",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (normalizedStatus === "refunded") {
    return {
      label: "Refunded",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "Unpaid",
    className: "border-slate-200 bg-slate-100 text-slate-600",
  };
};

const normalizeEvidenceList = (payload) => {
  const extractedEvidence = extractArray(payload, ["evidence", "evidences", "files", "items"]);

  if (extractedEvidence.length > 0) {
    return extractedEvidence;
  }

  if (payload?.data && typeof payload.data === "object") {
    const nestedEvidence = extractArray(payload.data, ["evidence", "evidences", "files", "items"]);

    if (nestedEvidence.length > 0) {
      return nestedEvidence;
    }
  }

  if (payload && typeof payload === "object" && getEvidenceFileUrl(payload)) {
    return [payload];
  }

  if (payload?.data && typeof payload.data === "object" && getEvidenceFileUrl(payload.data)) {
    return [payload.data];
  }

  return [];
};

export const OwnerEvidenceView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { requestId, assignmentId: assignmentIdFromParam } = useParams();

  const routeState = location.state ?? {};
  const routeAssignmentId = String(routeState.assignmentId ?? assignmentIdFromParam ?? "");
  const routeRequestId = String(routeState.requestId ?? requestId ?? "");
  const requestItemName = routeState.itemName ?? "Request";

  const [assignmentId, setAssignmentId] = useState(routeAssignmentId);
  const [resolvingAssignmentId, setResolvingAssignmentId] = useState(false);
  const [loading, setLoading] = useState(true);
  const [evidenceItems, setEvidenceItems] = useState([]);
  const [decision, setDecision] = useState(
    getDecisionFromStatus(routeState.assignmentStatus ?? routeState.status),
  );
  const [decisionLoading, setDecisionLoading] = useState("");
  const [paymentStatus, setPaymentStatus] = useState(String(routeState.paymentStatus ?? "").toLowerCase());

  useEffect(() => {
    setAssignmentId(routeAssignmentId);
  }, [routeAssignmentId]);

  useEffect(() => {
    const resolveAssignmentId = async () => {
      if (assignmentId || !requestId) {
        return;
      }

      try {
        setResolvingAssignmentId(true);
        const latestAssignment = await getLatestAssignmentByRequestId(requestId);
        const resolvedAssignmentId = latestAssignment?.resolvedAssignmentId;

        if (!resolvedAssignmentId) {
          return;
        }

        setAssignmentId(String(resolvedAssignmentId));
        setDecision((previousDecision) => {
          if (previousDecision) {
            return previousDecision;
          }

          return getDecisionFromStatus(
            latestAssignment.ownerConfirmation ?? latestAssignment.assignmentStatus,
          );
        });
      } catch (error) {
        const message = error.response?.data?.message ?? "Failed to resolve assignment";
        toast.error(message);
      } finally {
        setResolvingAssignmentId(false);
      }
    };

    resolveAssignmentId();
  }, [assignmentId, requestId]);

  useEffect(() => {
    const fetchEvidence = async () => {
      if (resolvingAssignmentId) {
        return;
      }

      if (!assignmentId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const responsePayload = await getEvidenceByAssignmentId(assignmentId);
        setEvidenceItems(normalizeEvidenceList(responsePayload));
      } catch (error) {
        const message = error.response?.data?.message ?? "Failed to fetch evidence";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvidence();
  }, [assignmentId, resolvingAssignmentId]);

  const handleConfirmDecision = async (newDecision) => {
    if (!assignmentId) {
      toast.error("Assignment id missing");
      return;
    }

    try {
      setDecisionLoading(newDecision);
      await confirmAssignmentDecision(assignmentId, newDecision);
      setDecision(newDecision);

      if (newDecision === "confirmed") {
        if (routeRequestId) {
          setPaymentStatusOverride(routeRequestId, "released");
          setPaymentStatus("released");
        }

        toast.success("Assignment confirmed | Payment Released to Finder");
      } else {
        if (routeRequestId && paymentStatus === "locked") {
          setPaymentStatusOverride(routeRequestId, "refunded");
          setPaymentStatus("refunded");
        }

        toast.success("Assignment rejected");
      }
    } catch (error) {
      const message = error.response?.data?.message ?? "Failed to update assignment decision";
      toast.error(message);
    } finally {
      setDecisionLoading("");
    }
  };

  return (
    <section className="grid gap-4">
      <div className="surface-panel rounded-2xl p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Owner Review</p>
            <h3 className="mt-1 text-2xl font-bold text-slate-900">Evidence Review</h3>
            <p className="mt-1 text-sm text-slate-500">
              {requestItemName} | Assignment ID: {assignmentId || "Unavailable"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/owner/my-requests")}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Back to My Requests
          </button>
        </div>
      </div>

      {loading ? (
        <div className="surface-panel rounded-2xl p-5 text-sm text-slate-500">Loading evidence...</div>
      ) : null}

      {!loading && resolvingAssignmentId ? (
        <div className="surface-panel rounded-2xl p-5 text-sm text-slate-500">Resolving assignment...</div>
      ) : null}

      {!loading && !resolvingAssignmentId && !assignmentId ? (
        <section className="surface-panel rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
          Assignment not found for this request yet.
        </section>
      ) : null}

      {!loading && assignmentId && evidenceItems.length === 0 ? (
        <section className="surface-panel rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
          No evidence uploaded yet.
        </section>
      ) : null}

      {!loading && assignmentId && evidenceItems.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-2">
          {evidenceItems.map((evidence, index) => {
            const rawFileUrl = getEvidenceFileUrl(evidence);
            const previewUrl = resolveEvidenceUrl(rawFileUrl);
            const previewIsVideo = isVideoFile(evidence, rawFileUrl);

            return (
              <article
                key={String(evidence.id ?? evidence._id ?? previewUrl ?? `${index}`)}
                className="surface-panel rounded-2xl p-4"
              >
                {previewUrl ? (
                  previewIsVideo ? (
                    <video
                      controls
                      className="h-56 w-full rounded-xl border border-slate-200 bg-black object-cover"
                    >
                      <source src={previewUrl} />
                      Your browser does not support video preview.
                    </video>
                  ) : (
                    <img
                      src={previewUrl}
                      alt="Evidence"
                      className="h-56 w-full rounded-xl border border-slate-200 object-cover"
                    />
                  )
                ) : (
                  <div className="flex h-56 w-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
                    File preview not available
                  </div>
                )}

                <p className="mt-3 text-sm text-slate-600">{getEvidenceCaption(evidence)}</p>
              </article>
            );
          })}
        </section>
      ) : null}

      <section className="surface-panel rounded-2xl p-5">
        <h4 className="text-base font-bold text-slate-900">Assignment Confirmation</h4>
        <p className="mt-1 text-sm text-slate-500">Current Status: {getDecisionLabel(decision)}</p>

        <div className="mt-3">
          <span
            className={`inline-flex rounded-xl border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${getPaymentStatusMeta(paymentStatus).className}`}
          >
            {getPaymentStatusMeta(paymentStatus).label}
          </span>
        </div>

        {decision ? (
          <p
            className={`mt-3 text-sm font-semibold ${
              decision === "confirmed" ? "text-emerald-600" : "text-amber-600"
            }`}
          >
            {getDecisionLabel(decision)}
          </p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleConfirmDecision("confirmed")}
              disabled={decisionLoading.length > 0 || !assignmentId}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              {decisionLoading === "confirmed" ? "Updating..." : "Confirm"}
            </button>

            <button
              type="button"
              onClick={() => handleConfirmDecision("rejected")}
              disabled={decisionLoading.length > 0 || !assignmentId}
              className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
            >
              {decisionLoading === "rejected" ? "Updating..." : "Reject"}
            </button>
          </div>
        )}
      </section>
    </section>
  );
};
