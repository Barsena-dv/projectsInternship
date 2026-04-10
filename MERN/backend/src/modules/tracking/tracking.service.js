const TrackingUpdate = require('./tracking.model');
const FinderAssignment = require('../assignments/assignment.model');
const { createNotification } = require('../notifications/notification.service');
const { addTimelineEvent } = require('../assignments/assignmentTimeline.service');
const User = require('../users/user.model');

const toRad = (value) => (Number(value) * Math.PI) / 180;

const calculateDistanceKm = (from, to) => {
  const lat1 = Number(from?.lat);
  const lng1 = Number(from?.lng);
  const lat2 = Number(to?.lat);
  const lng2 = Number(to?.lng);
  if (![lat1, lng1, lat2, lng2].every(Number.isFinite)) return null;

  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

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

  // 2. Lifecycle protection: Block updates on terminal assignment states.
  if (['completed', 'cancelled', 'expired', 'failed'].includes(assignment.status)) {
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
  assignment.trackingMissedCount = 0;
  assignment.trackingWarningCount = 0;
  assignment.lastTrackingWarningAt = null;
  await assignment.save();

  const latValue = Number.isFinite(Number(currentLat)) ? Number(currentLat) : null;
  const lngValue = Number.isFinite(Number(currentLng)) ? Number(currentLng) : null;

  const previousTracking = await TrackingUpdate.findOne({ assignmentId }).sort({ createdAt: -1 });
  let anomalyFlag = false;
  let anomalyReason = '';
  let speedKmph = 0;
  if (
    previousTracking
    && latValue !== null
    && lngValue !== null
    && Number.isFinite(Number(previousTracking.currentLat))
    && Number.isFinite(Number(previousTracking.currentLng))
  ) {
    const distanceKm = calculateDistanceKm(
      { lat: previousTracking.currentLat, lng: previousTracking.currentLng },
      { lat: latValue, lng: lngValue }
    );
    const elapsedHours = Math.max((Date.now() - new Date(previousTracking.createdAt).getTime()) / (1000 * 60 * 60), 0.0001);
    speedKmph = Number(((distanceKm || 0) / elapsedHours).toFixed(2));

    const elapsedMinutes = elapsedHours * 60;
    if ((distanceKm !== null && distanceKm >= 8 && elapsedMinutes <= 10) || speedKmph > 120) {
      anomalyFlag = true;
      anomalyReason = `Anomalous location jump detected (distance=${(distanceKm || 0).toFixed(2)}km, speed=${speedKmph}km/h)`;
    }
  }

  // 3. Create tracking update
  const update = await TrackingUpdate.create({
    assignmentId,
    finderId: userId,
    statusUpdate: statusUpdate || 'progress',
    mode: mode || 'manual',
    locationSource: locationSource || 'none',
    locationName: locationName || '',
    currentLat: latValue,
    currentLng: lngValue,
    remarks: remarks || '',
    anomalyFlag,
    anomalyReason,
    speedKmph,
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

  if (anomalyFlag) {
    await addTimelineEvent({
      assignmentId: assignment._id,
      requestId: assignment.request._id,
      action: 'TRACKING_SPOOFING_ALERT',
      actorUserId: userId,
      actorRole: 'finder',
      actorLabel: 'Finder',
      details: { anomalyReason, speedKmph },
    });

    try {
      await createNotification({
        userId: assignment.request.owner,
        type: 'tracking',
        title: 'Suspicious Tracking Activity',
        message: `Potential location spoofing signal detected for this assignment. Review tracking timeline before verification.`,
        data: { assignmentId: assignment._id, updateId: update._id },
      });

      const admins = await User.find({ role: 'admin', accountStatus: 'active' }).select('_id');
      await Promise.all(
        admins.map((admin) => createNotification({
          userId: admin._id,
          type: 'tracking',
          title: 'Finder Spoofing Alert',
          message: `Anomalous movement detected in assignment ${assignment._id}.`,
          data: { assignmentId: assignment._id, updateId: update._id },
        }))
      );
    } catch (err) {
      console.error('Spoofing notification failed:', err.message);
    }
  }

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
  const assignmentService = require('../assignments/assignment.service');
  await assignmentService.syncAssignmentStatus(assignmentId);

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
