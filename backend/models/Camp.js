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
    required: [true, 'Date is required'],
    validate: {
      validator: function(value) {
        return value >= new Date();
      },
      message: 'Camp date cannot be in the past'
    }
  },
  time: {
    type: String,
    required: [true, 'Time is required'],
    trim: true
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
  requirements: {
    type: String,
    required: [true, 'Requirements are required'],
    trim: true
  },
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
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    }
  },
  location: {
    latitude: {
      type: Number,
      required: [true, 'Latitude is required']
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required']
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true
    }
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Organizer is required']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'ongoing', 'completed', 'cancelled'],
    default: 'pending'
  },
  registeredDonors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: []
  }],
  actualDonors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: []
  }],
  analytics: {
    registrationRate: {
      type: Number,
      default: 0
    },
    donationRate: {
      type: Number,
      default: 0
    },
    totalRegistrations: {
      type: Number,
      default: 0
    },
    actualDonors: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Pre-save middleware to update analytics
campSchema.pre('save', function(next) {
  if (this.isModified('registeredDonors') || this.isModified('actualDonors')) {
    this.analytics = {
      totalRegistrations: this.registeredDonors.length,
      actualDonors: this.actualDonors.length,
      registrationRate: (this.registeredDonors.length / this.capacity) * 100,
      donationRate: this.registeredDonors.length > 0 ? 
        (this.actualDonors.length / this.registeredDonors.length) * 100 : 0
    };
  }
  next();
});

// Virtual for checking if camp is full
campSchema.virtual('isFull').get(function() {
  return this.registeredDonors.length >= this.capacity;
});

// Method to check if a user is registered
campSchema.methods.isUserRegistered = function(userId) {
  return this.registeredDonors.includes(userId);
};

// Method to check if a user has donated
campSchema.methods.hasUserDonated = function(userId) {
  return this.actualDonors.includes(userId);
};

const Camp = mongoose.model('Camp', campSchema);

module.exports = Camp;