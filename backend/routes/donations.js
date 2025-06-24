const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Donation = require('../models/Donation');
const Certificate = require('../models/Certificate');

// @route   GET /api/donations/my-donations
// @desc    Get user's donation history
// @access  Private
router.get('/my-donations', auth, async (req, res) => {
  try {
    const donations = await Donation.find({ donor: req.user.id })
      .populate({
        path: 'camp',
        select: 'name location'
      })
      .sort({ donationDate: -1 }); // Sort by date descending

    // Get certificates for these donations
    const certificates = await Certificate.find({
      donation: { $in: donations.map(d => d._id) }
    });

    // Map certificates to donations
    const donationsWithCertificates = donations.map(donation => {
      const certificate = certificates.find(c => c.donation.toString() === donation._id.toString());
      return {
        _id: donation._id,
        date: donation.donationDate,
        camp: {
          name: donation.camp.name,
          location: donation.camp.location
        },
        bloodType: donation.bloodType,
        units: donation.quantity,
        status: donation.status,
        certificate: certificate ? {
          _id: certificate._id,
          url: `/api/certificates/${certificate._id}/download`
        } : null
      };
    });

    res.json(donationsWithCertificates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/donations/stats
// @desc    Get user's donation statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const totalDonations = await Donation.countDocuments({ 
      donor: req.user.id,
      status: 'completed'
    });
    
    const lastDonation = await Donation.findOne({ 
      donor: req.user.id,
      status: 'completed'
    })
      .sort({ donationDate: -1 })
      .select('donationDate');

    // Get total units donated
    const totalUnits = await Donation.aggregate([
      {
        $match: {
          donor: req.user.id,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$quantity' }
        }
      }
    ]);

    // Get certificates count
    const certificatesCount = await Certificate.countDocuments({
      donor: req.user.id
    });

    res.json({
      totalDonations,
      lastDonation: lastDonation ? lastDonation.donationDate : null,
      totalUnits: totalUnits.length > 0 ? totalUnits[0].total : 0,
      certificatesCount
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/donations/:donationId/verify
// @desc    Verify a donation and generate certificate
// @access  Private (Camp Organizer)
router.patch('/:donationId/verify', auth, async (req, res) => {
  try {
    const { status, notes, hemoglobinLevel, bloodPressure, weight, units } = req.body;

    const donation = await Donation.findById(req.params.donationId)
      .populate('camp')
      .populate('donor');

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    // Update donation status and details
    donation.status = status === 'verified' ? 'completed' : 'cancelled';
    donation.notes = notes;
    donation.quantity = units;

    await donation.save();

    // If verified, generate certificate
    if (status === 'verified') {
      // Generate verification code
      const verificationCode = Math.random().toString(36).substring(2, 15) + 
                              Math.random().toString(36).substring(2, 15);

      // Create certificate
      const certificate = new Certificate({
        donation: donation._id,
        donor: donation.donor._id,
        camp: donation.camp._id,
        verificationCode,
        imageUrl: '/certificates/template.png', // You'll need to create this template
        metadata: {
          bloodType: donation.bloodType,
          units: donation.quantity,
          donationDate: donation.donationDate,
          campName: donation.camp.name,
          donorName: donation.donor.name
        }
      });

      await certificate.save();
      donation.certificateIssued = true;
      await donation.save();
    }

    res.json({ message: 'Donation verification completed', status: donation.status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;