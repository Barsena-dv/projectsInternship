const User = require('../users/user.model');
const LostItemRequest = require('../requests/request.model');
const FinderAssignment = require('../assignments/assignment.model');
const Dispute = require('../disputes/dispute.model');
const Payment = require('../payments/payment.model');
const { createNotification } = require('../notifications/notification.service');

const verifyFinder = async (userId, isApproved) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  user.isVerified = isApproved;
  await user.save();

  try {
    const statusMsg = isApproved ? 'approved' : 'rejected';
    await createNotification({
      userId: user._id,
      type: 'account',
      title: `Verification ${statusMsg}`,
      message: isApproved 
        ? 'Congratulations! Your finder identity is now verified. You can start accepting requests.' 
        : 'Your finder verification was not approved. Please review your documents and try again.',
    });
  } catch (err) {
    console.error(err);
  }

  return user;
};

const updateUserStatus = async (userId, status) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  user.status = status;
  await user.save();

  try {
    await createNotification({
      userId: user._id,
      type: 'account',
      title: 'Account Status Updated',
      message: `Your account status has been updated to: ${status.toUpperCase()}.`,
    });
  } catch (err) {
    console.error(err);
  }

  return user;
};

const getDashboardStats = async () => {
  const [
    totalUsers,
    totalRequests,
    activeAssignments,
    pendingDisputes,
    totalPayments,
  ] = await Promise.all([
    User.countDocuments(),
    LostItemRequest.countDocuments(),
    FinderAssignment.countDocuments({ status: 'active' }),
    Dispute.countDocuments({ status: 'open' }),
    Payment.aggregate([
      { $match: { paymentStatus: 'released' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  return {
    totalUsers,
    totalRequests,
    activeAssignments,
    pendingDisputes,
    totalEarnings: totalPayments[0]?.total || 0,
  };
};

const getAllDisputes = async (status) => {
  const query = {};
  if (status) query.status = status;
  return Dispute.find(query)
    .populate('assignment')
    .populate('raisedBy', 'full_name email')
    .sort({ createdAt: -1 });
};

module.exports = {
  verifyFinder,
  updateUserStatus,
  getDashboardStats,
  getAllDisputes,
};
