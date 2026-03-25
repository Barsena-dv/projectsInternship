const EvidenceFile = require('./evidence.model');
const FinderAssignment = require('../assignments/assignment.model');
const User = require('../users/user.model');
const LostItemRequest = require('../requests/request.model');
const { createNotification } = require('../notifications/notification.service');

/**
 * Finder uploads proof of recovery
 */
const uploadEvidence = async (assignmentId, userId, files, description, lat, lng) => {
  // 1. Validate assignment
  const assignment = await FinderAssignment.findById(assignmentId);
  if (!assignment) throw new Error('Assignment not found');

  if (assignment.status !== 'active') {
    throw new Error(`Cannot upload evidence for a ${assignment.status} assignment`);
  }

  if (assignment.isDisputed) {
    throw new Error('Evidence uploads are locked while an active dispute exists');
  }

  // 2. Validate finder ownership
  if (assignment.finder.toString() !== userId.toString()) {
    throw new Error('Only the assigned finder can upload evidence');
  }

  // 3. Handle restricted upload (One pending/verified at a time)
  const existing = await EvidenceFile.findOne({ assignment: assignmentId });
  if (existing) {
    if (existing.verificationStatus === 'pending') {
      throw new Error('Verification is already pending for previously submitted evidence');
    }
    if (existing.verificationStatus === 'verified') {
      throw new Error('Evidence has already been verified for this assignment');
    }
    // If rejected, we allow re-upload by removing the old one or updating it
    if (existing.verificationStatus === 'rejected') {
      await EvidenceFile.findByIdAndDelete(existing._id);
    }
  }

  // 4. Create evidence record
  const evidence = await EvidenceFile.create({
    assignment: assignmentId,
    finder: userId,
    files,
    description,
    lat: lat || 0,
    lng: lng || 0,
    verificationStatus: 'pending',
  });

  // Audit Log
  const { logAction } = require('../auditLogs/auditLog.service');
  logAction({
    userId: userId,
    action: 'EVIDENCE_UPLOAD',
    entityType: 'EvidenceFile',
    entityId: evidence._id,
    details: { assignmentId },
  });

  // 5. Update assignment state
  assignment.evidenceSubmitted = true;
  await assignment.save();

  // 6. Notify owner
  try {
    const request = await LostItemRequest.findById(assignment.request);
    await createNotification({
      userId: request.owner,
      type: 'evidence',
      title: 'Evidence Uploaded',
      message: `The finder has uploaded proof for your item: "${request.itemName}". Please verify it.`,
      data: { assignmentId: assignment._id, evidenceId: evidence._id },
    });
  } catch (err) {
    console.error('Notification failed:', err.message);
  }

  return evidence;
};

/**
 * Get evidence for an assignment (Authorized access)
 */
const getEvidenceByAssignment = async (assignmentId, userId) => {
  const assignment = await FinderAssignment.findById(assignmentId).populate('request');
  if (!assignment) throw new Error('Assignment not found');

  // ACCESS CONTROL: Finder or Owner
  const isFinder = assignment.finder.toString() === userId.toString();
  const isOwner = assignment.request.owner.toString() === userId.toString();

  if (!isFinder && !isOwner) {
    throw new Error('Unauthorized to view this evidence');
  }

  return EvidenceFile.findOne({ assignment: assignmentId }).populate('finder', 'full_name profileImage');
};

/**
 * Owner verifies or rejects the proof
 */
const verifyEvidence = async (evidenceId, verified, notes, userId) => {
  const evidence = await EvidenceFile.findById(evidenceId);
  if (!evidence) throw new Error('Evidence not found');

  if (evidence.verificationStatus === 'verified') {
    throw new Error('This evidence has already been verified');
  }

  const assignment = await FinderAssignment.findById(evidence.assignment).populate('request');
  if (!assignment) throw new Error('Assignment not found');

  // Verify ownership
  if (assignment.request.owner.toString() !== userId.toString()) {
    throw new Error('Only the request owner can verify evidence');
  }

  // Update logic
  evidence.verificationStatus = verified ? 'verified' : 'rejected';
  evidence.verificationNotes = notes;
  evidence.verificationDate = new Date();
  evidence.verifiedBy = userId;
  await evidence.save();

  // Audit Log
  const { logAction } = require('../auditLogs/auditLog.service');
  logAction({
    userId: userId,
    action: verified ? 'EVIDENCE_VERIFY' : 'EVIDENCE_REJECT',
    entityType: 'EvidenceFile',
    entityId: evidence._id,
    details: { assignmentId: assignment._id, notes },
  });

  if (verified) {
    assignment.evidenceVerified = true;
    assignment.chatUnlocked = true;
    assignment.unlockTime = new Date();
  } else {
    // If rejected, reset submitted flag to allow re-upload
    assignment.evidenceSubmitted = false;
  }
  await assignment.save();

  // Notify finder
  try {
    await createNotification({
      userId: assignment.finder,
      type: 'evidence',
      title: verified ? 'Proof Verified' : 'Proof Rejected',
      message: verified 
        ? `Great news! The owner has verified your proof for "${assignment.request.itemName}". Chat is now unlocked.`
        : `Management Update: The owner has rejected your evidence for "${assignment.request.itemName}". Notes: ${notes || 'No notes provided. Please re-upload.'}`,
      data: { assignmentId: assignment._id, status: evidence.verificationStatus },
    });
  } catch (err) {
    console.error('Notification failed:', err.message);
  }

  return evidence;
};

module.exports = {
  uploadEvidence,
  getEvidenceByAssignment,
  verifyEvidence,
};
