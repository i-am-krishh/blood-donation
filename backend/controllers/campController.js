const Camp = require('../models/Camp');
const User = require('../models/User');
const Notification = require('../models/Notification'); // Added Notification model
const { validateCoordinates } = require('../utils/validation');

// Admin: Get all camps with advanced filtering
exports.getAllCamps = async (req, res) => {
  try {
    const { status, search, startDate } = req.query;
    
    // Build query
    let query = {};
    
    // Add status filter if provided
    if (status && status !== 'all') {
      query.status = status;
    }

    // Add date filter if provided
    if (startDate) {
      query.date = { $gte: new Date(startDate) };
    }

    // Add search filter if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { venue: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const camps = await Camp.find(query)
      .populate('organizer', 'name email')
      .lean()
      .exec();

    // Calculate analytics for each camp
    const campsWithAnalytics = camps.map(camp => {
      const totalRegistrations = camp.registeredDonors?.length || 0;
      const actualDonorsCount = camp.actualDonors?.length || 0;
      const registrationRate = camp.capacity > 0 ? (totalRegistrations / camp.capacity) * 100 : 0;
      const donationRate = totalRegistrations > 0 ? (actualDonorsCount / totalRegistrations) * 100 : 0;

      return {
        ...camp,
        analytics: {
          totalRegistrations,
          actualDonors: actualDonorsCount,
          registrationRate,
          donationRate
        }
      };
    });

    res.json(campsWithAnalytics);
  } catch (error) {
    console.error('Error in getAllCamps:', error);
    res.status(500).json({ 
      message: 'Error fetching camps', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Admin: Approve or reject camp
exports.updateCampStatus = async (req, res) => {
  try {
    const { campId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending', 'approved', 'cancelled', 'ongoing', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const camp = await Camp.findById(campId);
    if (!camp) {
      return res.status(404).json({ message: 'Camp not found' });
    }

    // Check if status transition is valid
    const validTransitions = {
      pending: ['approved', 'cancelled'],
      approved: ['ongoing', 'cancelled'],
      ongoing: ['completed', 'cancelled'],
      completed: [], // No transitions allowed from completed
      cancelled: [] // No transitions allowed from cancelled
    };

    if (!validTransitions[camp.status].includes(status)) {
      return res.status(400).json({
        message: `Cannot transition from ${camp.status} to ${status}`
      });
    }

    // Update status
    camp.status = status;
    await camp.save();

    // If camp is approved, send notifications to registered donors
    if (status === 'approved') {
      const notifications = camp.registeredDonors.map(donorId => ({
        recipient: donorId,
        type: 'camp_approved',
        message: `The blood donation camp "${camp.name}" has been approved and will be held on ${new Date(camp.date).toLocaleDateString()}`,
        relatedCamp: camp._id
      }));

      await Notification.insertMany(notifications);
    }

    res.json({ message: 'Camp status updated successfully', camp });
  } catch (error) {
    console.error('Error in updateCampStatus:', error);
    res.status(500).json({ message: 'Error updating camp status', error: error.message });
  }
};

// Admin: Assign organizer to camp
exports.assignOrganizer = async (req, res) => {
  try {
    const { organizerId } = req.body;
    const camp = await Camp.findById(req.params.id);

    if (!camp) {
      return res.status(404).json({ message: 'Camp not found' });
    }

    const organizer = await User.findById(organizerId);
    if (!organizer || organizer.role !== 'camp_organizer') {
      return res.status(400).json({ message: 'Invalid organizer' });
    }

    camp.organizer = organizerId;
    await camp.save();
    res.json(camp);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Admin & Organizer: Get camp analytics
exports.getCampAnalytics = async (req, res) => {
  try {
    const camp = await Camp.findById(req.params.id)
      .populate('registeredDonors.donor', 'bloodType');

    if (!camp) {
      return res.status(404).json({ message: 'Camp not found' });
    }

    // Check authorization
    if (!req.user.isAdmin && camp.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const analytics = {
      ...camp.analytics,
      bloodTypeDistribution: camp.registeredDonors.reduce((acc, reg) => {
        const bloodType = reg.donor.bloodType;
        acc[bloodType] = (acc[bloodType] || 0) + 1;
        return acc;
      }, {}),
      registrationTimeline: camp.registeredDonors.reduce((acc, reg) => {
        const date = reg.registrationDate.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {}),
      feedback: {
        averageRating: camp.analytics.averageRating,
        comments: camp.registeredDonors
          .filter(reg => reg.feedback && reg.feedback.comment)
          .map(reg => ({
            rating: reg.feedback.rating,
            comment: reg.feedback.comment,
            date: reg.feedback.submittedAt
          }))
      }
    };

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Organizer: Send notification to donors
exports.sendNotificationToDonors = async (req, res) => {
  try {
    const { type, message, sendTo } = req.body;
    const camp = await Camp.findById(req.params.id);

    if (!camp) {
      return res.status(404).json({ message: 'Camp not found' });
    }

    if (camp.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const notification = await camp.sendNotification(type, message, sendTo);
    res.json(notification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Organizer: Generate attendance report
exports.generateAttendanceReport = async (req, res) => {
  try {
    const camp = await Camp.findById(req.params.id)
      .populate('registeredDonors.donor', 'name email bloodType phoneNumber');

    if (!camp) {
      return res.status(404).json({ message: 'Camp not found' });
    }

    if (camp.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const report = {
      campName: camp.name,
      date: camp.date,
      venue: camp.venue,
      totalRegistered: camp.registeredDonors.length,
      totalAttended: camp.registeredDonors.filter(r => r.status === 'attended').length,
      totalDonated: camp.registeredDonors.filter(r => r.donationStatus === 'donated').length,
      donors: camp.registeredDonors.map(reg => ({
        name: reg.donor.name,
        email: reg.donor.email,
        bloodType: reg.donor.bloodType,
        phone: reg.donor.phoneNumber,
        status: reg.status,
        donationStatus: reg.donationStatus,
        registrationDate: reg.registrationDate
      }))
    };

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// User: Submit feedback
exports.submitFeedback = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const camp = await Camp.findById(req.params.id);

    if (!camp) {
      return res.status(404).json({ message: 'Camp not found' });
    }

    const registration = camp.registeredDonors.find(
      reg => reg.donor.toString() === req.user._id.toString()
    );

    if (!registration) {
      return res.status(404).json({ message: 'Not registered for this camp' });
    }

    registration.feedback = {
      rating,
      comment,
      submittedAt: new Date()
    };

    await camp.save();
    res.json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get camps for organizer
exports.getOrganizerCamps = async (req, res) => {
  try {
    const camps = await Camp.find({ organizer: req.user._id })
      .populate('registeredDonors.donor', 'name email')
      .sort({ date: 1 });
    res.json(camps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get nearby camps
exports.getNearbyCamps = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 10000 } = req.query; // maxDistance in meters, default 10km

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const camps = await Camp.find({
      status: 'approved',
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      }
    })
    .populate('organizer', 'name email')
    .populate('registeredDonors.donor', 'name email bloodType')
    .lean();

    // Transform data to ensure consistent format
    const transformedCamps = camps.map(camp => ({
      _id: camp._id,
      name: camp.name,
      venue: camp.venue,
      date: camp.date,
      time: camp.time,
      capacity: camp.capacity,
      organizer: camp.organizer || { name: 'Unknown', email: 'N/A' },
      registeredDonors: camp.registeredDonors || [],
      status: camp.status,
      description: camp.description,
      requirements: camp.requirements || [],
      contactInfo: camp.contactInfo || { phone: 'N/A', email: 'N/A' },
      location: camp.location || { type: 'Point', coordinates: [0, 0] }
    }));

    res.json(transformedCamps);
  } catch (error) {
    console.error('Error in getNearbyCamps:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get single camp
exports.getCamp = async (req, res) => {
  try {
    const camp = await Camp.findById(req.params.id)
      .populate('organizer', 'name email')
      .populate('registeredDonors.donor', 'name email');

    if (!camp) {
      return res.status(404).json({ message: 'Camp not found' });
    }

    res.json(camp);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create camp
exports.createCamp = async (req, res) => {
  try {
    const {
      name,
      venue,
      date,
      time,
      capacity,
      description,
      requirements,
      contactInfo,
      location
    } = req.body;

    // Validate required fields
    if (!name || !venue || !date || !time || !capacity) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Validate capacity
    if (capacity < 1) {
      return res.status(400).json({ message: 'Capacity must be at least 1' });
    }

    // Validate date
    const campDate = new Date(date);
    if (campDate < new Date()) {
      return res.status(400).json({ message: 'Camp date cannot be in the past' });
    }

    // Validate location coordinates
    if (!location || !location.latitude || !location.longitude || !location.address) {
      return res.status(400).json({ message: 'Please provide valid location details' });
    }

    // Create new camp
    const camp = new Camp({
      name,
      venue,
      date: campDate,
      time,
      capacity,
      description,
      requirements,
      contactInfo,
      location,
      organizer: req.user._id,
      status: 'pending',
      analytics: {
        registrationRate: 0,
        donationRate: 0,
        totalRegistrations: 0,
        actualDonors: 0
      }
    });

    await camp.save();

    // Send notification to admin
    const admins = await User.find({ role: 'admin' });
    const notifications = admins.map(admin => ({
      recipient: admin._id,
      type: 'new_camp',
      message: `New blood donation camp "${name}" requires approval`,
      relatedCamp: camp._id
    }));

    await Notification.insertMany(notifications);

    res.status(201).json({
      message: 'Camp created successfully and pending approval',
      camp
    });
  } catch (error) {
    console.error('Error in createCamp:', error);
    res.status(500).json({ message: 'Error creating camp', error: error.message });
  }
};

// Update camp
exports.updateCamp = async (req, res) => {
  try {
    const camp = await Camp.findById(req.params.id);

    if (!camp) {
      return res.status(404).json({ message: 'Camp not found' });
    }

    // Check if user is the organizer
    if (camp.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this camp' });
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

    // Validate coordinates if provided
    if (latitude && longitude && !validateCoordinates(latitude, longitude)) {
      return res.status(400).json({ message: 'Invalid coordinates' });
    }

    // Update fields
    camp.name = name || camp.name;
    camp.venue = venue || camp.venue;
    camp.date = date || camp.date;
    camp.time = time || camp.time;
    camp.capacity = capacity || camp.capacity;
    camp.description = description || camp.description;
    camp.requirements = requirements || camp.requirements;
    
    if (contactPhone || contactEmail) {
      camp.contactInfo = {
        phone: contactPhone || camp.contactInfo.phone,
        email: contactEmail || camp.contactInfo.email
      };
    }

    if (latitude && longitude) {
      camp.location = {
        type: 'Point',
        coordinates: [longitude, latitude]
      };
    }

    await camp.save();
    res.json(camp);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete camp
exports.deleteCamp = async (req, res) => {
  try {
    const camp = await Camp.findById(req.params.id);

    if (!camp) {
      return res.status(404).json({ message: 'Camp not found' });
    }

    // Check if user is the organizer
    if (camp.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this camp' });
    }

    // Check if camp has registered donors
    if (camp.registeredDonors.length > 0) {
      camp.status = 'cancelled';
      await camp.save();
      return res.json({ message: 'Camp has registered donors. Status changed to cancelled.' });
    }

    await camp.remove();
    res.json({ message: 'Camp deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get registered donors for a camp
exports.getCampDonors = async (req, res) => {
  try {
    const camp = await Camp.findById(req.params.id)
      .populate('registeredDonors.donor', 'name email');

    if (!camp) {
      return res.status(404).json({ message: 'Camp not found' });
    }

    // Check if user is the organizer
    if (camp.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view donors' });
    }

    res.json(camp.registeredDonors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update donor status
exports.updateDonorStatus = async (req, res) => {
  try {
    const { donorId } = req.params;
    const { status, notes } = req.body;

    const camp = await Camp.findById(req.params.id);

    if (!camp) {
      return res.status(404).json({ message: 'Camp not found' });
    }

    // Check if user is the organizer
    if (camp.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update donor status' });
    }

    const donorRegistration = camp.registeredDonors.find(
      reg => reg.donor.toString() === donorId
    );

    if (!donorRegistration) {
      return res.status(404).json({ message: 'Donor not found in camp' });
    }

    donorRegistration.status = status;
    if (notes) donorRegistration.notes = notes;

    await camp.save();
    res.json(donorRegistration);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Register donor for camp
exports.registerDonor = async (req, res) => {
  try {
    const camp = await Camp.findById(req.params.id);

    if (!camp) {
      return res.status(404).json({ message: 'Camp not found' });
    }

    if (camp.status !== 'approved') {
      return res.status(400).json({ message: 'Camp is not accepting registrations' });
    }

    if (camp.isFull()) {
      return res.status(400).json({ message: 'Camp is full' });
    }

    if (camp.isDonorRegistered(req.user._id)) {
      return res.status(400).json({ message: 'Already registered for this camp' });
    }

    camp.registeredDonors.push({
      donor: req.user._id,
      status: 'pending'
    });

    await camp.save();
    res.status(201).json({ message: 'Successfully registered for camp' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Cancel donor registration
exports.cancelRegistration = async (req, res) => {
  try {
    const camp = await Camp.findById(req.params.id);

    if (!camp) {
      return res.status(404).json({ message: 'Camp not found' });
    }

    const registrationIndex = camp.registeredDonors.findIndex(
      reg => reg.donor.toString() === req.user._id.toString()
    );

    if (registrationIndex === -1) {
      return res.status(404).json({ message: 'Not registered for this camp' });
    }

    camp.registeredDonors.splice(registrationIndex, 1);
    await camp.save();

    res.json({ message: 'Registration cancelled successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}; 