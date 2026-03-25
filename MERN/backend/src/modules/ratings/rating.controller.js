const ratingService = require('./rating.service');

const createRating = async (req, res) => {
  try {
    const fromUserId = req.user.userId;
    const rating = await ratingService.createRating(req.body, fromUserId);
    res.status(201).json({
      success: true,
      message: 'Rating submitted successfully',
      data: rating,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getUserRatings = async (req, res) => {
  try {
    const { userId } = req.params;
    const ratings = await ratingService.getUserRatings(userId);
    res.status(200).json({
      success: true,
      data: ratings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createRating,
  getUserRatings,
};
