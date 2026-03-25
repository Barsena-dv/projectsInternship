const TrackingUpdate = require('./tracking.model');
const FinderAssignment = require('../assignments/assignment.model');
const { createNotification } = require('../notifications/notification.service');

/**
 * Finder sends a progress update for their assignment
 */
const createUpdate = async (updateData, userId) => {
  const { assignmentId, statusUpdate, currentLat, currentLng, remarks } = updateData;

  // 1. Validate assignment ownership and existence
  const assignment = await FinderAssignment.findById(assignmentId).populate('request');
  if (!assignment) {
    throw new Error('Assignment not found');
  }

  if (assignment.finder.toString() !== userId.toString()) {
    throw new Error('Only the assigned finder can post progress updates');
  }

  // 2. Lifecycle protection: Block updates if completed, cancelled, or disputed
  if (['completed', 'cancelled'].includes(assignment.status)) {
    throw new Error(`Cannot post updates to a ${assignment.status} assignment`);
  }

  if (assignment.isDisputed) {
    throw new Error('Progress updates are locked while an active dispute exists');
  }

  // 3. Create tracking update
  const update = await TrackingUpdate.create({
    assignmentId,
    finderId: userId,
    statusUpdate,
    currentLat: currentLat || 0,
    currentLng: currentLng || 0,
    remarks,
  });

  // 4. Milestone Notification Logic
  if (statusUpdate === 'item_found' || statusUpdate === 'search_failed') {
    try {
      const title = statusUpdate === 'item_found' ? 'Item Found! 🎉' : 'Search Update';
      const message = statusUpdate === 'item_found' 
        ? `Great news! The finder has reported that your item has been found. Check details in the timeline.`
        : `Management Update: The finder reported that the search was unsuccessful. Please check the remarks.`;
      
      await createNotification({
        userId: assignment.request.owner,
        type: 'assignment',
        title,
        message,
        data: { assignmentId: assignment._id, status: statusUpdate },
      });
    } catch (err) {
      console.error('Milestone notification failed:', err.message);
    }
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
