import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { GlassCard } from "../../components/common/GlassCard";
import { StatusBadge } from "../../components/common/StatusBadge";
import { extractArray, unwrapData } from "../../services/apiUtils";
import { getOwnerRequests } from "../../services/requestService";

const getRequestId = (request) => request.id ?? request.requestId ?? request._id;

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

const formatReward = (rawReward) => {
  const normalizedReward = Number(rawReward ?? 0);

  if (!Number.isFinite(normalizedReward) || normalizedReward <= 0) {
    return "Not set";
  }

  return `INR ${normalizedReward.toLocaleString()}`;
};

export const OwnerMyRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const responsePayload = await getOwnerRequests();
        const normalizedPayload = unwrapData(responsePayload);
        setRequests(extractArray(normalizedPayload, ["requests", "items"]));
      } catch (error) {
        const message = error.response?.data?.message ?? "Failed to fetch requests";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  if (loading) {
    return <p className="theme-muted text-sm">Loading requests...</p>;
  }

  if (requests.length === 0) {
    return (
      <GlassCard className="border-dashed text-center">
        No requests available.
      </GlassCard>
    );
  }

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {requests.map((request) => {
        const requestId = getRequestId(request);
        const requestStatus = String(request.status ?? request.requestStatus ?? "unknown").toLowerCase();
        const handleOpenDetails = () => {
          if (!requestId) {
            toast.error("Request id missing");
            return;
          }

          navigate(`/owner/request/${requestId}`);
        };

        return (
          <GlassCard
            key={String(requestId ?? request.itemName)}
            as="article"
            interactive
            role="button"
            tabIndex={0}
            onClick={handleOpenDetails}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleOpenDetails();
              }
            }}
            className="cursor-pointer"
          >
            <div className="flex h-full flex-col gap-4 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="theme-text truncate text-base font-semibold">{request.itemName ?? "Unnamed item"}</p>
                  <p className="theme-muted mt-1 truncate text-xs">{request.description ?? "No description provided"}</p>
                </div>

                <StatusBadge status={requestStatus} />
              </div>

              <div className="grid gap-2">
                <p className="theme-text">
                  <span className="theme-muted mr-1 font-semibold">Location:</span>
                  {request.lastSeenLocation ?? "-"}
                </p>
                <p className="theme-text">
                  <span className="theme-muted mr-1 font-semibold">Created:</span>
                  {formatDate(request.createdAt)}
                </p>
                <p className="theme-text">
                  <span className="theme-muted mr-1 font-semibold">Reward:</span>
                  {formatReward(request.rewardAmount ?? request.reward)}
                </p>
              </div>

              <div className="mt-auto pt-1">
                <span className="inline-flex rounded-lg border border-(--border) bg-(--bg-soft) px-3 py-1.5 text-xs font-semibold theme-text">
                  Open Details
                </span>
              </div>
            </div>
          </GlassCard>
        );
      })}
    </section>
  );
};
