const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const donationVerificationController = require('../controllers/donationVerificationController');

// Start verification process
router.post(
  '/start/:donorId/:campId',
  [auth, checkRole(['camp_organizer', 'admin'])],
  donationVerificationController.startVerification
);

// Update medical checks
router.put(
  '/:verificationId/medical-checks',
  [auth, checkRole(['camp_organizer', 'admin'])],
  donationVerificationController.updateMedicalChecks
);

// Update health screening
router.put(
  '/:verificationId/health-screening',
  [auth, checkRole(['camp_organizer', 'admin'])],
  donationVerificationController.updateHealthScreening
);

// Record donation details
router.put(
  '/:verificationId/record-donation',
  [auth, checkRole(['camp_organizer', 'admin'])],
  donationVerificationController.recordDonation
);

// Complete donation
router.put(
  '/:verificationId/complete',
  [auth, checkRole(['camp_organizer', 'admin'])],
  donationVerificationController.completeDonation
);

// Get verification details
router.get(
  '/:verificationId',
  [auth, checkRole(['camp_organizer', 'admin'])],
  donationVerificationController.getVerification
);

module.exports = router; 