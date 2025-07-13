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
        value: { type: Number, required: true },
        isPass: { type: Boolean, required: true }
      },
      bloodPressure: {
        systolic: { type: Number, required: true },
        diastolic: { type: Number, required: true },
        isPass: { type: Boolean, required: true }
      },
      weight: {
        value: { type: Number, required: true },
        isPass: { type: Boolean, required: true }
      },
      pulse: {
        value: { type: Number, required: true },
        isPass: { type: Boolean, required: true }
      },
      temperature: {
        value: { type: Number, required: true },
        isPass: { type: Boolean, required: true }
      }
    },
    required: true
  },
  // Health screening
  healthScreening: {
    type: {
      recentIllness: { type: Boolean, required: true },
      medications: { type: Boolean, required: true },
      allergies: { type: Boolean, required: true },
      recentSurgery: { type: Boolean, required: true },
      pregnancyStatus: { type: Boolean, required: true },
      lastDonationDate: { type: Date },
      notes: { type: String }
    },
    required: true
  },
  // Donation details
  donationDetails: {
    type: {
      bloodBagNumber: { type: String, required: true },
      quantity: { type: Number, required: true }, // in ml
      startTime: { type: Date, required: true },
      endTime: { type: Date, required: true },
      complications: { type: String }
    },
    required: true
  },
  // Post-donation care
  postDonationCare: {
    type: {
      refreshmentsTaken: { type: Boolean, required: true },
      restingTime: { type: Number, required: true }, // in minutes
      afterEffects: { type: String },
      recommendations: { type: String }
    },
    required: true
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