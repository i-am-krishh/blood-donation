const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Camp = require('../models/Camp');
const Donation = require('../models/Donation');

const sampleDonations = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get some existing donors
    const donors = await User.find({ role: 'donor' }).limit(5);
    if (donors.length === 0) {
      console.log('No donors found. Creating sample donors...');
      const sampleDonors = [
        {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          role: 'donor',
          bloodType: 'O+',
          isApproved: true
        },
        {
          name: 'Jane Smith',
          email: 'jane@example.com',
          password: 'password123',
          role: 'donor',
          bloodType: 'A+',
          isApproved: true
        },
        {
          name: 'Mike Johnson',
          email: 'mike@example.com',
          password: 'password123',
          role: 'donor',
          bloodType: 'B-',
          isApproved: true
        }
      ];

      for (const donor of sampleDonors) {
        await User.create(donor);
      }
    }

    // Get some existing camps
    const camps = await Camp.find().limit(3);
    if (camps.length === 0) {
      console.log('No camps found. Creating sample camps...');
      const sampleCamps = [
        {
          name: 'City Hospital Blood Drive',
          venue: 'City Hospital',
          date: new Date(),
          time: '09:00',
          capacity: 50,
          status: 'approved'
        },
        {
          name: 'Community Center Drive',
          venue: 'Downtown Community Center',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          time: '10:00',
          capacity: 30,
          status: 'approved'
        },
        {
          name: 'University Blood Camp',
          venue: 'University Campus',
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          time: '11:00',
          capacity: 40,
          status: 'completed'
        }
      ];

      for (const camp of sampleCamps) {
        await Camp.create(camp);
      }
    }

    // Refresh donors and camps after potential creation
    const updatedDonors = await User.find({ role: 'donor' }).limit(5);
    const updatedCamps = await Camp.find().limit(3);

    // Create sample donations
    const statuses = ['pending', 'completed', 'rejected'];
    const sampleDonations = [];

    for (let i = 0; i < 10; i++) {
      const donor = updatedDonors[Math.floor(Math.random() * updatedDonors.length)];
      const camp = updatedCamps[Math.floor(Math.random() * updatedCamps.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      sampleDonations.push({
        donor: donor._id,
        camp: camp._id,
        donationDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        status,
        bloodType: donor.bloodType,
        quantity: Math.floor(Math.random() * 2) + 1,
        certificateIssued: status === 'completed',
        notes: `Sample donation by ${donor.name} at ${camp.name}`
      });
    }

    // Clear existing donations
    await Donation.deleteMany({});
    console.log('Cleared existing donations');

    // Insert new donations
    await Donation.insertMany(sampleDonations);
    console.log('Created sample donations');

    // Log some sample API endpoints to test
    console.log('\nTest these endpoints:');
    console.log('1. GET /api/admin/donations - Get all donations');
    console.log('2. GET /api/donations/my-donations - Get user\'s donations (requires donor login)');
    console.log('3. GET /api/donations/stats - Get donation statistics');
    console.log('\nSample donation IDs:');
    const donations = await Donation.find().limit(3);
    donations.forEach((donation, index) => {
      console.log(`${index + 1}. ${donation._id}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

sampleDonations(); 