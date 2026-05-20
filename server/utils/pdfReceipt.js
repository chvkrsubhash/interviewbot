const PDFDocument = require('pdfkit');

/**
 * Generate a PDF receipt for a payment.
 * @param {Object} payment - Payment object containing details.
 * @returns {Promise<Buffer>} - Promise that resolves with the PDF data as a Buffer.
 */
function generateReceipt(payment) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });
    doc.on('error', reject);

    // Header
    doc.fontSize(20).text('Payment Receipt', { align: 'center' });
    doc.moveDown();

    // Payment details
    doc.fontSize(12);
    doc.text(`Receipt ID: ${payment.id}`);
    doc.text(`Date: ${new Date().toLocaleString()}`);
    doc.text(`Plan: ${payment.planName}`);
    doc.text(`Amount: ₹${(payment.amount / 100).toFixed(2)}`);
    doc.text(`Status: ${payment.status}`);
    doc.moveDown();
    doc.text(`Paid by: ${payment.userName} <${payment.userEmail}>`);

    doc.end();
  });
}

module.exports = { generateReceipt };
