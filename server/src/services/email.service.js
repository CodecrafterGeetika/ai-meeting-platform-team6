import _import1 from 'axios';
const axios = _import1;
import _import2 from '../config/config.js';
const config = _import2;
import _import3 from '../config/logger.js';
const logger = _import3;

/**
 * Standard Premium HTML Email Template
 * @param {string} title
 * @param {string} bodyHtml
 * @returns {string}
 */
const getEmailHtml = (title, bodyHtml) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      color: #0f172a;
      margin: 0;
      padding: 0;
    }
    .wrapper {
      padding: 40px 20px;
      background-color: #f8fafc;
    }
    .container {
      max-width: 500px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
    }
    .logo {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 24px;
      text-align: center;
      letter-spacing: -0.5px;
    }
    .title {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 16px;
      color: #0f172a;
      text-align: center;
    }
    .content {
      font-size: 15px;
      line-height: 1.6;
      color: #475569;
    }
    .code-box {
      background-color: #f1f5f9;
      border-radius: 12px;
      padding: 16px 24px;
      font-size: 32px;
      font-weight: 700;
      letter-spacing: 6px;
      text-align: center;
      margin: 24px 0;
      color: #0f172a;
    }
    .btn-container {
      text-align: center;
      margin: 24px 0;
    }
    .btn {
      display: inline-block;
      background-color: #0f172a;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 15px;
    }
    .footer {
      font-size: 12px;
      color: #94a3b8;
      text-align: center;
      margin-top: 32px;
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="logo">🎥 IntellMeet</div>
      <div class="title">${title}</div>
      <div class="content">
        ${bodyHtml}
      </div>
      <div class="footer">
        © ${new Date().getFullYear()} IntellMeet. All rights reserved.
      </div>
    </div>
  </div>
</body>
</html>
`;

/**
 * Send an email using Brevo API
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @param {string} [html]
 * @returns {Promise}
 */
const sendEmail = async (to, subject, text, html) => {
  if (config.env === 'test') {
    return;
  }
  
  if (!config.email.brevoApiKey) {
    logger.warn('Brevo API key not found. Email not sent.');
    return;
  }

  const payload = {
    sender: { email: config.email.from, name: 'IntellMeet Team' },
    to: [{ email: to }],
    subject,
    htmlContent: html || `<p>${text.replace(/\n/g, '<br>')}</p>`,
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
  const subject = 'Reset Your IntellMeet Password';
  const resetPasswordUrl = `${config.frontendUrl}/reset-password?token=${token}`;
  
  const text = `Hello,\n\nWe received a request to reset your password. Click on this link to proceed:\n${resetPasswordUrl}\n\nThis link will expire in 10 minutes.\n\nIf you did not request this, please ignore this email.\n\nThanks,\nIntellMeet Team`;
  
  const html = getEmailHtml(
    'Reset Your Password',
    `
    <p>Hello,</p>
    <p>We received a request to reset your password. Click the button below to create a new password:</p>
    <div class="btn-container">
      <a href="${resetPasswordUrl}" class="btn" target="_blank">Reset Password</a>
    </div>
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; font-size: 13px; color: #94a3b8;">${resetPasswordUrl}</p>
    <p>This link will expire in 10 minutes.</p>
    <p>If you did not request a password reset, please ignore this email.</p>
    <p>Thanks,<br><strong>IntellMeet Team</strong></p>
    `
  );

  await sendEmail(to, subject, text, html);
};

/**
 * Send verification email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendVerificationEmail = async (to, token) => {
  const subject = 'Verify Your IntellMeet Email';
  const verificationEmailUrl = `${config.frontendUrl}/verify-email?token=${token}`;
  
  const text = `Hello,\n\nThank you for signing up for IntellMeet. Click on this link to verify your email address:\n${verificationEmailUrl}\n\nIf you did not create an account, please ignore this email.\n\nThanks,\nIntellMeet Team`;
  
  const html = getEmailHtml(
    'Verify Your Email Address',
    `
    <p>Hello,</p>
    <p>Thank you for signing up for IntellMeet. Click the button below to verify your email address and activate your account:</p>
    <div class="btn-container">
      <a href="${verificationEmailUrl}" class="btn" target="_blank">Verify Email</a>
    </div>
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; font-size: 13px; color: #94a3b8;">${verificationEmailUrl}</p>
    <p>If you did not create an account, please ignore this email.</p>
    <p>Thanks,<br><strong>IntellMeet Team</strong></p>
    `
  );

  await sendEmail(to, subject, text, html);
};

/**
 * Send OTP email
 * @param {string} to
 * @param {string} otp
 * @returns {Promise}
 */
const sendOTPEmail = async (to, otp) => {
  const subject = 'Your IntellMeet Verification Code';
  
  const text = `Hello,\n\nYour verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this code, please ignore this email.\n\nThanks,\nIntellMeet Team`;
  
  const html = getEmailHtml(
    'Verify Your Identity',
    `
    <p>Hello,</p>
    <p>Your one-time verification code is:</p>
    <div class="code-box">${otp}</div>
    <p>This code will expire in 10 minutes.</p>
    <p>If you did not request this code, please ignore this email.</p>
    <p>Thanks,<br><strong>IntellMeet Team</strong></p>
    `
  );

  await sendEmail(to, subject, text, html);
};

export default {
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendOTPEmail,
};
