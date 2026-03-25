const express = require('express');
const evidenceController = require('./evidence.controller');
const { verifyToken } = require('../../middleware/auth.middleware');
const { checkRole } = require('../../middleware/role.middleware');
const { uploadMultiple } = require('../../middleware/upload.middleware');

const router = express.Router();

router.post(
  '/:assignmentId/upload',
  verifyToken,
  checkRole('finder', 'both'),
  uploadMultiple,
  evidenceController.uploadEvidence
);

router.get('/:assignmentId', verifyToken, evidenceController.getEvidence);

router.post(
  '/:evidenceId/verify',
  verifyToken,
  checkRole('owner', 'both'),
  evidenceController.verifyEvidence
);

module.exports = router;
