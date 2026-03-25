const trackingService = require('./tracking.service');

const updateTracking = async (req, res) => {
  try {
    const userId = req.user.userId;
    const update = await trackingService.createUpdate(req.body, userId);

    res.status(201).json({
      success: true,
      message: 'Progress update saved and owner notified',
      data: update,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getTrackingByAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const userId = req.user.userId;
    const updates = await trackingService.getTrackingTimeline(assignmentId, userId);

    res.status(200).json({
      success: true,
      data: updates,
    });
  } catch (error) {
    res.status(403).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  updateTracking,
  getTrackingByAssignment,
};
