const DonationVerification = require('../models/DonationVerification');
const Donation = require('../models/Donation');
const Camp = require('../models/Camp');
const User = require('../models/User');
const Notification = require('../models/Notification');
const DonorRegistration = require('../models/DonorRegistration');

// Start donation verification process
exports.startVerification = async (req, res) => {
  try {
    const { donorId, campId } = req.params;
    const verifierId = req.user._id;

    // Check if donor exists and is registered for the camp
    const camp = await Camp.findById(campId);
    if (!camp) {
      return res.status(404).json({ message: 'Camp not found' });
    }

    // Find and verify donor registration with full donor details
    const registration = await DonorRegistration.findOne({
      donorId,
      campId,
      status: 'registered'
    }).populate('donorId', 'name email bloodType');

    if (!registration) {
      return res.status(400).json({ message: 'Donor is not registered for this camp or has already donated' });
    }

    if (!registration) {
      return res.status(400).json({ message: 'Donor is not registered for this camp' });
    }

    if (!registration.donorId || !registration.donorId.bloodType) {
      return res.status(400).json({ message: 'Donor information or blood type is missing' });
    }

    // Get donor's blood type from the populated User document
    const donorBloodType = registration.donorId.bloodType;

    // Create donation record
    const donation = new Donation({
      donor: donorId,
      camp: campId,
      donationDate: new Date(),
      status: 'pending',
      bloodType: donorBloodType,
      quantity: 1 // Default unit of blood
    });

    console.log('Creating donation with data:', donation);
    await donation.save();

    // Create verification record
    const verification = new DonationVerification({
      donationId: donation._id,
      donorId,
      campId,
      verifiedBy: verifierId,
      status: 'pending'
    });
    await verification.save();

    // Update registration status
    registration.status = 'donated';
    registration.donationDate = new Date();
    registration.nextEligibleDate = new Date(Date.now() + (90 * 24 * 60 * 60 * 1000)); // 90 days
    await registration.save();

    res.status(201).json({
      message: 'Donation verification process started',
      verificationId: verification._id
    });
  } catch (error) {
    console.error('Error in startVerification:', error);
    res.status(500).json({ message: error.message || 'Error starting verification process' });
  }
};

// Update medical checks
exports.updateMedicalChecks = async (req, res) => {
  try {
    const { verificationId } = req.params;
    const { medicalChecks } = req.body;

    const verification = await DonationVerification.findById(verificationId);
    if (!verification) {
      return res.status(404).json({ message: 'Verification record not found' });
    }

    // Update medical checks
    verification.medicalChecks = {
      ...verification.medicalChecks,
      ...medicalChecks
    };

    // Check eligibility after medical checks
    if (!verification.isEligible()) {
      verification.status = 'rejected';
      verification.rejectionReason = 'Failed medical screening';
      
      // Update related donation status
      await Donation.findByIdAndUpdate(verification.donationId, {
        status: 'cancelled',
        notes: 'Failed medical screening'
      });

      // Notify donor
      await Notification.create({
        recipient: verification.donorId,
        type: 'donation_rejected',
        title: 'Donation Rejected',
        message: 'Unfortunately, you did not meet the medical requirements for blood donation today.',
        relatedId: verification.donationId,
        relatedModel: 'Donation'
      });
    }

    await verification.save();
    res.json({ message: 'Medical checks updated', verification });
  } catch (error) {
    console.error('Error in updateMedicalChecks:', error);
    res.status(500).json({ message: 'Error updating medical checks' });
  }
};

// Update health screening
exports.updateHealthScreening = async (req, res) => {
  try {
    const { verificationId } = req.params;
    const { healthScreening } = req.body;

    const verification = await DonationVerification.findById(verificationId);
    if (!verification) {
      return res.status(404).json({ message: 'Verification record not found' });
    }

    verification.healthScreening = {
      ...verification.healthScreening,
      ...healthScreening
    };

    // Check eligibility after health screening
    if (!verification.isEligible()) {
      verification.status = 'rejected';
      verification.rejectionReason = 'Health screening issues detected';
      
      // Update related donation status
      await Donation.findByIdAndUpdate(verification.donationId, {
        status: 'cancelled',
        notes: 'Failed health screening'
      });

      // Notify donor
      await Notification.create({
        recipient: verification.donorId,
        type: 'donation_rejected',
        title: 'Donation Rejected',
        message: 'Due to health screening results, we cannot proceed with the donation at this time.',
        relatedId: verification.donationId,
        relatedModel: 'Donation'
      });
    }

    await verification.save();
    res.json({ message: 'Health screening updated', verification });
  } catch (error) {
    console.error('Error in updateHealthScreening:', error);
    res.status(500).json({ message: 'Error updating health screening' });
  }
};

