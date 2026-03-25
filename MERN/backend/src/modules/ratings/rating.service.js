const Rating = require('./rating.model');
const User = require('../users/user.model');
const FinderAssignment = require('../assignments/assignment.model');
const LostItemRequest = require('../requests/request.model');
const { createNotification } = require('../notifications/notification.service');

const createRating = async (ratingData, userId) => {
  const { assignmentId, ratingValue, reviewText } = ratingData;

  // 1. Verify assignment completion
  const assignment = await FinderAssignment.findById(assignmentId);
  if (!assignment) throw new Error('Assignment not found');

  if (assignment.status !== 'completed') {
    throw new Error('Rating can only be submitted for completed recovery tasks');
  }

  // 2. Verify authorship (Validation)
  const request = await LostItemRequest.findById(assignment.request);
  if (request.owner.toString() !== userId.toString()) {
    throw new Error('Unauthorized');
  }

  // 3. Prevent duplicate ratings per assignment
  const existing = await Rating.findOne({ assignment: assignmentId });
  if (existing) throw new Error('Rating already submitted for this assignment');

  // 4. Create rating record
  const newRating = await Rating.create({
    request: assignment.request,
    assignment: assignmentId,
    fromUser: userId,
    toUser: assignment.finder,
    ratingValue,
    reviewText,
  });

  // 5. Update finder's average rating atomically (Trust Layer 🔥)
  const finder = await User.findById(assignment.finder);
  if (finder) {
    const totalRating = finder.ratingAvg * finder.ratingCount;
    finder.ratingCount += 1;
    finder.ratingAvg = (totalRating + ratingValue) / finder.ratingCount;
    await finder.save();
  }

  // 6. Notify finder
  try {
    await createNotification({
      userId: assignment.finder,
      type: 'account',
      title: 'New Review Received',
      message: `The owner has rated your recovery task: ${ratingValue}/5 stars. "${reviewText || ''}"`,
      data: { ratingId: newRating._id },
    });
  } catch (err) {
    console.error('Notification failed:', err.message);
  }

  return newRating;
};

const getUserRatings = async (userId) => {
  return Rating.find({ toUser: userId })
    .populate('fromUser', 'full_name profileImage')
    .sort({ createdAt: -1 });
};

module.exports = {
  createRating,
  getUserRatings,
};
