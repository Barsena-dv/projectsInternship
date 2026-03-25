const evidenceService = require('./evidence.service');
const { Readable } = require('stream');
const { uploadToCloudinary } = require('../../config/cloudinary');

const getFileTypeFromMime = (mimeType = '') => {
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('image/')) return 'image';
  return 'document';
};

const buildCloudinaryFallbackUrl = (cloudinaryId, fileType) => {
  if (!cloudinaryId || !process.env.CLOUDINARY_CLOUD_NAME) return '';
  const resourceType = fileType === 'video' ? 'video' : 'image';
  return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload/${cloudinaryId}`;
};

const normalizeFiles = (files = []) => {
  return files.map((file) => {
    const plain = typeof file?.toObject === 'function' ? file.toObject() : file;
    const fileType = String(plain?.fileType || '').toLowerCase();
    const url =
      plain?.url ||
      plain?.secure_url ||
      plain?.fileUrl ||
      plain?.path ||
      buildCloudinaryFallbackUrl(plain?.cloudinaryId, fileType);

    return {
      ...plain,
      url: url || '',
    };
  });
};

const uploadEvidence = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { description, lat, lng } = req.body;
    const userId = req.user.userId;

    if (!req.files || req.files.length === 0) {
      throw new Error('At least one proof file (image/video) is required');
    }

    const files = await Promise.all(
      req.files.map(async (file) => {
        const uploaded = await uploadToCloudinary(
          Readable.from(file.buffer),
          'evidence-files'
        );

        return {
          url: uploaded.secure_url,
          cloudinaryId: uploaded.public_id,
          fileType: getFileTypeFromMime(file.mimetype),
        };
      })
    );

    const evidence = await evidenceService.uploadEvidence(
      assignmentId,
      userId,
      files,
      description,
      lat,
      lng
    );

    res.status(201).json({
      success: true,
      message: 'Evidence submitted for verification',
      data: evidence,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getEvidence = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const userId = req.user.userId;

    const evidence = await evidenceService.getEvidenceByAssignment(assignmentId, userId);

    if (!evidence) {
      return res.status(404).json({
        success: false,
        message: 'No evidence found for this assignment',
      });
    }

    const evidenceData = evidence.toObject();
    evidenceData.files = normalizeFiles(evidenceData.files);

    res.status(200).json({ success: true, data: evidenceData });
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
};

const verifyEvidence = async (req, res) => {
  try {
    const { evidenceId } = req.params;
    const { verified, notes } = req.body;
    const userId = req.user.userId;

    const result = await evidenceService.verifyEvidence(
      evidenceId,
      verified,
      notes,
      userId
    );

    res.status(200).json({
      success: true,
      message: verified ? 'Evidence verified successfully' : 'Evidence rejected',
      data: result,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  uploadEvidence,
  getEvidence,
  verifyEvidence,
};
