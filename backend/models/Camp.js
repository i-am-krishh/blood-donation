const mongoose = require('mongoose');

const campSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Camp name is required'],
    trim: true
  },
  venue: {
    type: String,
    required: [true, 'Venue is required'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  time: {
    type: String,
    required: [true, 'Time is required']
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: [1, 'Capacity must be at least 1']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  requirements: [{
    type: String,
    trim: true
  }],
  contactInfo: {
    phone: {
      type: String,
      required: [true, 'Contact phone is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Contact email is required'],
      trim: true,
      lowercase: true
    }
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'cancelled', 'completed'],
    default: 'pending'
  },
  registeredDonors: [{
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    registrationDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending'
    },
    donationStatus: {
      type: String,
      enum: ['not_donated', 'donated', 'no_show'],
      default: 'not_donated'
    },
    notes: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create a 2dsphere index for location-based queries
campSchema.index({ location: '2dsphere' });

// Update the updatedAt timestamp before saving
campSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual field for registered donors count
campSchema.virtual('registeredDonorsCount').get(function() {
  return this.registeredDonors.length;
});

// Virtual field for available slots
campSchema.virtual('availableSlots').get(function() {
  return this.capacity - this.registeredDonors.length;
});

// Method to check if camp is full
campSchema.methods.isFull = function() {
  return this.registeredDonors.length >= this.capacity;
};

// Method to check if a donor is already registered
campSchema.methods.isDonorRegistered = function(donorId) {
  return this.registeredDonors.some(registration => 
    registration.donorId.toString() === donorId.toString()
  );
};

const Camp = mongoose.model('Camp', campSchema);

module.exports = Camp;