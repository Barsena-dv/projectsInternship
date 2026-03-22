import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { GlassCard } from "../../components/common/GlassCard";
import { RequestCard } from "../../components/common/RequestCard";
import { extractArray } from "../../services/apiUtils";
import { acceptAssignment } from "../../services/assignmentService";
import { getOpenRequests } from "../../services/requestService";

const getRequestId = (request) => request.id ?? request.requestId ?? request._id;

export const FinderOpenRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState("");

  const fetchOpenRequests = async () => {
    try {
      setLoading(true);
      const responsePayload = await getOpenRequests();
      setRequests(extractArray(responsePayload, ["requests"]));
    } catch (error) {
      const message = error.response?.data?.message ?? "Failed to fetch open requests";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpenRequests();
  }, []);

  const handleAcceptAssignment = async (request) => {
    const requestId = getRequestId(request);

    if (!requestId) {
      toast.error("Request id missing");
      return;
    }

    try {
      setAcceptingId(String(requestId));
      await acceptAssignment(requestId);
      toast.success("Assignment accepted");
      setRequests((previousRequests) =>
        previousRequests.filter(
          (currentRequest) => String(getRequestId(currentRequest)) !== String(requestId),
        ),
      );
    } catch (error) {
      const message = error.response?.data?.message ?? "Failed to accept assignment";
      toast.error(message);
    } finally {
      setAcceptingId("");
    }
  };

  if (loading) {
    return <p className="theme-muted text-sm">Loading open requests...</p>;
  }

  if (requests.length === 0) {
    return (
      <GlassCard className="border-dashed p-8 text-center">
        No open requests available right now.
      </GlassCard>
    );
  }

  return (
    <section className="grid gap-4">
      <GlassCard className="p-5 sm:p-6">
        <h3 className="theme-text text-xl font-bold">Available Recovery Requests</h3>
        <p className="theme-muted mt-1 text-sm">
          Pick assignments that match your expertise and submit evidence quickly.
        </p>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-(--border) bg-(--bg-soft) px-4 py-1.5 text-sm font-semibold text-(--primary)">
          {requests.length} request{requests.length > 1 ? "s" : ""} ready to accept
        </div>
      </GlassCard>

      {requests.map((request) => {
        const requestId = getRequestId(request);

        return (
          <RequestCard
            key={String(requestId ?? request.itemName)}
            request={request}
            actionLabel="Accept Assignment"
            onAction={() => handleAcceptAssignment(request)}
            actionLoading={String(requestId) === acceptingId}
          />
        );
      })}
    </section>
  );
};
