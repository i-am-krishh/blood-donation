const express = require('express');
const router = express.Router();
const { auth, isCampOrganizer } = require('../middleware/auth');
const Camp = require('../models/Camp');
const { check, validationResult } = require('express-validator');
const Donation = require('../models/Donation');
const DonorRegistration = require('../models/DonorRegistration');
const User = require('../models/User');
const campController = require('../controllers/campController');
const { checkRole } = require('../middleware/checkRole');

// @route   GET /api/camps
// @desc    Get all approved camps
// @access  Public
router.get('/', campController.getAllCamps);

// @route   GET /api/camps/nearby
// @desc    Get nearby camps
// @access  Public
router.get('/nearby', campController.getNearbyCamps);

// @route   GET /api/camps/organizer
// @desc    Get all camps for the logged-in organizer
// @access  Camp Organizer
router.get('/organizer', [auth, isCampOrganizer], async (req, res) => {
  try {
    const camps = await Camp.find({ organizer: req.user.id })
      .sort({ date: -1 });
    res.json(camps);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/camps
// @desc    Create a new camp
// @access  Camp Organizer
router.post('/', [
  auth,
  isCampOrganizer,
  [
    check('name', 'Camp name is required').not().isEmpty(),
    check('venue', 'Venue is required').not().isEmpty(),
    check('date', 'Date is required').not().isEmpty(),
    check('time', 'Time is required').not().isEmpty(),
    check('capacity', 'Capacity must be a positive number').isInt({ min: 1 }),
    check('description', 'Description is required').not().isEmpty(),
    check('requirements', 'Requirements must be an array').isArray(),
    check('contactPhone', 'Contact phone is required').not().isEmpty(),
    check('contactEmail', 'Please include a valid email').isEmail(),
  ]
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      venue,
      date,
      time,
      capacity,
      description,
      requirements,
      contactPhone,
      contactEmail,
      latitude,
      longitude
    } = req.body;

    const camp = new Camp({
      name,
      venue,
      date,
      time,
      capacity,
      description,
      requirements,
      contactInfo: {
        phone: contactPhone,
        email: contactEmail
      },
      location: {
        type: 'Point',
        coordinates: [longitude || 0, latitude || 0]
      },
      organizer: req.user.id,
      status: 'pending'
    });

    await camp.save();

    res.status(201).json(camp);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/camps/:id
// @desc    Get camp by ID
// @access  Public
router.get('/:id', campController.getCamp);

// @route   PUT /api/camps/:id
// @desc    Update a camp
// @access  Camp Organizer
router.put('/:id', [
  auth,
  isCampOrganizer,
  [
    check('name', 'Camp name is required').not().isEmpty(),
    check('venue', 'Venue is required').not().isEmpty(),
    check('date', 'Date is required').not().isEmpty(),
    check('time', 'Time is required').not().isEmpty(),
    check('capacity', 'Capacity must be a positive number').isInt({ min: 1 }),
    check('description', 'Description is required').not().isEmpty(),
    check('requirements', 'Requirements must be an array').isArray(),
    check('contactPhone', 'Contact phone is required').not().isEmpty(),
    check('contactEmail', 'Please include a valid email').isEmail(),
  ]
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const camp = await Camp.findById(req.params.id);

    if (!camp) {
      return res.status(404).json({ message: 'Camp not found' });
    }

    // Check if the user is the camp organizer
    if (camp.organizer.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const {
      name,
      venue,
      date,
      time,
      capacity,
      description,
      requirements,
      contactPhone,
      contactEmail,
      latitude,
      longitude
    } = req.body;

    camp.name = name;
    camp.venue = venue;
    camp.date = date;
    camp.time = time;
    camp.capacity = capacity;
    camp.description = description;
    camp.requirements = requirements;
    camp.contactInfo = {
      phone: contactPhone,
      email: contactEmail
    };
    camp.location = {
      type: 'Point',
      coordinates: [longitude || 0, latitude || 0]
    };

    await camp.save();

    res.json(camp);
  } catch (err) {
    console.error(err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Camp not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/camps/:id
// @desc    Delete a camp
// @access  Camp Organizer
router.delete('/:id', [auth, isCampOrganizer], async (req, res) => {
  try {
    const camp = await Camp.findById(req.params.id);

    if (!camp) {
      return res.status(404).json({ message: 'Camp not found' });
    }

    // Check if the user is the camp organizer
    if (camp.organizer.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await camp.remove();

    res.json({ message: 'Camp removed' });
  } catch (err) {
    console.error(err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Camp not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/camps/:campId/registrations
// @desc    Get registered users for a camp
// @access  Camp Organizer
router.get('/:campId/registrations', [auth, isCampOrganizer], async (req, res) => {
    try {
        const camp = await Camp.findById(req.params.campId)
            .populate('registeredDonors.donorId', 'name email phoneNumber bloodType');

        if (!camp) {
            return res.status(404).json({ message: 'Camp not found' });
        }

        // Check if the user is the camp organizer
        if (camp.organizer.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const registrations = camp.registeredDonors.map(reg => ({
            id: reg.donorId._id,
            name: reg.donorId.name,
            email: reg.donorId.email,
            phoneNumber: reg.donorId.phoneNumber,
            bloodType: reg.donorId.bloodType,
            registrationDate: reg.registrationDate,
            status: reg.status,
            donationStatus: reg.donationStatus
        }));

        res.json({ registrations });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/camps/:campId/donations
// @desc    Get donations for a camp
// @access  Camp Organizer
router.get('/:campId/donations', [auth, isCampOrganizer], async (req, res) => {
  try {
    const donations = await Donation.find({ campId: req.params.campId })
      .populate('userId', 'name bloodType');

    const formattedDonations = donations.map(donation => ({
      id: donation._id,
      userId: donation.userId._id,
      userName: donation.userId.name,
      bloodType: donation.userId.bloodType,
      units: donation.units,
      donationDate: donation.donationDate,
      status: donation.status,
      notes: donation.notes,
      hemoglobinLevel: donation.hemoglobinLevel,
      bloodPressure: donation.bloodPressure,
      weight: donation.weight
    }));

    res.json({ donations: formattedDonations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/camps/:campId/registrations/:userId/status
// @desc    Update registration status for a user
// @access  Camp Organizer
router.patch('/:campId/registrations/:userId/status', [auth, isCampOrganizer], async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!['confirmed', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const camp = await Camp.findById(req.params.campId);
        
        if (!camp) {
            return res.status(404).json({ message: 'Camp not found' });
        }

        // Check if the user is the camp organizer
        if (camp.organizer.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Find the registration for this user
        const registration = camp.registeredDonors.find(
            donor => donor.donorId.toString() === req.params.userId
        );

        if (!registration) {
            return res.status(404).json({ message: 'User not registered for this camp' });
        }

        if (status === 'cancelled') {
            // Remove the registration
            camp.registeredDonors = camp.registeredDonors.filter(
                donor => donor.donorId.toString() !== req.params.userId
            );
        } else {
            // Update the status to confirmed
            registration.status = status;
        }

        await camp.save();
        res.json({ message: 'Registration status updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PATCH /api/camps/:campId/registrations/:userId/verify
// @desc    Verify a donor's registration and record donation
// @access  Private (Camp Organizer only)
router.patch('/:campId/registrations/:userId/verify', auth, async (req, res) => {
  try {
    const camp = await Camp.findById(req.params.campId);
    if (!camp) {
      return res.status(404).json({ message: 'Camp not found' });
    }

    // Check if the user is the camp organizer
    if (camp.organizer.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Find the registration
    const registration = await DonorRegistration.findOne({
      campId: req.params.campId,
      donorId: req.params.userId
    });

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    // Update registration status
    registration.status = 'donated';
    registration.donationDate = new Date();
    
    // Set next eligible date to 90 days from donation
    const nextEligibleDate = new Date();
    nextEligibleDate.setDate(nextEligibleDate.getDate() + 90);
    registration.nextEligibleDate = nextEligibleDate;

    await registration.save();

    // Update camp registration status
    const donorIndex = camp.registeredDonors.findIndex(
      donor => donor.userId.toString() === req.params.userId
    );

    if (donorIndex !== -1) {
      camp.registeredDonors[donorIndex].status = 'donated';
      await camp.save();
    }

    res.json({ 
      message: 'Donation verified successfully',
      nextEligibleDate: nextEligibleDate
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/camps/:id/register
// @desc    Register for a camp
// @access  Private (Donors only)
router.post('/:id/register', auth, async (req, res) => {
  try {
    const camp = await Camp.findById(req.params.id);
    if (!camp) {
      return res.status(404).json({ message: 'Camp not found' });
    }

    // Check if camp is approved
    if (camp.status !== 'approved') {
      return res.status(400).json({ message: 'Cannot register for a camp that is not approved' });
    }

    // Check if camp is at capacity
    if (camp.isFull) {
      return res.status(400).json({ message: 'Camp is already at full capacity' });
    }

    // Check if user has already registered for this specific camp
    const hasRegistered = await DonorRegistration.hasRegisteredForCamp(req.user.id, camp._id);
    if (hasRegistered) {
      return res.status(400).json({ 
        message: 'You have already registered for this camp' 
      });
    }

    // Check if user is already registered for any other active camp
    const existingRegistration = await DonorRegistration.findOne({
      donorId: req.user.id,
      status: 'registered'
    });

    if (existingRegistration) {
      const existingCamp = await Camp.findById(existingRegistration.campId);
      return res.status(400).json({ 
        message: `You are already registered for ${existingCamp?.name || 'another camp'}. You can only register for one camp at a time.` 
      });
    }

    // Check if donor is eligible (90 days since last donation)
    const isEligible = await DonorRegistration.isEligibleForDonation(req.user.id);
    if (!isEligible) {
      const nextEligibleDate = await DonorRegistration.getNextEligibleDate(req.user.id);
      return res.status(400).json({ 
        message: `You are not eligible for donation yet. You can donate again after ${nextEligibleDate?.toLocaleDateString() || 'the cooling period'}` 
      });
    }

    // Create new registration
    const registration = new DonorRegistration({
      donorId: req.user.id,
      campId: camp._id
    });

    await registration.save();

    // Update camp's registered donors
    camp.registeredDonors.push({
      userId: req.user.id,
      status: 'registered',
      registrationDate: new Date()
    });

    await camp.save();

    // Get user details
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: `Successfully registered for ${camp.name}! Thank you for your commitment to donate blood.`,
      registration: {
        campName: camp.name,
        donorName: user.name,
        registrationDate: registration.registrationDate.toISOString(),
        campDate: camp.date.toISOString(),
        campTime: camp.time,
        campLocation: camp.location,
        status: registration.status
      }
    });
  } catch (err) {
    console.error('Error in POST /api/camps/:id/register:', err);
    if (err.code === 11000) { // Duplicate key error
      return res.status(400).json({ message: 'You have already registered for this camp' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Donor routes
router.post('/:id/register', auth, checkRole('donor'), campController.registerDonor);
router.delete('/:id/register', auth, checkRole('donor'), campController.cancelRegistration);

// Organizer routes
router.get('/organizer/camps', auth, checkRole('camp_organizer'), campController.getOrganizerCamps);
router.post('/', auth, checkRole('camp_organizer'), campController.createCamp);
router.put('/:id', auth, checkRole('camp_organizer'), campController.updateCamp);
router.delete('/:id', auth, checkRole('camp_organizer'), campController.deleteCamp);

// Donor management routes
router.get('/:id/donors', auth, checkRole('camp_organizer'), campController.getCampDonors);
router.patch('/:id/donors/:donorId', auth, checkRole('camp_organizer'), campController.updateDonorStatus);

module.exports = router;