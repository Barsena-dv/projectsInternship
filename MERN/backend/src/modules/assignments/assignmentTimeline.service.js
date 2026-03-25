const AssignmentTimelineEvent = require('./assignmentTimeline.model');

const normalizeActor = ({ actorUserId = null, actorRole = 'system', actorLabel = 'System' } = {}) => ({
  user: actorUserId || null,
  role: actorRole,
  label: actorLabel,
});

const addTimelineEvent = async ({
  assignmentId,
  requestId,
  action,
  details = {},
  actorUserId = null,
  actorRole = 'system',
  actorLabel = 'System',
}) => {
  if (!requestId || !action) {
    return null;
  }

  const payload = {
    request: requestId,
    action,
    details,
    actor: normalizeActor({ actorUserId, actorRole, actorLabel }),
  };

  if (assignmentId) {
    payload.assignment = assignmentId;
  }

  return AssignmentTimelineEvent.create(payload);
};

const getTimelineByAssignment = async (assignmentId) => (
  AssignmentTimelineEvent.find({ assignment: assignmentId })
    .populate('actor.user', 'full_name role')
    .sort({ createdAt: -1 })
);

const getTimelineByRequest = async (requestId) => (
  AssignmentTimelineEvent.find({ request: requestId })
    .populate('actor.user', 'full_name role')
    .sort({ createdAt: -1 })
);

module.exports = {
  addTimelineEvent,
  getTimelineByAssignment,
  getTimelineByRequest,
};
