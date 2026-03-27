const FinderAssignment = require('./assignment.model');
const LostItemRequest = require('../requests/request.model');
const { createNotification } = require('../notifications/notification.service');
const { addTimelineEvent } = require('./assignmentTimeline.service');

const INACTIVITY_MINUTES = Number(process.env.ASSIGNMENT_INACTIVITY_MINUTES || 45);

const isExpired = (deadlineAt) => {
  if (!deadlineAt) return false;
  const ms = new Date(deadlineAt).getTime();
  return Number.isFinite(ms) && ms <= Date.now();
};

const isOwnerDeadlineFailed = (serviceDeadline) => {
  if (!serviceDeadline) return false;
  const ms = new Date(serviceDeadline).getTime();
  return Number.isFinite(ms) && ms <= Date.now();
};

const evaluateAssignmentsLifecycle = async () => {
  const assignments = await FinderAssignment.find({
    status: { $in: ['active', 'inactive', 'paused'] },
  }).populate('request');

  const now = Date.now();

  for (const assignment of assignments) {
    const request = assignment.request || await LostItemRequest.findById(assignment.request);
    if (!request) continue;

    if (isOwnerDeadlineFailed(request.serviceDeadline)) {
      assignment.status = 'failed';
      await assignment.save();

      request.requestStatus = 'failed';
      await request.save();

      try {
        await Promise.all([
          createNotification({
            userId: assignment.finder,
            type: 'assignment',
            title: 'Request Failed',
            message: `Owner service deadline for "${request.itemName}" has ended. Assignment marked failed.`,
            data: { assignmentId: assignment._id, requestId: request._id },
          }),
          createNotification({
            userId: request.owner,
            type: 'assignment',
            title: 'Request Failed',
            message: `Service deadline ended for "${request.itemName}". Request and assignment marked failed.`,
            data: { assignmentId: assignment._id, requestId: request._id },
          }),
        ]);
      } catch (error) {
        console.error('Failed deadline notification failed:', error.message);
      }

      await addTimelineEvent({
        assignmentId: assignment._id,
        requestId: request._id,
        action: 'REQUEST_SERVICE_DEADLINE_FAILED',
        details: { serviceDeadline: request.serviceDeadline },
      });

      continue;
    }

    if (isExpired(assignment.deadlineAt)) {
      assignment.status = 'expired';
      await assignment.save();

      try {
        await Promise.all([
          createNotification({
            userId: assignment.finder,
            type: 'assignment',
            title: 'Finder Assignment Expired',
            message: `Your 4-hour assignment deadline for "${request.itemName}" has expired.`,
            data: { assignmentId: assignment._id, requestId: request._id },
          }),
          createNotification({
            userId: request.owner,
            type: 'assignment',
            title: 'Finder Assignment Expired',
            message: `Finder assignment deadline for "${request.itemName}" has expired. You can retry this request.`,
            data: { assignmentId: assignment._id, requestId: request._id },
          }),
        ]);
      } catch (error) {
        console.error('Deadline notification failed:', error.message);
      }

      await addTimelineEvent({
        assignmentId: assignment._id,
        requestId: request._id,
        action: 'DEADLINE_REACHED',
        details: { deadlineAt: assignment.deadlineAt },
      });

      continue;
    }

    const lastActivityAt = new Date(assignment.lastActivityAt || assignment.assignedAt || assignment.createdAt).getTime();
    if (!Number.isFinite(lastActivityAt)) continue;

    const inactiveThresholdMs = INACTIVITY_MINUTES * 60 * 1000;
    const shouldMarkInactive = now - lastActivityAt >= inactiveThresholdMs;

    if (shouldMarkInactive && assignment.status === 'active') {
      assignment.status = 'inactive';
      assignment.inactivityMarkedAt = new Date();
      await assignment.save();

      try {
        await createNotification({
          userId: request.owner,
          type: 'assignment',
          title: 'Inactivity Warning',
          message: `Finder has not posted updates for "${request.itemName}" recently. Assignment is now marked inactive.`,
          data: { assignmentId: assignment._id, requestId: request._id },
        });
      } catch (error) {
        console.error('Inactivity notification failed:', error.message);
      }

      await addTimelineEvent({
        assignmentId: assignment._id,
        requestId: request._id,
        action: 'ASSIGNMENT_INACTIVE',
        details: {
          inactivityMinutes: INACTIVITY_MINUTES,
          lastActivityAt: assignment.lastActivityAt,
        },
      });
    }
  }
};

let lifecycleTimer = null;

const startAssignmentLifecycleMonitor = () => {
  if (lifecycleTimer) return;

  evaluateAssignmentsLifecycle().catch((error) => {
    console.error('Initial lifecycle evaluation failed:', error.message);
  });

  lifecycleTimer = setInterval(() => {
    evaluateAssignmentsLifecycle().catch((error) => {
      console.error('Lifecycle evaluation failed:', error.message);
    });
  }, 5 * 60 * 1000);
};

module.exports = {
  evaluateAssignmentsLifecycle,
  startAssignmentLifecycleMonitor,
};
