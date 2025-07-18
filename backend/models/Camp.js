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
  contactNo: {
    type: String,
    required: [true, 'Contact number is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
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

// Update pre-save middleware to use DonorRegistration for analytics
campSchema.pre('save', async function(next) {
  if (this.isModified('actualDonors')) {
    const DonorRegistration = mongoose.model('DonorRegistration');
    const totalRegistrations = await DonorRegistration.countDocuments({ campId: this._id });
    
    this.analytics = {
      totalRegistrations,
      actualDonors: this.actualDonors.length,
      registrationRate: (totalRegistrations / this.capacity) * 100,
      donationRate: totalRegistrations > 0 ? 
        (this.actualDonors.length / totalRegistrations) * 100 : 0
    };
  }
  next();
});

// Update virtual for checking if camp is full
campSchema.virtual('isFull').get(async function() {
  const DonorRegistration = mongoose.model('DonorRegistration');
  const totalRegistrations = await DonorRegistration.countDocuments({ campId: this._id });
  return totalRegistrations >= this.capacity;
});

// Update method to check if a user is registered
campSchema.methods.isUserRegistered = async function(userId) {
  const DonorRegistration = mongoose.model('DonorRegistration');
  const registration = await DonorRegistration.findOne({
    campId: this._id,
    donorId: userId,
    status: { $in: ['registered', 'donated'] }
  });
  return !!registration;
};

const Camp = mongoose.model('Camp', campSchema);

module.exports = Camp;