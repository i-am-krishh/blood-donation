const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const Certificate = require('../models/Certificate');
const Donation = require('../models/Donation');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// @route   POST /api/certificates/generate
// @desc    Generate certificate for a donation
// @access  Admin
router.post('/generate', [auth, isAdmin], async (req, res) => {
  try {
    const { donationId } = req.body;

    // Get donation details
    const donation = await Donation.findById(donationId)
      .populate('donorId', 'name bloodType')
      .populate('campId', 'name venue date');

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    if (donation.status !== 'completed') {
      return res.status(400).json({ message: 'Certificate can only be generated for completed donations' });
    }

    // Check if certificate already exists
    let certificate = await Certificate.findOne({ donationId });
    
    if (certificate) {
      return res.status(400).json({ message: 'Certificate already exists for this donation' });
    }

    // Create PDF certificate
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    // Set up certificate file path
    const certificateFileName = `certificate_${donationId}_${Date.now()}.pdf`;
    const certificatePath = path.join(__dirname, '..', 'certificates', certificateFileName);

    // Ensure certificates directory exists
    if (!fs.existsSync(path.join(__dirname, '..', 'certificates'))) {
      fs.mkdirSync(path.join(__dirname, '..', 'certificates'));
    }

    // Pipe PDF to file
    doc.pipe(fs.createWriteStream(certificatePath));

    // Add certificate content
    doc.font('Helvetica-Bold')
       .fontSize(30)
       .text('Certificate of Blood Donation', { align: 'center' });

    doc.moveDown();
    doc.font('Helvetica')
       .fontSize(16)
       .text('This is to certify that', { align: 'center' });

    doc.moveDown();
    doc.font('Helvetica-Bold')
       .fontSize(24)
       .text(donation.donorId.name, { align: 'center' });

    doc.moveDown();
    doc.font('Helvetica')
       .fontSize(16)
       .text(`has donated ${donation.units} units of ${donation.donorId.bloodType} blood`, { align: 'center' });

    doc.moveDown();
    doc.text(`at ${donation.campId.name}`, { align: 'center' });
    doc.text(`on ${new Date(donation.donationDate).toLocaleDateString()}`, { align: 'center' });

    doc.moveDown(2);
    doc.fontSize(12)
       .text('Thank you for your noble contribution to saving lives.', { align: 'center' });

    // Add signature line
    doc.moveDown(3);
    doc.fontSize(12);
    doc.text('_______________________', 350, 500, { align: 'center' });
    doc.moveDown();
    doc.text('Authorized Signature', 350, 520, { align: 'center' });

    // Finalize PDF
    doc.end();

    // Create certificate record in database
    certificate = new Certificate({
      donationId,
      donorId: donation.donorId._id,
      campId: donation.campId._id,
      certificatePath: certificateFileName,
      generatedBy: req.user.id,
      generatedAt: new Date()
    });

    await certificate.save();

    res.json({
      message: 'Certificate generated successfully',
      certificateId: certificate._id
    });
  } catch (err) {
    console.error('Error generating certificate:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/certificates/:id/download
// @desc    Download a certificate
// @access  Admin or Certificate Owner
router.get('/:id/download', auth, async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('donorId', 'name')
      .populate('donationId');

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    // Check if user is admin or certificate owner
    if (!req.user.isAdmin && certificate.donorId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const certificatePath = path.join(__dirname, '..', 'certificates', certificate.certificatePath);

    if (!fs.existsSync(certificatePath)) {
      return res.status(404).json({ message: 'Certificate file not found' });
    }

    res.download(certificatePath, `${certificate.donorId.name}_certificate.pdf`);
  } catch (err) {
    console.error('Error downloading certificate:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/certificates/donation/:donationId
// @desc    Get certificate by donation ID
// @access  Admin or Certificate Owner
router.get('/donation/:donationId', auth, async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ donationId: req.params.donationId })
      .populate('donorId', 'name')
      .populate('donationId');

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    // Check if user is admin or certificate owner
    if (!req.user.isAdmin && certificate.donorId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(certificate);
  } catch (err) {
    console.error('Error fetching certificate:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 