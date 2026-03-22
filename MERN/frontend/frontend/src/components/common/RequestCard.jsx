import { FiMapPin, FiTag } from "react-icons/fi";
import { StatusBadge } from "./StatusBadge";

const formatReward = (rewardAmount) => {
  if (rewardAmount === null || rewardAmount === undefined || rewardAmount === "") {
    return "Not set";
  }

  const numericReward = Number(rewardAmount);

  if (Number.isNaN(numericReward)) {
    return rewardAmount;
  }

  return `INR ${numericReward.toLocaleString()}`;
};

export const RequestCard = ({ request, actionLabel, onAction, actionLoading, footerContent }) => {
  const itemName = request.itemName ?? "Unknown item";
  const status = String(request.status ?? request.requestStatus ?? "open").toLowerCase();
  const category =
    request.categoryName ??
    request.category?.name ??
    request.categoryId?.name ??
    request.category ??
    request.categoryId ??
    "Unknown";
  const location = request.lastSeenLocation ?? request.location ?? "Unknown";
  const reward = formatReward(request.rewardAmount ?? request.reward);

  return (
    <article className="glass-card card-hover rounded-2xl p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="theme-text text-lg font-bold">{itemName}</h3>
        <StatusBadge status={status} />
      </div>

      <div className="theme-muted mt-5 grid gap-2 text-sm md:grid-cols-3">
        <div className="inline-flex items-center gap-2 rounded-xl border border-(--border) bg-(--bg-soft) px-3 py-2">
          <FiTag className="h-4 w-4 text-(--primary)" />
          <span className="theme-text">{category}</span>
        </div>

        <div className="inline-flex items-center gap-2 rounded-xl border border-(--border) bg-(--bg-soft) px-3 py-2">
          <FiMapPin className="h-4 w-4 text-(--primary)" />
          <span className="theme-text">{location}</span>
        </div>

        <div className="theme-text rounded-xl border border-(--border) bg-(--bg-soft) px-3 py-2 font-semibold">
          Reward: {reward}
        </div>
      </div>

      {onAction || footerContent ? (
        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          {footerContent}

          {onAction ? (
            <button
              type="button"
              onClick={onAction}
              disabled={actionLoading}
              className="gradient-button gradient-primary btn-glow rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed"
            >
              {actionLoading ? "Please wait..." : actionLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
};
