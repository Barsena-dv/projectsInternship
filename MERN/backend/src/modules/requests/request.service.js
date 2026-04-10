const LostItemRequest = require('./request.model');
const ServicePlan = require('../servicePlans/servicePlan.model');
const FinderAssignment = require('../assignments/assignment.model');
const AssignmentApplication = require('../assignments/assignmentApplication.model');

const hasValue = (value) => String(value || '').trim().length > 0;

const toFiniteNumber = (value) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const validatePublishReady = async (request) => {
  const missing = [];

  if (!hasValue(request.itemName)) missing.push('itemName');
  if (!hasValue(request.itemCategory)) missing.push('itemCategory');
  if (!hasValue(request.itemDescription)) missing.push('itemDescription');
  if (!hasValue(request.lastSeenLocation)) missing.push('lastSeenLocation');
  if (!Number.isFinite(Number(request.lastSeenLat))) missing.push('lastSeenLat');
  if (!Number.isFinite(Number(request.lastSeenLng))) missing.push('lastSeenLng');
  if (!request.planId) missing.push('planId');

  if (missing.length) {
    throw new Error(`Cannot publish request. Missing fields: ${missing.join(', ')}`);
  }

  const servicePlan = await ServicePlan.findById(request.planId);
  if (!servicePlan) {
    throw new Error('Service plan not found');
  }

  return servicePlan;
};

/**
 * Create a new lost item request
 */
const createRequest = async (requestData, user) => {
  if (user.role === 'finder') {
    throw new Error('Only owners can create requests');
  }

  const {
    intent,
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

  const normalizedIntent = String(intent || 'publish').toLowerCase();
  const isDraft = normalizedIntent === 'draft';
  const normalizedLat = toFiniteNumber(lastSeenLat);
  const normalizedLng = toFiniteNumber(lastSeenLng);

  let servicePlan = null;
  if (planId) {
    servicePlan = await ServicePlan.findById(planId);
    if (!servicePlan && !isDraft) {
      throw new Error('Service plan not found');
    }
  }

  if (!isDraft) {
    if (!itemName || !itemCategory || !itemDescription || !lastSeenLocation || normalizedLat === null || normalizedLng === null || !planId) {
      throw new Error('Missing required fields');
    }

    if (!servicePlan) {
      throw new Error('Service plan not found');
    }
  }

  const expiryDate = servicePlan
    ? (() => {
      const nextExpiryDate = new Date();
      nextExpiryDate.setDate(nextExpiryDate.getDate() + (servicePlan.searchDuration || 30));
      return nextExpiryDate;
    })()
    : null;

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
    lastSeenLat: normalizedLat,
    lastSeenLng: normalizedLng,
    lastSeenDatetime,
    serviceDeadline,
    planId: planId || null,
    expiryDate,
    rewardAmount: Number(rewardAmount || servicePlan?.price || 0),
    requestStatus: isDraft ? 'draft' : 'pending_payment',
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

const publishRequest = async (requestId, userId) => {
  const request = await LostItemRequest.findById(requestId);
  if (!request) throw new Error('Request not found');

  if (request.owner.toString() !== userId.toString()) {
    throw new Error('Unauthorized publish attempt');
  }

  if (!['draft', 'pending_payment'].includes(String(request.requestStatus))) {
    throw new Error(`Request cannot be published from status: ${request.requestStatus}`);
  }

  const activeAssignment = await FinderAssignment.findOne({
    request: request._id,
    status: { $in: ['active', 'inactive', 'paused'] },
  });
  if (activeAssignment) {
    throw new Error('Cannot publish while an active assignment exists');
  }

  const servicePlan = await validatePublishReady(request);

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + (servicePlan.searchDuration || 30));

  request.requestStatus = 'pending_payment';
  request.expiryDate = expiryDate;
  if (!Number(request.rewardAmount || 0)) {
    request.rewardAmount = Number(servicePlan.price || 0);
  }
  await request.save();

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
  if (!['draft', 'pending_payment', 'open'].includes(request.requestStatus)) {
    throw new Error(`Cannot update request in current status: ${request.requestStatus}`);
  }

  const activeAssignment = await FinderAssignment.findOne({
    request: request._id,
    status: { $in: ['active', 'inactive', 'paused'] },
  });

  if (activeAssignment) {
    throw new Error('Cannot update request while an assignment is active');
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
  if (!['draft', 'pending_payment', 'open'].includes(request.requestStatus)) {
    throw new Error(`Cannot delete/cancel request after it has been assigned or processed`);
  }

  const activeAssignment = await FinderAssignment.findOne({
    request: request._id,
    status: { $in: ['active', 'inactive', 'paused'] },
  });
  if (activeAssignment) {
    throw new Error('Cannot delete request while an assignment is active');
  }

  request.requestStatus = 'cancelled';
  await request.save();
  
  // Optional: Actually delete if preferred, but cancellation is safer for logs
  // await request.deleteOne(); 
  
  return true;
};

module.exports = {
  createRequest,
  publishRequest,
  getMyRequests,
  getAvailableRequests,
  getRequestById,
  updateRequest,
  deleteRequest,
};
