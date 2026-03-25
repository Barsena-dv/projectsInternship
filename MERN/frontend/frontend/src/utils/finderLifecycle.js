const toKey = (value, fallback = 'unknown') => String(value || fallback).toLowerCase();

export const isDeadlineMissed = (deadlineValue) => {
  if (!deadlineValue) return false;
  const deadline = new Date(deadlineValue);
  if (Number.isNaN(deadline.getTime())) return false;
  return deadline.getTime() <= Date.now();
};

export const deriveFinderLifecycleState = ({ assignment, evidence, deadline }) => {
  const assignmentStatus = toKey(assignment?.status, 'active');
  const evidenceStatus = toKey(evidence?.verificationStatus, 'none');
  const chatUnlocked = Boolean(assignment?.chatUnlocked || assignment?.evidenceVerified);

  if (assignmentStatus === 'completed') return 'completed';
  if (assignmentStatus === 'cancelled') return 'cancelled';
  if (assignmentStatus === 'expired' || isDeadlineMissed(deadline || assignment?.deadlineAt || assignment?.request?.serviceDeadline)) {
    return 'expired';
  }
  if (assignmentStatus === 'inactive') {
    return 'inactive';
  }

  if (evidenceStatus === 'verified' || chatUnlocked) {
    return 'verified';
  }

  if (evidenceStatus === 'rejected') {
    return 'evidence_rejected';
  }

  if (evidenceStatus === 'pending' || assignment?.evidenceSubmitted) {
    return 'evidence_submitted';
  }

  if (!assignment) {
    return 'none';
  }

  return 'assigned';
};

export const getFinderLifecycleMessage = (state) => {
  switch (state) {
    case 'assigned':
      return 'Next step: add tracking updates while searching, then submit evidence.';
    case 'evidence_submitted':
      return 'Next step: wait for owner verification.';
    case 'evidence_rejected':
      return 'Next step: review rejection notes and re-submit clearer evidence.';
    case 'verified':
      return 'Next step: coordinate final handoff in chat.';
    case 'inactive':
      return 'No updates were posted recently. Add a progress update to reactivate this assignment.';
    case 'expired':
      return 'Deadline reached. Assignment is marked as expired.';
    case 'cancelled':
      return 'Assignment has been cancelled.';
    case 'completed':
      return 'Assignment completed. Payment and payout flow finalized.';
    default:
      return 'Assignment in progress.';
  }
};
