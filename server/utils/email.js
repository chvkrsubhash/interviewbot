const nodemailer = require('nodemailer');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function sendMail(to, subject, html, attachments = []) {
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
    attachments,
  };
  return transport.sendMail(mailOptions);
}

module.exports = { sendMail };
