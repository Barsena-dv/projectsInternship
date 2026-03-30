const LostItemRequest = require('./request.model');
const ServicePlan = require('../servicePlans/servicePlan.model');
const FinderAssignment = require('../assignments/assignment.model');
const AssignmentApplication = require('../assignments/assignmentApplication.model');

/**
 * Create a new lost item request
 */
const createRequest = async (requestData, user) => {
  if (user.role === 'finder') {
    throw new Error('Only owners can create requests');
  }

  const {
    itemName,
    itemCategory,
    itemDescription,
    brand,
    model,
    color,
    uniqueIdentifiers,
    serialNumber,
    lastSeenLocation,
    lastSeenLat,
    lastSeenLng,
    lastSeenDatetime,
    serviceDeadline,
    planId,
    rewardAmount,
  } = requestData;

  if (!itemName || !itemCategory || !itemDescription || !lastSeenLat || !lastSeenLng || !planId) {
    throw new Error('Missing required fields');
  }

  const servicePlan = await ServicePlan.findById(planId);
  if (!servicePlan) {
    throw new Error('Service plan not found');
  }

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + (servicePlan.searchDuration || 30));

  const request = await LostItemRequest.create({
    owner: user.userId,
    itemName,
    itemCategory,
    itemDescription,
    brand,
    model,
    color,
    uniqueIdentifiers,
    serialNumber,
    lastSeenLocation,
    lastSeenLat,
    lastSeenLng,
    lastSeenDatetime,
    serviceDeadline,
    planId,
    expiryDate,
    rewardAmount: rewardAmount || servicePlan.price || 0,
    requestStatus: 'pending_payment',
  });

  // Audit Log
  const { logAction } = require('../auditLogs/auditLog.service');
  logAction({
    userId: user.userId,
    action: 'REQUEST_CREATE',
    entityType: 'LostItemRequest',
    entityId: request._id,
    details: { itemName: request.itemName, planId: request.planId },
  });

  return request.populate('planId');
};

/**
 * Get owner's own requests
 */
const getMyRequests = async (ownerId) => {
  return LostItemRequest.find({ owner: ownerId })
    .populate('planId')
    .sort({ createdAt: -1 });
};

/**
 * Get all available requests for finders (status: open)
 * Masking sensitive fields for public discovery
 */
const getAvailableRequests = async (finderUserId = null) => {
  const lockedRequestIds = await FinderAssignment.distinct('request', {
    status: { $in: ['active', 'inactive', 'paused'] },
  });

  let excludedIds = [...lockedRequestIds];

  if (finderUserId) {
    const appliedIds = await AssignmentApplication.distinct('request', {
      finder: finderUserId,
      status: { $in: ['pending', 'accepted'] },
    });

    excludedIds = [...new Set([...excludedIds, ...appliedIds])];
  }

  return LostItemRequest.find({
    requestStatus: 'open',
    _id: { $nin: excludedIds },
  })
    .select('-finders') // Do not expose finder IDs
    .populate('owner', 'full_name profileImage ratingAvg')
    .populate('planId', 'planName rewardAmount searchDuration')
    .sort({ createdAt: -1 });
};

/**
 * Get request by ID
 */
const getRequestById = async (requestId) => {
  const request = await LostItemRequest.findById(requestId)
    .populate('owner', 'full_name phone email profileImage ratingAvg ratingCount')
    .populate('planId')
    .populate('finders', 'full_name profileImage ratingAvg');

  if (!request) {
    throw new Error('Request not found');
  }

  return request;
};

/**
 * Update request details (Before assignment only)
 */
const updateRequest = async (requestId, updateData, userId) => {
  const request = await LostItemRequest.findById(requestId);
  if (!request) throw new Error('Request not found');

  // Verify ownership
  if (request.owner.toString() !== userId.toString()) {
    throw new Error('Unauthorized update attempt');
  }

  // Verify lifecycle status
  if (!['pending_payment', 'open'].includes(request.requestStatus)) {
    throw new Error(`Cannot update request in current status: ${request.requestStatus}`);
  }

  // Prevent restricted field updates
  const forbiddenFields = ['owner', 'requestStatus', 'planId', 'itemConfirmed'];
  forbiddenFields.forEach(field => delete updateData[field]);

  Object.assign(request, updateData);
  await request.save();
  return request;
};

/**
 * Cancel/Delete request (Before assignment only)
 */
const deleteRequest = async (requestId, userId) => {
  const request = await LostItemRequest.findById(requestId);
  if (!request) throw new Error('Request not found');

  // Verify ownership
  if (request.owner.toString() !== userId.toString()) {
    throw new Error('Unauthorized deletion attempt');
  }

  // Verify lifecycle status
  if (!['pending_payment', 'open'].includes(request.requestStatus)) {
    throw new Error(`Cannot delete/cancel request after it has been assigned or processed`);
  }

  request.requestStatus = 'cancelled';
  await request.save();
  
  // Optional: Actually delete if preferred, but cancellation is safer for logs
  // await request.deleteOne(); 
  
  return true;
};

module.exports = {
  createRequest,
  getMyRequests,
  getAvailableRequests,
  getRequestById,
  updateRequest,
  deleteRequest,
};
