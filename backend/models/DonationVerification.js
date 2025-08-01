const mongoose = require('mongoose');

const donationVerificationSchema = new mongoose.Schema({
  donationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donation',
    required: true
  },
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
  // Pre-donation medical checks
  medicalChecks: {
    type: {
      hemoglobin: {
        value: { type: Number },
        isPass: { type: Boolean }
      },
      bloodPressure: {
        systolic: { type: Number },
        diastolic: { type: Number },
        isPass: { type: Boolean }
      },
      weight: {
        value: { type: Number },
        isPass: { type: Boolean }
      },
      pulse: {
        value: { type: Number },
        isPass: { type: Boolean }
      },
      temperature: {
        value: { type: Number },
        isPass: { type: Boolean }
      }
    }
  },
  // Health screening
  healthScreening: {
    type: {
      recentIllness: { type: Boolean },
      medications: { type: Boolean },
      allergies: { type: Boolean },
      recentSurgery: { type: Boolean },
      pregnancyStatus: { type: Boolean },
      lastDonationDate: { type: Date },
      notes: { type: String }
    }
  },
  // Donation details
  donationDetails: {
    type: {
      bloodBagNumber: { type: String },
      quantity: { type: Number, default: 1 }, // in units
      startTime: { type: Date },
      endTime: { type: Date },
      complications: { type: String }
    }
  },
  // Post-donation care
  postDonationCare: {
    type: {
      refreshments: { type: Boolean, default: true },
      restPeriod: { type: Number, default: 15 }, // in minutes
      followUpInstructions: { type: String },
      complications: { type: String, default: '' }
    }
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DonationVerification', donationVerificationSchema);