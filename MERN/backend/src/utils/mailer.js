const nodemailer = require('nodemailer');

/**
 * Create transporter for sending emails
 */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send email
 * @param {Object} mailOptions - {to, subject, html}
 */
const sendEmail = async (mailOptions) => {
  try {
    const defaultFrom = process.env.EMAIL_USER;
    const from = mailOptions.from || defaultFrom;

    const info = await transporter.sendMail({
      from,
      ...mailOptions,
    });

    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email error:', error);
    throw error;
  }
};

/**
 * Send registration confirmation email
 */
const sendRegistrationEmail = async (email, fullName, verificationLink) => {
  const html = `
    <h2>Welcome to PostNFind!</h2>
    <p>Hi ${fullName},</p>
    <p>Thank you for registering. Please verify your email by clicking the link below:</p>
    <a href="${verificationLink}">Verify Email</a>
    <p>This link expires in 24 hours.</p>
  `;

  return sendEmail({
    to: email,
    subject: 'Verify Your PostNFind Email',
    html,
  });
};

/**
 * Send finder assignment notification
 */
const sendAssignmentEmail = async (
  finderEmail,
  finderName,
  itemTitle,
  assignmentDetailsLink
) => {
  const html = `
    <h2>New Assignment!</h2>
    <p>Hi ${finderName},</p>
    <p>Great news! You've been assigned to find: <strong>${itemTitle}</strong></p>
    <p>Check the details and start searching!</p>
    <a href="${assignmentDetailsLink}">View Assignment</a>
  `;

  return sendEmail({
    to: finderEmail,
    subject: `New Assignment: ${itemTitle}`,
    html,
  });
};

/**
 * Send evidence uploaded notification to owner
 */
const sendEvidenceNotificationEmail = async (
  ownerEmail,
  ownerName,
  finderName,
  itemTitle
) => {
  const html = `
    <h2>Evidence Uploaded!</h2>
    <p>Hi ${ownerName},</p>
    <p><strong>${finderName}</strong> has uploaded evidence for: <strong>${itemTitle}</strong></p>
    <p>Please verify the evidence and confirm if it matches your item.</p>
  `;

  return sendEmail({
    to: ownerEmail,
    subject: `Evidence Uploaded for ${itemTitle}`,
    html,
  });
};

/**
 * Send item confirmed notification to finder
 */
const sendItemConfirmedEmail = async (
  finderEmail,
  finderName,
  itemTitle,
  reward
) => {
  const html = `
    <h2>Item Confirmed!</h2>
    <p>Hi ${finderName},</p>
    <p>Great! The owner has confirmed you found the item: <strong>${itemTitle}</strong></p>
    <p>You will receive a reward of <strong>₹${reward}</strong> soon.</p>
  `;

  return sendEmail({
    to: finderEmail,
    subject: `Item Confirmed: ${itemTitle}`,
    html,
  });
};

module.exports = {
  sendEmail,
  sendRegistrationEmail,
  sendAssignmentEmail,
  sendEvidenceNotificationEmail,
  sendItemConfirmedEmail,
};
