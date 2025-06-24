const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  donation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donation',
    required: true
  },
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  camp: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Camp',
    required: true
  },
  certificateNumber: {
    type: String,
    required: true,
    unique: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  issuedDate: {
    type: Date,
    default: Date.now
  },
  verificationCode: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['active', 'revoked'],
    default: 'active'
  },
  metadata: {
    bloodType: String,
    units: Number,
    donationDate: Date,
    campName: String,
    donorName: String
  }
}, {
  timestamps: true
});

// Generate certificate number before saving
certificateSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments();
    this.certificateNumber = `CERT-${new Date().getFullYear()}-${(count + 1).toString().padStart(6, '0')}`;
  }
  next();
});

const Certificate = mongoose.model('Certificate', certificateSchema);
module.exports = Certificate;