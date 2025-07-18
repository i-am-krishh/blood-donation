const express = require('express');
const router = express.Router();
const campController = require('../controllers/campController');
const { auth } = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// Public routes
router.get('/public', (req, res) => {
  // Add query parameter for public view
  req.query.status = 'approved';
  campController.getAllCamps(req, res);
});
router.get('/nearby', campController.getNearbyCamps);
router.get('/:id/public', campController.getCamp);

// Admin routes
router.get(
  '/admin/all',
  auth,
  checkRole('admin'),
  campController.getAllCamps
);

router.put(
  '/:id/status',
  auth,
  checkRole('admin'),
  campController.updateCampStatus
);

router.put(
  '/:id/assign-organizer',
  auth,
  checkRole('admin'),
  campController.assignOrganizer
);

router.get(
  '/:id/analytics',
  auth,
  checkRole(['admin', 'camp_organizer']),
  campController.getCampAnalytics
);

// Organizer routes
router.get(
  '/organizer',
  auth,
  checkRole('camp_organizer'),
  campController.getOrganizerCamps
);

router.post(
  '/',
  auth,
  checkRole(['camp_organizer', 'admin']),
  campController.createCamp
);

router.put(
  '/:id',
  auth,
  checkRole(['camp_organizer', 'admin']),
  campController.updateCamp
);

router.delete(
  '/:id',
  auth,
  checkRole(['camp_organizer', 'admin']),
  campController.deleteCamp
);

router.get(
  '/:id/registrations',
  auth,
  checkRole('camp_organizer'),
  campController.getCampDonors
);

router.put(
  '/:id/donors/:donorId/status',
  auth,
  checkRole('camp_organizer'),
  campController.updateDonorStatus
);

router.post(
  '/:id/notifications',
  auth,
  checkRole('camp_organizer'),
  campController.sendNotificationToDonors
);

router.get(
  '/:id/attendance-report',
  auth,
  checkRole(['camp_organizer', 'admin']),
  campController.generateAttendanceReport
);

router.get(
  '/:id/certificates-report',
  auth,
  checkRole(['camp_organizer', 'admin']),
  campController.generateCertificatesReport
);

// Donor routes
router.post(
  '/:id/register',
  auth,
  checkRole('donor'),
  campController.registerDonor
);

router.delete(
  '/:id/register',
  auth,
  checkRole('donor'),
  campController.cancelRegistration
);

router.post(
  '/:id/feedback',
  auth,
  checkRole('donor'),
  campController.submitFeedback
);

module.exports = router;