import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { EvidenceGallery } from "../../components/common/EvidenceGallery";
import { GlassCard } from "../../components/common/GlassCard";
import { GradientButton } from "../../components/common/GradientButton";
import { Modal } from "../../components/common/Modal";
import { StatusBadge } from "../../components/common/StatusBadge";
import { Timeline } from "../../components/common/Timeline";
import { extractArray } from "../../services/apiUtils";
import { getFinderAssignmentById } from "../../services/assignmentService";
import { getEvidenceByAssignmentId, uploadEvidenceFile } from "../../services/evidenceService";
import { getPaymentByRequestId, getPaymentStatusOverrides } from "../../services/paymentService";

const normalizeStatus = (value, fallback = "") => String(value ?? fallback).toLowerCase();

const formatDate = (rawDate) => {
  if (!rawDate) {
    return "-";
  }

  const parsedDate = new Date(rawDate);

  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return parsedDate.toLocaleString();
};

const getAssignmentId = (assignment) => assignment?.id ?? assignment?.assignmentId ?? assignment?._id;

const getRequestId = (assignment) =>
  assignment?.requestId?._id ??
  assignment?.requestId?.id ??
  assignment?.requestId ??
  assignment?.request?._id ??
  assignment?.request?.id;

const getRequestStatus = (assignment) =>
  normalizeStatus(assignment?.request?.status ?? assignment?.request?.requestStatus, "open");

const getItemName = (assignment) =>
  assignment?.itemName ?? assignment?.request?.itemName ?? assignment?.requestId?.itemName ?? "-";

const getLocation = (assignment) =>
  assignment?.location ??
  assignment?.request?.lastSeenLocation ??
  assignment?.requestId?.lastSeenLocation ??
  "-";

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

const normalizeEvidenceList = (payload) => {
  const list = extractArray(payload, ["evidence", "evidences", "items", "files"]);

  if (list.length > 0) {
    return list;
  }

  if (payload && typeof payload === "object" && getEvidenceFileUrl(payload)) {
    return [payload];
  }

  return [];
};

