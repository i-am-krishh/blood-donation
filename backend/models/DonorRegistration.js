const mongoose = require('mongoose');

const donorRegistrationSchema = new mongoose.Schema({
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  campId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Camp',
    required: true
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['registered', 'donated', 'cancelled'],
    default: 'registered'
  },
  donationDate: {
    type: Date
  },
  nextEligibleDate: {
    type: Date
  }
});

// Index for faster queries
donorRegistrationSchema.index({ donorId: 1, campId: 1 }, { unique: true });

// Method to check if donor is eligible for donation
donorRegistrationSchema.statics.isEligibleForDonation = async function(donorId) {
  const lastDonation = await this.findOne({ 
    donorId, 
    status: 'donated' 
  }).sort({ donationDate: -1 });

  if (!lastDonation) return true;

  const today = new Date();
  const nextEligibleDate = lastDonation.nextEligibleDate;
  
  return !nextEligibleDate || today >= nextEligibleDate;
};

// Method to check if donor has already registered for a specific camp
donorRegistrationSchema.statics.hasRegisteredForCamp = async function(donorId, campId) {
  const registration = await this.findOne({
    donorId,
    campId,
    status: { $in: ['registered', 'donated'] }
  });
  
  return !!registration;
};

// Method to get donor's next eligible date
donorRegistrationSchema.statics.getNextEligibleDate = async function(donorId) {
  const lastDonation = await this.findOne({ 
    donorId, 
    status: 'donated' 
  }).sort({ donationDate: -1 });

  return lastDonation ? lastDonation.nextEligibleDate : null;
};

const DonorRegistration = mongoose.model('DonorRegistration', donorRegistrationSchema);
module.exports = DonorRegistration; 