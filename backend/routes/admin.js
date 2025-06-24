const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const User = require('../models/User');
const Camp = require('../models/Camp');
const Donation = require('../models/Donation');
const { check, validationResult } = require('express-validator');

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Admin
router.get('/users', [auth, isAdmin], async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/camps
// @desc    Get all camps with organizer details
// @access  Admin
router.get('/camps', [auth, isAdmin], async (req, res) => {
  try {
    const camps = await Camp.find()
      .populate({
        path: 'organizer',
        select: 'name email',
        options: { lean: true }
      })
      .sort({ date: 1, time: 1 })
      .lean();

    // Transform the data to ensure all required fields exist
    const transformedCamps = camps.map(camp => ({
      _id: camp._id,
      name: camp.name || '',
      venue: camp.venue || '',
      date: camp.date || '',
      time: camp.time || '',
      status: camp.status || 'pending',
      capacity: camp.capacity || 0,
      registeredDonors: camp.registeredDonors || [],
      organizer: camp.organizer || { name: 'Not assigned', email: 'N/A' },
      description: camp.description || '',
      requirements: camp.requirements || [],
      contactInfo: camp.contactInfo || { phone: 'N/A', email: 'N/A' },
      location: camp.location || { type: 'Point', coordinates: [0, 0] }
    }));

    res.json(transformedCamps);
  } catch (err) {
    console.error('Error fetching camps:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   GET /api/admin/organizers
// @desc    Get all camp organizers
// @access  Admin
router.get('/organizers', [auth, isAdmin], async (req, res) => {
  try {
    const organizers = await User.find({ role: 'camp_organizer' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(organizers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/admin/users/:id/status
// @desc    Update user status (approve/block)
// @access  Admin
router.patch('/users/:id/status', [auth, isAdmin], async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/admin/camps/:id/status
// @desc    Update camp status (approve/cancel)
// @access  Admin
router.patch('/camps/:id/status', [auth, isAdmin], async (req, res) => {
  try {
    const camp = await Camp.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    ).populate('organizer', 'name email');

    if (!camp) {
      return res.status(404).json({ message: 'Camp not found' });
    }

    res.json(camp);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/donations
// @desc    Get all donations with donor and camp details
// @access  Admin
router.get('/donations', [auth, isAdmin], async (req, res) => {
  try {
    const donations = await Donation.find()
      .populate('donorId', 'name email')
      .populate('campId', 'name venue')
      .sort({ createdAt: -1 });
    res.json(donations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get analytics data
// @access  Admin
router.get('/analytics', [auth, isAdmin], async (req, res) => {
  try {
    const { timeRange = 'month' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    switch (timeRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    // Get total counts and data
    const [
      totalDonors,
      totalOrganizers,
      donations,
      camps,
      users
    ] = await Promise.all([
      User.countDocuments({ role: 'donor' }),
      User.countDocuments({ role: 'camp_organizer' }),
      Donation.find({ 
        donationDate: { $gte: startDate },
        status: 'completed'
      })
      .populate({
        path: 'donor',
        select: 'name bloodType'
      })
      .populate({
        path: 'camp',
        select: 'name'
      })
      .sort({ donationDate: -1 })
      .lean(),
      Camp.find({ 
        date: { $gte: startDate }
      })
      .populate({
        path: 'organizer',
        select: 'name'
      })
      .sort({ date: -1 })
      .lean(),
      User.find({ 
        role: 'donor',
        isApproved: true 
      }, 'bloodType')
      .lean()
    ]);

    // Calculate blood type distribution
    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const bloodTypeDistribution = bloodTypes.map(type => ({
      type,
      count: users.filter(user => user.bloodType === type).length || 0
    }));

    // Calculate monthly donations
    const monthlyDonations = [];
    const months = timeRange === 'year' ? 12 : timeRange === 'month' ? 1 : 0;
    for (let i = months; i >= 0; i--) {
      const month = new Date();
      month.setMonth(now.getMonth() - i);
      const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      
      const count = donations.filter(d => {
        const donationDate = new Date(d.donationDate);
        return donationDate >= monthStart && donationDate <= monthEnd;
      }).length;

      monthlyDonations.push({ 
        month: month.toLocaleString('default', { month: 'short' }), 
        donations: count 
      });
    }

    // Calculate camp statistics
    const campStatuses = ['pending', 'approved', 'completed', 'cancelled'];
    const campStatistics = campStatuses.map(status => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count: camps.filter(camp => camp.status === status).length || 0
    }));

    // Get recent activity
    const recentDonations = donations.slice(0, 5).map(d => ({
      id: d._id.toString(),
      type: 'donation',
      description: `${d.donor?.name || 'Anonymous'} donated at ${d.camp?.name || 'Unknown Camp'}`,
      date: d.donationDate
    }));

    const recentCamps = camps.slice(0, 5).map(c => ({
      id: c._id.toString(),
      type: 'camp',
      description: `${c.name} organized by ${c.organizer?.name || 'Unknown Organizer'}`,
      date: c.date
    }));

    const recentActivity = [...recentDonations, ...recentCamps]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    res.json({
      totalDonors,
      totalOrganizers,
      totalDonations: donations.length,
      totalCamps: camps.length,
      bloodTypeDistribution,
      monthlyDonations,
      campStatistics,
      recentActivity
    });

  } catch (err) {
    console.error('Analytics Error:', err);
    res.status(500).json({ 
      message: 'Error fetching analytics data', 
      error: err.message 
    });
  }
});

// @route   DELETE /api/admin/camps/:id
// @desc    Delete a camp
// @access  Admin
router.delete('/camps/:id', [auth, isAdmin], async (req, res) => {
  try {
    const camp = await Camp.findById(req.params.id);
    
    if (!camp) {
      return res.status(404).json({ message: 'Camp not found' });
    }

    // Check if camp date has passed
    const campDateTime = new Date(`${camp.date} ${camp.time}`);
    if (campDateTime < new Date()) {
      return res.status(400).json({ message: 'Cannot delete past camps' });
    }

    // Using findByIdAndDelete instead of remove()
    await Camp.findByIdAndDelete(req.params.id);
    res.json({ message: 'Camp deleted successfully' });
  } catch (err) {
    console.error('Error deleting camp:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   PUT /api/admin/camps/:id
// @desc    Update a camp
// @access  Admin
router.put('/camps/:id', [
  auth, 
  isAdmin,
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

    // Check if camp date has passed
    const campDateTime = new Date(`${camp.date} ${camp.time}`);
    if (campDateTime < new Date()) {
      return res.status(400).json({ message: 'Cannot edit past camps' });
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
    if (latitude && longitude) {
      camp.location = {
        type: 'Point',
        coordinates: [longitude, latitude]
      };
    }

    await camp.save();
    res.json(camp);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 