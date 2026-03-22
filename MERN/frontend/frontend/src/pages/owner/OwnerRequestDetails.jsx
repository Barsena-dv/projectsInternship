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
import {
    confirmAssignmentDecision,
    getLatestAssignmentByRequestId,
} from "../../services/assignmentService";
import { getEvidenceByAssignmentId } from "../../services/evidenceService";
import {
    getPaymentByRequestId,
    getPaymentStatusOverrides,
    lockPaymentForRequest,
    setPaymentStatusOverride,
} from "../../services/paymentService";
import {
    getOwnerRequestById,
    publishRequest,
    updateOwnerRequest,
} from "../../services/requestService";

const normalizeStatus = (value, fallback = "") => String(value ?? fallback).toLowerCase();

const normalizePaymentStatus = (value) => {
  const normalizedStatus = normalizeStatus(value, "unpaid");

  if (normalizedStatus === "locked") {
    return "paid";
  }

  return normalizedStatus;
};

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

const getAssignmentId = (assignment) =>
  assignment?.resolvedAssignmentId ?? assignment?.id ?? assignment?.assignmentId ?? assignment?._id;

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

export const OwnerRequestDetails = () => {
  const navigate = useNavigate();
  const { id: requestId } = useParams();

  const [request, setRequest] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [payment, setPayment] = useState(null);
  const [paymentOverride, setPaymentOverride] = useState("");
  const [evidenceItems, setEvidenceItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [editForm, setEditForm] = useState({
    itemName: "",
    description: "",
    lastSeenLocation: "",
    rewardAmount: "",
  });
  const [paying, setPaying] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [savingEdits, setSavingEdits] = useState(false);
  const [decisionLoading, setDecisionLoading] = useState("");

  const requestStatus = useMemo(
    () => normalizeStatus(request?.status ?? request?.requestStatus, "draft"),
    [request],
  );
  const assignmentStatus = useMemo(
    () =>
      normalizeStatus(
        assignment?.status ?? assignment?.assignmentStatus ?? assignment?.ownerConfirmation,
        "pending",
      ),
    [assignment],
  );
  const paymentStatus = useMemo(
    () =>
      normalizePaymentStatus(
        paymentOverride || payment?.paymentStatus || payment?.status || request?.paymentStatus,
      ),
    [payment, paymentOverride, request?.paymentStatus],
  );
  const evidenceSubmitted = evidenceItems.length > 0;

  const workflowCompleted =
    requestStatus === "completed" || assignmentStatus === "completed" || assignmentStatus === "confirmed";

  const canPay = requestStatus === "draft" && paymentStatus === "unpaid" && !workflowCompleted;
  const canPublish = requestStatus === "draft" && paymentStatus === "paid" && !workflowCompleted;
  const canEditRequest = ["draft", "open"].includes(requestStatus) && !workflowCompleted;
  const canReviewEvidence = assignmentStatus === "evidence_submitted" && !workflowCompleted;

  const loadRequestDetails = useCallback(async () => {
    if (!requestId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const ownerRequest = await getOwnerRequestById(requestId);
      setRequest(ownerRequest);
      setPaymentAmount(String(ownerRequest.rewardAmount ?? ownerRequest.reward ?? ""));

      const overrides = getPaymentStatusOverrides();
      setPaymentOverride(overrides[String(requestId)] ?? "");

      try {
        const latestPayment = await getPaymentByRequestId(requestId);
        setPayment(latestPayment);
      } catch {
        setPayment(null);
      }

      let latestAssignment = null;

      try {
        latestAssignment = await getLatestAssignmentByRequestId(requestId);
      } catch {
        latestAssignment = null;
      }

      setAssignment(latestAssignment);

      const assignmentId = getAssignmentId(latestAssignment);

      if (!assignmentId) {
        setEvidenceItems([]);
        return;
      }

      try {
        const evidencePayload = await getEvidenceByAssignmentId(assignmentId);
        setEvidenceItems(normalizeEvidenceList(evidencePayload));
      } catch {
        setEvidenceItems([]);
      }
    } catch (error) {
      const message = error.response?.data?.message ?? error.message ?? "Failed to load request details";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    loadRequestDetails();
  }, [loadRequestDetails]);

  useEffect(() => {
    if (!request) {
      return;
    }

    setEditForm({
      itemName: request.itemName ?? "",
      description: request.description ?? "",
      lastSeenLocation: request.lastSeenLocation ?? "",
      rewardAmount: String(request.rewardAmount ?? request.reward ?? ""),
    });
  }, [request]);

  const handlePay = async () => {
    const amount = Number(paymentAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Amount must be greater than zero");
      return;
    }

    try {
      setPaying(true);
      await lockPaymentForRequest({
        requestId,
        amount,
      });

      setPaymentStatusOverride(requestId, "paid");
      setPaymentOverride("paid");
      setPayment((previousPayment) => ({
        ...(previousPayment ?? {}),
        paymentStatus: "paid",
        amount,
      }));

      setPaymentModalOpen(false);
      toast.success("Payment completed");
    } catch (error) {
      const message = error.response?.data?.message ?? "Failed to lock payment";
      toast.error(message);
    } finally {
      setPaying(false);
    }
  };

  const handlePublish = async () => {
    try {
      setPublishing(true);
      await publishRequest(requestId);
      setRequest((previousRequest) => {
        if (!previousRequest) {
          return previousRequest;
        }

        return {
          ...previousRequest,
          status: "open",
          requestStatus: "open",
        };
      });
      toast.success("Request published");
    } catch (error) {
      const message = error.response?.data?.message ?? "Failed to publish request";
      toast.error(message);
    } finally {
      setPublishing(false);
    }
  };

  const handleEditInputChange = (event) => {
    const { name, value } = event.target;

    setEditForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  };

  const handleSaveRequestEdits = async () => {
    const normalizedRewardAmount = Number(editForm.rewardAmount ?? 0);

    if (!editForm.itemName.trim()) {
      toast.error("Item name is required");
      return;
    }

    if (!editForm.description.trim()) {
      toast.error("Description is required");
      return;
    }

    if (!editForm.lastSeenLocation.trim()) {
      toast.error("Last seen location is required");
      return;
    }

    if (!Number.isFinite(normalizedRewardAmount) || normalizedRewardAmount < 0) {
      toast.error("Reward amount cannot be negative");
      return;
    }

    try {
      setSavingEdits(true);

      await updateOwnerRequest(requestId, {
        itemName: editForm.itemName.trim(),
        description: editForm.description.trim(),
        lastSeenLocation: editForm.lastSeenLocation.trim(),
        rewardAmount: normalizedRewardAmount,
      });

      setRequest((previousRequest) =>
        previousRequest
          ? {
              ...previousRequest,
              itemName: editForm.itemName.trim(),
              description: editForm.description.trim(),
              lastSeenLocation: editForm.lastSeenLocation.trim(),
              rewardAmount: normalizedRewardAmount,
            }
          : previousRequest,
      );
      setPaymentAmount(String(normalizedRewardAmount));
      setEditModalOpen(false);
      toast.success("Request updated");
    } catch (error) {
      const message = error.response?.data?.message ?? "Failed to update request";
      toast.error(message);
    } finally {
      setSavingEdits(false);
    }
  };

  const handleAssignmentDecision = async (decision) => {
    const assignmentId = getAssignmentId(assignment);

    if (!assignmentId) {
      toast.error("Assignment id missing");
      return;
    }

    try {
      setDecisionLoading(decision);
      await confirmAssignmentDecision(assignmentId, decision);

      if (decision === "confirmed") {
        setPaymentStatusOverride(requestId, "released");
        setPaymentOverride("released");
        toast.success("Assignment accepted");
      } else {
        setPaymentStatusOverride(requestId, "refunded");
        setPaymentOverride("refunded");
        toast.success("Assignment rejected");
      }

      await loadRequestDetails();
    } catch (error) {
      const message = error.response?.data?.message ?? "Failed to update assignment";
      toast.error(message);
    } finally {
      setDecisionLoading("");
    }
  };

  if (loading) {
    return <p className="theme-muted text-sm">Loading request details...</p>;
  }

  if (!request) {
    return (
      <GlassCard className="border-dashed text-center">
        Request not found.
      </GlassCard>
    );
  }

  const timelineItems = [
    { label: "Request Created", value: formatDate(request.createdAt) },
    { label: "Request Status", value: requestStatus || "-" },
    { label: "Payment Status", value: paymentStatus || "-" },
    { label: "Assignment Status", value: assignmentStatus || "-" },
    { label: "Evidence Submitted", value: evidenceSubmitted ? "Yes" : "No" },
  ];

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="theme-text text-xl font-semibold">Request Details</h2>

        <div className="flex flex-wrap items-center gap-2">
          {canEditRequest ? (
            <GradientButton onClick={() => setEditModalOpen(true)}>Edit Request</GradientButton>
          ) : null}
          <GradientButton variant="accent" onClick={() => navigate("/owner/my-requests")}>Back</GradientButton>
        </div>
      </div>

      <GlassCard className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="theme-text text-base font-semibold">Request Info</h3>
          <StatusBadge status={requestStatus} />
        </div>

        <div className="grid gap-2 text-sm md:grid-cols-2">
          <p className="theme-text">
            <span className="theme-muted mr-1 font-semibold">Item:</span>
            {request.itemName ?? "-"}
          </p>
          <p className="theme-text">
            <span className="theme-muted mr-1 font-semibold">Location:</span>
            {request.lastSeenLocation ?? "-"}
          </p>
          <p className="theme-text">
            <span className="theme-muted mr-1 font-semibold">Created:</span>
            {formatDate(request.createdAt)}
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="theme-text text-sm">
                <span className="theme-muted mr-1 font-semibold">Payment Status:</span>
                <StatusBadge status={paymentStatus} className="ml-2" />
              </p>

              {canPay ? (
                <GradientButton onClick={() => setPaymentModalOpen(true)}>Pay</GradientButton>
              ) : null}
            </div>
          </GlassCard>

          <GlassCard className="grid gap-3">
            <h3 className="theme-text text-base font-semibold">Assignment Section</h3>
            <div className="grid gap-2 text-sm md:grid-cols-2">
              <p className="theme-text">
                <span className="theme-muted mr-1 font-semibold">Assignment ID:</span>
                {getAssignmentId(assignment) ?? "Not assigned"}
              </p>
              <p className="theme-text">
                <span className="theme-muted mr-1 font-semibold">Assignment Status:</span>
                <StatusBadge status={assignmentStatus} className="ml-2" />
              </p>
            </div>

            {canPublish ? (
              <div className="flex justify-end">
                <GradientButton onClick={handlePublish} disabled={publishing}>
                  {publishing ? "Publishing..." : "Publish"}
                </GradientButton>
              </div>
            ) : null}

            {canReviewEvidence ? (
              <div className="flex flex-wrap justify-end gap-2">
                <GradientButton
                  variant="accent"
                  onClick={() => handleAssignmentDecision("rejected")}
                  disabled={decisionLoading.length > 0}
                >
                  {decisionLoading === "rejected" ? "Rejecting..." : "Reject"}
                </GradientButton>

                <GradientButton
                  onClick={() => handleAssignmentDecision("confirmed")}
                  disabled={decisionLoading.length > 0}
                >
                  {decisionLoading === "confirmed" ? "Accepting..." : "Accept"}
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
                <GradientButton onClick={() => setEvidenceModalOpen(true)}>View Evidence</GradientButton>
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
        isOpen={paymentModalOpen}
        title="Payment"
        onClose={() => setPaymentModalOpen(false)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setPaymentModalOpen(false)}
              className="rounded-lg border border-(--border) px-3 py-1.5 text-sm theme-text transition hover:bg-(--bg-soft)"
            >
              Cancel
            </button>
            <GradientButton onClick={handlePay} disabled={paying}>
              {paying ? "Processing..." : "Confirm Payment"}
            </GradientButton>
          </>
        }
      >
        <label className="grid gap-2 text-sm theme-text">
          Amount
          <input
            type="number"
            min="0"
            value={paymentAmount}
            onChange={(event) => setPaymentAmount(event.target.value)}
            className="rounded-lg border border-(--border) bg-(--bg) px-3 py-2 outline-none"
          />
        </label>
      </Modal>

      <Modal
        isOpen={editModalOpen}
        title="Edit Request"
        onClose={() => setEditModalOpen(false)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="rounded-lg border border-(--border) px-3 py-1.5 text-sm theme-text transition hover:bg-(--bg-soft)"
            >
              Cancel
            </button>
            <GradientButton onClick={handleSaveRequestEdits} disabled={savingEdits}>
              {savingEdits ? "Saving..." : "Save Changes"}
            </GradientButton>
          </>
        }
      >
        <div className="grid gap-3 text-sm theme-text">
          <label className="grid gap-1.5">
            Item Name
            <input
              type="text"
              name="itemName"
              value={editForm.itemName}
              onChange={handleEditInputChange}
              className="rounded-lg border border-(--border) bg-(--bg) px-3 py-2 outline-none"
            />
          </label>

          <label className="grid gap-1.5">
            Description
            <textarea
              rows={3}
              name="description"
              value={editForm.description}
              onChange={handleEditInputChange}
              className="rounded-lg border border-(--border) bg-(--bg) px-3 py-2 outline-none"
            />
          </label>

          <label className="grid gap-1.5">
            Last Seen Location
            <input
              type="text"
              name="lastSeenLocation"
              value={editForm.lastSeenLocation}
              onChange={handleEditInputChange}
              className="rounded-lg border border-(--border) bg-(--bg) px-3 py-2 outline-none"
            />
          </label>

          <label className="grid gap-1.5">
            Reward Amount
            <input
              type="number"
              min="0"
              name="rewardAmount"
              value={editForm.rewardAmount}
              onChange={handleEditInputChange}
              className="rounded-lg border border-(--border) bg-(--bg) px-3 py-2 outline-none"
            />
          </label>
        </div>
      </Modal>

      <Modal
        isOpen={evidenceModalOpen}
        title="Evidence View"
        onClose={() => setEvidenceModalOpen(false)}
        size="lg"
      >
        <EvidenceGallery items={evidenceItems} />
      </Modal>
    </section>
  );
};
