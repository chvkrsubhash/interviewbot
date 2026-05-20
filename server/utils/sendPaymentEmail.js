const { sendMail } = require('../utils/email');
const { generateReceipt } = require('../utils/pdfReceipt');

/**
 * Send a payment confirmation email with receipt PDF attached.
 * @param {Object} payment - Payment model instance (includes userEmail, userName, planName, amount, status, id).
 */
async function sendPaymentEmail(payment) {
  try {
    const pdfBuffer = await generateReceipt(payment);
    const attachments = [{
      filename: `receipt_${payment.id}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf'
    }];

    const html = `
      <p>Hi ${payment.userName},</p>
      <p>Thank you for your payment. Your transaction was successful.</p>
      <p><strong>Plan:</strong> ${payment.planName}<br/>
      <strong>Amount:</strong> ₹${(payment.amount / 100).toFixed(2)}<br/>
      <strong>Status:</strong> ${payment.status}</p>
      <p>Please find your receipt attached.</p>
      <p>Best regards,<br/>PrepAI Team</p>
    `;

    await sendMail(payment.userEmail, 'Your PrepAI Payment Receipt', html, attachments);
  } catch (err) {
    console.error('Failed to send payment email:', err.message);
    // Continue without throwing – email failure shouldn't block payment flow
  }
}

module.exports = { sendPaymentEmail };
