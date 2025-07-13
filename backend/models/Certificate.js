const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema({
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
  certificatePath: {
    type: String,
    required: true
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  template: {
    type: String,
    default: 'default'
  },
  metadata: {
    type: Map,
    of: String,
    default: () => ({})
  }
}, {
  timestamps: true
});

// Create index for faster lookups
CertificateSchema.index({ donationId: 1 }, { unique: true });
CertificateSchema.index({ donorId: 1 });
CertificateSchema.index({ campId: 1 });

module.exports = mongoose.model('Certificate', CertificateSchema);