const requestService = require('./request.service');

const createRequest = async (req, res) => {
  try {
    const request = await requestService.createRequest(req.body, req.user);
    res.status(201).json({
      success: true,
      message: 'Request created successfully. Please complete payment.',
      data: request,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const publishRequest = async (req, res) => {
  try {
    const request = await requestService.publishRequest(req.params.id, req.user.userId);
    res.status(200).json({
      success: true,
      message: 'Request moved to pending payment successfully',
      data: request,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getMyRequests = async (req, res) => {
  try {
    const requests = await requestService.getMyRequests(req.user.userId);
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAvailableRequests = async (req, res) => {
  try {
    const requests = await requestService.getAvailableRequests(req.user?.userId || null);
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getRequestById = async (req, res) => {
  try {
    const request = await requestService.getRequestById(req.params.id);
    res.status(200).json({ success: true, data: request });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

const updateRequest = async (req, res) => {
  try {
    const request = await requestService.updateRequest(req.params.id, req.body, req.user.userId);
    res.status(200).json({
      success: true,
      message: 'Request updated successfully',
      data: request,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteRequest = async (req, res) => {
  try {
    await requestService.deleteRequest(req.params.id, req.user.userId);
    res.status(200).json({
      success: true,
      message: 'Request cancelled successfully',
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
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