// Record donation details
exports.recordDonation = async (req, res) => {
  try {
    const { verificationId } = req.params;
    const { donationDetails } = req.body;

    const verification = await DonationVerification.findById(verificationId);
    if (!verification) {
      return res.status(404).json({ message: 'Verification record not found' });
    }

    // Validate blood bag number uniqueness
    const existingBagNumber = await DonationVerification.findOne({
      'donationDetails.bloodBagNumber': donationDetails.bloodBagNumber
    });
    if (existingBagNumber) {
      return res.status(400).json({ message: 'Blood bag number already exists' });
    }

    verification.donationDetails = {
      ...verification.donationDetails,
      ...donationDetails,
      startTime: new Date()
    };
    verification.status = 'approved';
    await verification.save();

    // Update donation status
    await Donation.findByIdAndUpdate(verification.donationId, {
      status: 'in_progress',
      bloodBagNumber: donationDetails.bloodBagNumber
    });

    res.json({ message: 'Donation details recorded', verification });
  } catch (error) {
    console.error('Error in recordDonation:', error);
    res.status(500).json({ message: 'Error recording donation details' });
  }
};

// Complete donation
exports.completeDonation = async (req, res) => {
  try {
    const { verificationId } = req.params;
    const { postDonationCare, complications } = req.body;

    const verification = await DonationVerification.findById(verificationId);
    if (!verification) {
      return res.status(404).json({ message: 'Verification record not found' });
    }

    // Update verification status and details
    verification.status = 'completed';
    verification.postDonationCare = postDonationCare;
    verification.donationDetails = {
      ...verification.donationDetails,
      complications: complications || ''
    };
    await verification.save();

    // Update donation record
    const donation = await Donation.findByIdAndUpdate(verification.donationId, {
      status: 'completed',
      completedAt: new Date()
    }, { new: true });

    // Update camp and donor records
    const camp = await Camp.findById(verification.campId);
    if (!camp.actualDonors.includes(verification.donorId)) {
      camp.actualDonors.push(verification.donorId);
      await camp.save();
    }

    // Update donor's last donation date
    await User.findByIdAndUpdate(verification.donorId, {
      lastDonation: new Date()
    });

    // Generate certificate
    try {
      const certificateResponse = await fetch('http://localhost:5000/api/certificates/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`
        },
        body: JSON.stringify({
          donorId: verification.donorId,
          campId: verification.campId,
          donationDate: new Date(),
          verificationId: verification._id
        })
      });

      if (certificateResponse.ok) {
        const certificateData = await certificateResponse.json();
        verification.certificateGenerated = true;
        verification.certificateUrl = certificateData.url;
        await verification.save();
      }
    } catch (certError) {
      console.error('Certificate generation error:', certError);
      // Don't throw error - certificate can be generated later by admin
    }

    // Create notification
    await Notification.create({
      recipient: verification.donorId,
      type: 'donation_completed',
      title: 'Donation Completed',
      message: 'Thank you for your blood donation! Your contribution will help save lives.',
      relatedId: verification.donationId,
      relatedModel: 'Donation'
    });

    res.json({
      message: 'Donation completed successfully',
      verification,
      donation
    });
  } catch (error) {
    console.error('Error in completeDonation:', error);
    res.status(500).json({ message: 'Error completing donation' });
  }
};

// Get verification details
exports.getVerification = async (req, res) => {
  try {
    const { verificationId } = req.params;
    
    const verification = await DonationVerification.findById(verificationId)
      .populate('donorId', 'name email bloodType')
      .populate('verifiedBy', 'name')
      .populate('campId', 'name venue');

    if (!verification) {
      return res.status(404).json({ message: 'Verification record not found' });
    }

    res.json(verification);
  } catch (error) {
    console.error('Error in getVerification:', error);
    res.status(500).json({ message: 'Error fetching verification details' });
  }
};