const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Camp = require('../models/Camp');
const Donation = require('../models/Donation');

// @route   GET /api/donor/registrations
// @desc    Get donor's camp registrations
// @access  Private (Donor only)
router.get('/registrations', auth, async (req, res) => {
  try {
    const camps = await Camp.find({
      'registeredDonors.donor': req.user.id
    }).populate('organizer', 'name');

    const registrations = camps.map(camp => ({
      id: camp._id,
      campId: camp._id,
      campName: camp.name,
      venue: camp.venue,
      date: camp.date,
      time: camp.time,
      organizer: camp.organizer.name,
      status: camp.date > new Date() ? 'upcoming' : 'completed'
    }));

    res.json({ registrations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/donor/nearby-camps
// @desc    Get nearby blood donation camps
// @access  Private (Donor only)
router.get('/nearby-camps', auth, async (req, res) => {
  try {
    const { latitude, longitude, radius = 10 } = req.query;

    let query = { status: 'approved' };

    // If coordinates are provided, find camps within radius
    if (latitude && longitude) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      };
    }

    const camps = await Camp.find(query)
      .populate('organizer', 'name')
      .sort({ date: 1 });

    res.json(camps);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/donor/register-camp/:campId
// @desc    Register for a blood donation camp
// @access  Private (Donor only)
router.post('/register-camp/:campId', auth, async (req, res) => {
  try {
    const camp = await Camp.findById(req.params.campId);

    if (!camp) {
      return res.status(404).json({ message: 'Camp not found' });
    }

    if (camp.status !== 'approved') {
      return res.status(400).json({ message: 'Cannot register for this camp' });
    }

    // Check if already registered
    const isAlreadyRegistered = camp.registeredDonors.some(
      registration => registration.donor.toString() === req.user.id
    );

    if (isAlreadyRegistered) {
      return res.status(400).json({ message: 'Already registered for this camp' });
    }

    // Check camp capacity
    if (camp.registeredDonors.length >= camp.capacity) {
      return res.status(400).json({ message: 'Camp is at full capacity' });
    }

    // Check if camp date has passed
    if (new Date(camp.date) < new Date()) {
      return res.status(400).json({ message: 'Cannot register for past camps' });
    }

    // Add new registration
    camp.registeredDonors.push({
      donor: req.user.id,
      registrationDate: new Date(),
      status: 'pending',
      donationStatus: 'not_donated'
    });

    await camp.save();

    res.json({ 
      message: 'Successfully registered for camp',
      registration: camp.registeredDonors[camp.registeredDonors.length - 1]
    });
  } catch (err) {
    console.error('Error in camp registration:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   DELETE /api/donor/cancel-registration/:campId
// @desc    Cancel registration for a blood donation camp
// @access  Private (Donor only)
router.delete('/cancel-registration/:campId', auth, async (req, res) => {
  try {
    const camp = await Camp.findById(req.params.campId);

    if (!camp) {
      return res.status(404).json({ message: 'Camp not found' });
    }

    const registrationIndex = camp.registeredDonors.findIndex(
      registration => registration.donor.toString() === req.user.id
    );

    if (registrationIndex === -1) {
      return res.status(400).json({ message: 'Not registered for this camp' });
    }

    // Check if camp date has passed
    if (new Date(camp.date) < new Date()) {
      return res.status(400).json({ message: 'Cannot cancel registration for past camps' });
    }

    camp.registeredDonors.splice(registrationIndex, 1);
    await camp.save();

    res.json({ message: 'Registration cancelled successfully' });
  } catch (err) {
    console.error('Error in cancelling registration:', err);
    res.status(500).json({ message: 'Server error during cancellation' });
  }
});

module.exports = router;