import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { GlassCard } from "../../components/common/GlassCard";
import { StatusBadge } from "../../components/common/StatusBadge";
import { extractArray, unwrapData } from "../../services/apiUtils";
import { getFinderAssignments } from "../../services/assignmentService";

const getAssignmentId = (assignment) => assignment.id ?? assignment.assignmentId ?? assignment._id;

const getItemName = (assignment) =>
    assignment.itemName ??
    assignment.request?.itemName ??
    assignment.requestId?.itemName ??
    "-";

const getLocation = (assignment) =>
    assignment.location ??
    assignment.request?.lastSeenLocation ??
    assignment.requestId?.lastSeenLocation ??
    "-";

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

const formatReward = (assignment) => {
    const normalizedReward = Number(
        assignment.rewardAmount ??
        assignment.reward ??
        assignment.request?.rewardAmount ??
        assignment.requestId?.rewardAmount,
    );

    if (!Number.isFinite(normalizedReward) || normalizedReward <= 0) {
        return "Not set";
    }

    return `INR ${normalizedReward.toLocaleString()}`;
};

export const FinderMyAssignments = () => {
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                setLoading(true);
                const responsePayload = await getFinderAssignments();
                const normalizedPayload = unwrapData(responsePayload);
                setAssignments(extractArray(normalizedPayload, ["assignments", "items"]));
            } catch (error) {
                const message = error.response?.data?.message ?? "Failed to fetch assignments";
                toast.error(message);
            } finally {
                setLoading(false);
            }
        };

        fetchAssignments();
    }, []);

    if (loading) {
        return <p className="theme-muted text-sm">Loading assignments...</p>;
    }

    if (assignments.length === 0) {
        return (
            <GlassCard className="border-dashed text-center">
                No assignments available.
            </GlassCard>
        );
    }

    return (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {assignments.map((assignment) => {
                const assignmentId = getAssignmentId(assignment);
                const assignmentStatus = String(assignment.status ?? assignment.assignmentStatus ?? "unknown").toLowerCase();
                const handleOpenDetails = () => {
                    if (!assignmentId) {
                        toast.error("Assignment id missing");
                        return;
                    }

                    navigate(`/finder/assignment/${assignmentId}`);
                };

                return (
                    <GlassCard
                        key={String(assignmentId ?? assignment.itemName)}
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
                                    <p className="theme-text truncate text-base font-semibold">{getItemName(assignment)}</p>
                                    <p className="theme-muted mt-1 truncate text-xs">Assignment workflow</p>
                                </div>

                                <StatusBadge status={assignmentStatus} />
                            </div>

                            <div className="grid gap-2">
                                <p className="theme-text">
                                    <span className="theme-muted mr-1 font-semibold">Location:</span>
                                    {getLocation(assignment)}
                                </p>
                                <p className="theme-text">
                                    <span className="theme-muted mr-1 font-semibold">Created:</span>
                                    {formatDate(assignment.createdAt)}
                                </p>
                                <p className="theme-text">
                                    <span className="theme-muted mr-1 font-semibold">Reward:</span>
                                    {formatReward(assignment)}
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
