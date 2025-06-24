const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Certificate = require('../models/Certificate');

// @route   GET /api/certificates/my-certificates
// @desc    Get user's certificates
// @access  Private
router.get('/my-certificates', auth, async (req, res) => {
  try {
    const certificates = await Certificate.find({ user: req.user.id })
      .sort({ issueDate: -1 }); // Sort by issue date descending
    res.json(certificates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/certificates/:id/download
// @desc    Download a certificate
// @access  Private
router.get('/:id/download', auth, async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    // Here you would generate/fetch the certificate file
    // For now, we'll just send the certificate data
    res.json(certificate);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 