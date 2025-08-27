const mongoose = require('mongoose');

const donationVerificationSchema = new mongoose.Schema({
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
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  verificationDate: {
    type: Date,
    default: Date.now
  },
  donationDetails: {
    startTime: Date,
    endTime: Date,
    complications: String
  },
  postDonationCare: {
    refreshments: String,
    restPeriod: Number,
    followUpInstructions: String
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  certificateGenerated: {
    type: Boolean,
    default: false
  },
  certificateUrl: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DonationVerification', donationVerificationSchema);