export const FinderAssignmentDetails = () => {
  const navigate = useNavigate();
  const { id: assignmentId } = useParams();

  const [assignment, setAssignment] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("unpaid");
  const [evidenceItems, setEvidenceItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [viewEvidenceModalOpen, setViewEvidenceModalOpen] = useState(false);
  const [submittingEvidence, setSubmittingEvidence] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [caption, setCaption] = useState("");

  const assignmentStatus = useMemo(
    () => normalizeStatus(assignment?.status ?? assignment?.assignmentStatus, "pending"),
    [assignment],
  );
  const requestStatus = useMemo(() => getRequestStatus(assignment), [assignment]);
  const evidenceSubmitted = evidenceItems.length > 0;

  const workflowCompleted =
    requestStatus === "completed" || assignmentStatus === "completed" || assignmentStatus === "confirmed";

  const showUploadAction = assignmentStatus === "accepted" && !workflowCompleted;
  const canUpload = showUploadAction && !evidenceSubmitted;

  const loadAssignmentDetails = useCallback(async () => {
    if (!assignmentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const assignmentRecord = await getFinderAssignmentById(assignmentId);
      setAssignment(assignmentRecord);

      try {
        const evidencePayload = await getEvidenceByAssignmentId(assignmentId);
        setEvidenceItems(normalizeEvidenceList(evidencePayload));
      } catch {
        setEvidenceItems([]);
      }

      const requestId = getRequestId(assignmentRecord);
      const overrides = getPaymentStatusOverrides();
      const overridePaymentStatus = requestId ? overrides[String(requestId)] : "";

      if (overridePaymentStatus) {
        setPaymentStatus(overridePaymentStatus);
      } else if (requestId) {
        try {
          const payment = await getPaymentByRequestId(requestId);
          setPaymentStatus(normalizeStatus(payment?.paymentStatus, "unpaid") || "unpaid");
        } catch {
          setPaymentStatus("unpaid");
        }
      } else {
        setPaymentStatus("unpaid");
      }
    } catch (error) {
      const message = error.response?.data?.message ?? error.message ?? "Failed to load assignment details";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    loadAssignmentDetails();
  }, [loadAssignmentDetails]);

  const handleSubmitEvidence = async () => {
    if (!canUpload) {
      toast.error("Evidence upload is not available for this assignment state");
      return;
    }

    if (!selectedFile) {
      toast.error("Select a file before uploading");
      return;
    }

    if (!caption.trim()) {
      toast.error("Caption is required");
      return;
    }

    try {
      setSubmittingEvidence(true);
      await uploadEvidenceFile({
        assignmentId,
        caption: caption.trim(),
        file: selectedFile,
      });
      toast.success("Evidence uploaded");

      const evidencePayload = await getEvidenceByAssignmentId(assignmentId);
      setEvidenceItems(normalizeEvidenceList(evidencePayload));

      setUploadModalOpen(false);
      setSelectedFile(null);
      setCaption("");
    } catch (error) {
      const message = error.response?.data?.message ?? "Failed to upload evidence";
      toast.error(message);
    } finally {
      setSubmittingEvidence(false);
    }
  };

  if (loading) {
    return <p className="theme-muted text-sm">Loading assignment details...</p>;
  }

  if (!assignment) {
    return (
      <GlassCard className="border-dashed text-center">
        Assignment not found.
      </GlassCard>
    );
  }

  const timelineItems = [
    { label: "Assignment Created", value: formatDate(assignment.createdAt) },
    { label: "Request Status", value: requestStatus || "-" },
    { label: "Assignment Status", value: assignmentStatus || "-" },
    { label: "Payment Status", value: paymentStatus || "-" },
    { label: "Evidence Submitted", value: evidenceSubmitted ? "Yes" : "No" },
  ];

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="theme-text text-xl font-semibold">Assignment Details</h2>
        <GradientButton variant="accent" onClick={() => navigate("/finder/my-assignments")}>Back</GradientButton>
      </div>

      <GlassCard className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="theme-text text-base font-semibold">Request Info</h3>
          <StatusBadge status={requestStatus} />
        </div>

        <div className="grid gap-2 text-sm md:grid-cols-2">
          <p className="theme-text">
            <span className="theme-muted mr-1 font-semibold">Item:</span>
            {getItemName(assignment)}
          </p>
          <p className="theme-text">
            <span className="theme-muted mr-1 font-semibold">Location:</span>
            {getLocation(assignment)}
          </p>
          <p className="theme-text">
            <span className="theme-muted mr-1 font-semibold">Created:</span>
            {formatDate(assignment.createdAt)}
          </p>
          <p className="theme-text">
            <span className="theme-muted mr-1 font-semibold">Evidence:</span>
            {evidenceSubmitted ? "Submitted" : "Pending"}
          </p>
        </div>
      </GlassCard>

      {workflowCompleted ? (
        <GlassCard>
          <p className="theme-text text-sm font-semibold">Workflow completed. Interactions are hidden.</p>
        </GlassCard>
      ) : (
        <>
          <GlassCard className="grid gap-3">
            <h3 className="theme-text text-base font-semibold">Payment Section</h3>
            <p className="theme-text text-sm">
              <span className="theme-muted mr-1 font-semibold">Payment Status:</span>
              <StatusBadge status={paymentStatus} className="ml-2" />
            </p>
          </GlassCard>

          <GlassCard className="grid gap-3">
            <h3 className="theme-text text-base font-semibold">Assignment Section</h3>
            <div className="grid gap-2 text-sm md:grid-cols-2">
              <p className="theme-text">
                <span className="theme-muted mr-1 font-semibold">Assignment ID:</span>
                {getAssignmentId(assignment) ?? "-"}
              </p>
              <p className="theme-text">
                <span className="theme-muted mr-1 font-semibold">Assignment Status:</span>
                <StatusBadge status={assignmentStatus} className="ml-2" />
              </p>
            </div>

            {showUploadAction ? (
              <div className="flex justify-end">
                <GradientButton onClick={() => setUploadModalOpen(true)} disabled={!canUpload}>
                  {canUpload ? "Upload Evidence" : "Evidence Submitted"}
                </GradientButton>
              </div>
            ) : null}
          </GlassCard>

          <GlassCard className="grid gap-3">
            <h3 className="theme-text text-base font-semibold">Evidence Section</h3>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="theme-text text-sm">
                <span className="theme-muted mr-1 font-semibold">Evidence Submitted:</span>
                {evidenceSubmitted ? "Yes" : "No"}
              </p>

              {evidenceSubmitted ? (
                <GradientButton onClick={() => setViewEvidenceModalOpen(true)}>View Evidence</GradientButton>
              ) : null}
            </div>
          </GlassCard>

          <GlassCard className="grid gap-3">
            <h3 className="theme-text text-base font-semibold">Timeline Section</h3>
            <Timeline items={timelineItems} />
          </GlassCard>
        </>
      )}

      <Modal
        isOpen={uploadModalOpen}
        title="Evidence Upload"
        onClose={() => setUploadModalOpen(false)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setUploadModalOpen(false)}
              className="rounded-lg border border-(--border) px-3 py-1.5 text-sm theme-text transition hover:bg-(--bg-soft)"
            >
              Cancel
            </button>
            <GradientButton onClick={handleSubmitEvidence} disabled={submittingEvidence}>
              {submittingEvidence ? "Uploading..." : "Submit"}
            </GradientButton>
          </>
        }
      >
        <div className="grid gap-3 text-sm theme-text">
          <label className="grid gap-1.5">
            File
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              className="rounded-lg border border-(--border) bg-(--bg) px-3 py-2"
            />
          </label>

          <label className="grid gap-1.5">
            Caption
            <input
              type="text"
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              className="rounded-lg border border-(--border) bg-(--bg) px-3 py-2"
            />
          </label>
        </div>
      </Modal>

      <Modal
        isOpen={viewEvidenceModalOpen}
        title="Evidence View"
        onClose={() => setViewEvidenceModalOpen(false)}
        size="lg"
      >
        <EvidenceGallery items={evidenceItems} />
      </Modal>
    </section>
  );
};
