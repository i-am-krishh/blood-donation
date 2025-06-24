const Camp = require('../models/Camp');
const User = require('../models/User');
const { validateCoordinates } = require('../utils/validation');

// Get all camps (with filters)
exports.getAllCamps = async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = { status: 'approved' }; // Default to approved camps

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
      .populate('registeredDonors.donor', 'name email bloodType')
      .sort({ date: 1 })
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
    console.error('Error in getAllCamps:', error);
    res.status(500).json({ message: error.message });
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
      contactPhone,
      contactEmail,
      latitude,
      longitude
    } = req.body;

    // Validate coordinates
    if (!validateCoordinates(latitude, longitude)) {
      return res.status(400).json({ message: 'Invalid coordinates' });
    }

    const camp = new Camp({
      name,
      venue,
      date,
      time,
      capacity,
      description,
      requirements: requirements || ['Age between 18-65', 'Weight above 50kg', 'No recent surgeries'],
      contactInfo: {
        phone: contactPhone,
        email: contactEmail
      },
      location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      },
      organizer: req.user._id
    });

    await camp.save();
    res.status(201).json(camp);
  } catch (error) {
    res.status(400).json({ message: error.message });
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