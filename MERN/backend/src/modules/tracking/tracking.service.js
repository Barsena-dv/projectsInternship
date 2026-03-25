const TrackingUpdate = require('./tracking.model');
const FinderAssignment = require('../assignments/assignment.model');
const { createNotification } = require('../notifications/notification.service');
const { addTimelineEvent } = require('../assignments/assignmentTimeline.service');

const isDeadlineReached = (deadlineAt) => {
  if (!deadlineAt) return false;
  const value = new Date(deadlineAt).getTime();
  return Number.isFinite(value) && value <= Date.now();
};

/**
 * Finder sends a progress update for their assignment
 */
const createUpdate = async (updateData, userId) => {
  const {
    assignmentId,
    statusUpdate,
    mode,
    locationSource,
    locationName,
    currentLat,
    currentLng,
    remarks,
  } = updateData;

  // 1. Validate assignment ownership and existence
  const assignment = await FinderAssignment.findById(assignmentId).populate('request');
  if (!assignment) {
    throw new Error('Assignment not found');
  }

  if (assignment.finder.toString() !== userId.toString()) {
    throw new Error('Only the assigned finder can post progress updates');
  }

  // 2. Lifecycle protection: Block updates if completed, cancelled, or disputed
  if (['completed', 'cancelled', 'expired'].includes(assignment.status)) {
    throw new Error(`Cannot post updates to a ${assignment.status} assignment`);
  }

  if (isDeadlineReached(assignment.deadlineAt)) {
    throw new Error('Assignment deadline has been reached. Tracking updates are disabled.');
  }

  if (assignment.isDisputed) {
    throw new Error('Progress updates are locked while an active dispute exists');
  }

  if (assignment.status === 'inactive') {
    assignment.status = 'active';
  }

  assignment.lastActivityAt = new Date();
  assignment.inactivityMarkedAt = null;
  await assignment.save();

  // 3. Create tracking update
  const update = await TrackingUpdate.create({
    assignmentId,
    finderId: userId,
    statusUpdate: statusUpdate || 'progress',
    mode: mode || 'manual',
    locationSource: locationSource || 'none',
    locationName: locationName || '',
    currentLat: Number.isFinite(Number(currentLat)) ? Number(currentLat) : null,
    currentLng: Number.isFinite(Number(currentLng)) ? Number(currentLng) : null,
    remarks: remarks || '',
  });

  // 4. Milestone Notification & Timeline Logic
  const eventDetails = {
    mode: update.mode,
    statusUpdate: update.statusUpdate,
    locationSource: update.locationSource,
    locationName: update.locationName,
    remarks: update.remarks,
  };

  await addTimelineEvent({
    assignmentId: assignment._id,
    requestId: assignment.request._id,
    action: 'TRACKING_UPDATED',
    actorUserId: userId,
    actorRole: 'finder',
    actorLabel: 'Finder',
    details: eventDetails,
  });

  // Notify Owner
  try {
    const isMajor = ['progress', 'manual_note'].includes(update.statusUpdate);
    const locDesc = update.locationName ? ` near ${update.locationName}` : "";
    
    await createNotification({
      userId: assignment.request.owner,
      type: 'tracking',
      title: isMajor ? 'Finder Milestone Update' : 'Finder Activity Ping',
      message: `The finder just posted a ${update.mode} update${locDesc}. Remarks: "${update.remarks || 'No remarks'}"`,
      data: { assignmentId: assignment._id, updateId: update._id },
    });
  } catch (err) {
    console.error('Tracking notification failed:', err.message);
  }

  return update;
};

/**
 * Get all tracking updates for an assignment (Timeline)
 */
const getTrackingTimeline = async (assignmentId, userId) => {
  const assignment = await FinderAssignment.findById(assignmentId).populate('request');
  if (!assignment) throw new Error('Assignment not found');

  // ACCESS CONTROL: Only assigned finder or request owner
  const isFinder = assignment.finder.toString() === userId.toString();
  const isOwner = assignment.request.owner.toString() === userId.toString();

  if (!isFinder && !isOwner) {
    throw new Error('Unauthorized to view this tracking timeline');
  }

  return TrackingUpdate.find({ assignmentId }).sort({ createdAt: -1 });
};

module.exports = {
  createUpdate,
  getTrackingTimeline,
};
