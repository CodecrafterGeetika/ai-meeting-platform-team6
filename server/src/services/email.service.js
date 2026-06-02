import _import1 from 'axios';
const axios = _import1;
import _import2 from '../config/config.js';
const config = _import2;
import _import3 from '../config/logger.js';
const logger = _import3;

/**
 * Send an email using Brevo API
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @returns {Promise}
 */
const sendEmail = async (to, subject, text) => {
  if (config.env === 'test') {
    return;
  }
  
  if (!config.email.brevoApiKey) {
    logger.warn('Brevo API key not found. Email not sent.');
    return;
  }

  const payload = {
    sender: { email: config.email.from, name: 'AI Meeting Platform' },
    to: [{ email: to }],
    subject,
    htmlContent: `<p>${text.replace(/\n/g, '<br>')}</p>`,
    textContent: text
  };

  try {
    const response = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
      headers: {
        'api-key': config.email.brevoApiKey,
        'Content-Type': 'application/json',
      },
    });
    logger.info(`Email sent successfully to ${to}. MessageId: ${response.data.messageId}`);
  } catch (error) {
    const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
    logger.error(`Error sending email to ${to}: ${errorMsg}`);
  }
};

/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (to, token) => {
  const subject = 'Reset password';
  const resetPasswordUrl = `http://link-to-app/reset-password?token=${token}`;
  const text = `Dear user,
To reset your password, click on this link: ${resetPasswordUrl}
If you did not request any password resets, then ignore this email.`;
  await sendEmail(to, subject, text);
};

/**
 * Send verification email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendVerificationEmail = async (to, token) => {
  const subject = 'Email Verification';
  const verificationEmailUrl = `http://link-to-app/verify-email?token=${token}`;
  const text = `Dear user,
To verify your email, click on this link: ${verificationEmailUrl}
If you did not create an account, then ignore this email.`;
  await sendEmail(to, subject, text);
};

/**
 * Send OTP email
 * @param {string} to
 * @param {string} otp
 * @returns {Promise}
 */
const sendOTPEmail = async (to, otp) => {
  const subject = 'Your Verification Code';
  const text = `Dear user,\n\nYour one-time verification code is: ${otp}\n\nThis code is valid for 10 minutes.\nIf you did not request this, please ignore this email.`;
  await sendEmail(to, subject, text);
};

export default {
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendOTPEmail,
};
