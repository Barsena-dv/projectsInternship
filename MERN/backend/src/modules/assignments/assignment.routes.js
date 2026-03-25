const express = require('express');
const assignmentController = require('./assignment.controller');
const { verifyToken } = require('../../middleware/auth.middleware');

const router = express.Router();

/**
 * Finder Side: Accept and Manage Tasks
 */
router.post('/accept', verifyToken, assignmentController.acceptAssignment);
router.get('/my', verifyToken, assignmentController.getMyAssignments);
router.get('/my-applications', verifyToken, assignmentController.getMyApplications);

/**
 * Owner Side: Monitor Request Assignment
 */
router.get('/request/:requestId', verifyToken, assignmentController.getAssignmentByRequest);
router.get('/request/:requestId/applications', verifyToken, assignmentController.getRequestApplications);
router.post('/request/:requestId/applications/:applicationId/decision', verifyToken, assignmentController.decideApplication);
router.get('/request/:requestId/timeline', verifyToken, assignmentController.getRequestTimeline);
router.post('/request/:requestId/retry', verifyToken, assignmentController.retryExpiredAssignment);

/**
 * Owner Side: Confirm item received and complete assignment
 */
router.post('/:id/complete', verifyToken, assignmentController.completeAssignmentByOwner);
router.post('/:id/pause', verifyToken, assignmentController.pauseAssignment);
router.post('/:id/resume', verifyToken, assignmentController.resumeAssignment);

/**
 * General: Detail view (Protected access)
 */
router.get('/:id', verifyToken, assignmentController.getAssignmentById);
router.get('/:id/timeline', verifyToken, assignmentController.getAssignmentTimeline);

module.exports = router;
