const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['camp_reminder', 'donation_reminder', 'urgent_request', 'certificate_generated', 'camp_cancelled', 'camp_updated'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedModel'
  },
  relatedModel: {
    type: String,
    enum: ['Camp', 'Donation', 'Certificate'],
    required: function() {
      return this.relatedId != null;
    }
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isEmailSent: {
    type: Boolean,
    default: false
  },
  isSMSSent: {
    type: Boolean,
    default: false
  },
  scheduledFor: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: Map,
    of: String,
    default: () => ({})
  }
}, {
  timestamps: true
});

// Indexes for faster queries
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, scheduledFor: 1 });
NotificationSchema.index({ isRead: 1 });

module.exports = mongoose.model('Notification', NotificationSchema); 