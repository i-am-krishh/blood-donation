const nodemailer = require('nodemailer');
const twilio = require('twilio');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Initialize email transporter
const transporter = nodemailer.createTransport({
  // Configure your email service here
  // For development, you can use ethereal.email
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Initialize Twilio client
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

class NotificationService {
  static async createNotification(data) {
    try {
      const notification = new Notification(data);
      await notification.save();
      
      // Send notifications immediately if not scheduled for later
      if (!data.scheduledFor || data.scheduledFor <= new Date()) {
        await this.sendNotification(notification);
      }
      
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  static async sendNotification(notification) {
    try {
      const recipient = await User.findById(notification.recipient);
      if (!recipient) {
        throw new Error('Recipient not found');
      }

      // Send email notification
      if (recipient.email && !notification.isEmailSent) {
        await this.sendEmail(recipient.email, notification.title, notification.message);
        notification.isEmailSent = true;
      }

      // Send SMS notification if phone number exists and Twilio is configured
      if (recipient.phone && !notification.isSMSSent && twilioClient) {
        await this.sendSMS(recipient.phone, notification.message);
        notification.isSMSSent = true;
      }

      await notification.save();
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  static async sendEmail(to, subject, text) {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || '"Blood Donation App" <noreply@blooddonation.com>',
        to,
        subject,
        text,
        html: `<div style="font-family: Arial, sans-serif;">
          <h2>${subject}</h2>
          <p>${text}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            This is an automated message from the Blood Donation App. 
            Please do not reply to this email.
          </p>
        </div>`
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  static async sendSMS(to, message) {
    try {
      if (!twilioClient) {
        throw new Error('Twilio is not configured');
      }

      const result = await twilioClient.messages.create({
        body: message,
        to,
        from: process.env.TWILIO_PHONE_NUMBER
      });

      console.log('SMS sent:', result.sid);
      return result;
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }

  static async sendCampReminders() {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      const upcomingCamps = await Camp.find({
        date: {
          $gte: tomorrow,
          $lt: dayAfterTomorrow
        },
        status: 'approved'
      }).populate('registeredDonors');

      for (const camp of upcomingCamps) {
        for (const donorId of camp.registeredDonors) {
          await this.createNotification({
            recipient: donorId,
            type: 'camp_reminder',
            title: 'Upcoming Blood Donation Camp',
            message: `Reminder: You are registered for the blood donation camp "${camp.name}" tomorrow at ${camp.venue}. Time: ${camp.time}`,
            relatedId: camp._id,
            relatedModel: 'Camp'
          });
        }
      }
    } catch (error) {
      console.error('Error sending camp reminders:', error);
      throw error;
    }
  }

  static async sendDonationReminders() {
    try {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const lastDonations = await Donation.find({
        status: 'completed',
        donationDate: { $lte: threeMonthsAgo }
      }).populate('donorId');

      for (const donation of lastDonations) {
        if (donation.donorId) {
          await this.createNotification({
            recipient: donation.donorId._id,
            type: 'donation_reminder',
            title: 'Time for Another Donation',
            message: 'It has been 3 months since your last blood donation. You are now eligible to donate again. Find a nearby camp and help save lives!',
            relatedId: donation._id,
            relatedModel: 'Donation'
          });
        }
      }
    } catch (error) {
      console.error('Error sending donation reminders:', error);
      throw error;
    }
  }

  static async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        _id: notificationId,
        recipient: userId
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      notification.isRead = true;
      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  static async getUnreadCount(userId) {
    try {
      return await Notification.countDocuments({
        recipient: userId,
        isRead: false
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  static async getUserNotifications(userId, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      
      const notifications = await Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('relatedId');

      const total = await Notification.countDocuments({ recipient: userId });

      return {
        notifications,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }
}

module.exports = NotificationService; 