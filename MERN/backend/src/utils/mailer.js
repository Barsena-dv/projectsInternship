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

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (email, fullName, resetUrl) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
      <h2 style="color: #6366f1;">Reset Your Password</h2>
      <p>Hi ${fullName},</p>
      <p>We received a request to reset your password for your PostNFind account. If you didn't make this request, you can safely ignore this email.</p>
      <p>To reset your password, click the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      <p style="font-size: 0.9em; color: #666;">This link is valid for 10 minutes.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 0.8em; color: #999;">If the button doesn't work, copy and paste this link into your browser: <br>${resetUrl}</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'PostNFind - Password Reset Request',
    html,
  });
};

const sendFinderOtpEmail = async (email, fullName, otpCode) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #0f172a; line-height: 1.6;">
      <h2 style="color: #2563eb;">Finder Email Verification</h2>
      <p>Hi ${fullName},</p>
      <p>Use this one-time code to verify your finder account on PostNFind:</p>
      <div style="font-size: 30px; letter-spacing: 6px; font-weight: 700; color: #111827; padding: 10px 14px; background: #eef2ff; border-radius: 8px; display: inline-block;">${otpCode}</div>
      <p style="margin-top: 14px;">This code expires in 10 minutes.</p>
      <p style="font-size: 12px; color: #64748b;">If you did not initiate this action, you can ignore this email.</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'PostNFind Finder Email Verification Code',
    html,
  });
};

module.exports = {
  sendEmail,
  sendRegistrationEmail,
  sendAssignmentEmail,
  sendEvidenceNotificationEmail,
  sendItemConfirmedEmail,
  sendPasswordResetEmail,
  sendFinderOtpEmail,
};
