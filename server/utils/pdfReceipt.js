const PDFDocument = require('pdfkit');

/**
 * Generate a professional PDF receipt for a payment.
 * @param {Object} payment - Payment object containing details.
 * @returns {Promise<Buffer>}
 */
function generateReceipt(payment) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 0, size: 'A4' });
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const W = doc.page.width;   // 595
    const H = doc.page.height;  // 842

    // ── Palette (corporate, restrained) ─────────────────────────────────────
    const INK        = '#1A1A2E';   // near-black for headings
    const BODY       = '#2D2D2D';   // body text
    const MUTED      = '#6B7280';   // labels / secondary
    const ACCENT     = '#1B4F72';   // deep navy — single brand colour
    const RULE       = '#D1D5DB';   // horizontal rules
    const ROW_ALT    = '#F9FAFB';   // alternating table row
    const SUCCESS_BG = '#F0FDF4';
    const SUCCESS_FG = '#166534';
    const WARN_BG    = '#FFFBEB';
    const WARN_FG    = '#92400E';
    const WHITE      = '#FFFFFF';

    // ── Helpers ──────────────────────────────────────────────────────────────
    const hRule = (yPos, lx = 50, rx = W - 50, color = RULE, w = 0.5) => {
      doc.moveTo(lx, yPos).lineTo(rx, yPos).strokeColor(color).lineWidth(w).stroke();
    };

    const label = (txt, x, y, opts = {}) =>
      doc.fillColor(MUTED).fontSize(8).font('Helvetica')
         .text(txt.toUpperCase(), x, y, { characterSpacing: 0.8, ...opts });

    const value = (txt, x, y, opts = {}) =>
      doc.fillColor(BODY).fontSize(10.5).font('Helvetica')
         .text(txt, x, y, opts);

    // ── Top navy bar (thin, tasteful) ────────────────────────────────────────
    doc.rect(0, 0, W, 4).fill(ACCENT);

    // ── Letterhead ───────────────────────────────────────────────────────────
    // Company name — left
    doc.fillColor(INK).fontSize(15).font('Helvetica-Bold')
       .text('SPSECURELABS.', 50, 30);

    doc.fillColor(MUTED).fontSize(8.5).font('Helvetica')
       .text('https://spsecurelabs.tech/', 50, 50);

    // "RECEIPT" stamp — right
    doc.fillColor(ACCENT).fontSize(22).font('Helvetica-Bold')
       .text('RECEIPT', W - 160, 28, { width: 110, align: 'right' });

    doc.fillColor(MUTED).fontSize(8.5).font('Helvetica')
       .text(`No. ${payment.id}`, W - 160, 54, { width: 110, align: 'right' });

    // ── Full-width rule under letterhead ─────────────────────────────────────
    hRule(72, 50, W - 50, ACCENT, 1);

    // ── Receipt Meta row ─────────────────────────────────────────────────────
    const metaY = 84;
    const issuedDate = new Date().toLocaleDateString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric',
    });

    label('Date of Issue', 50, metaY);
    value(issuedDate, 50, metaY + 11);

    label('Payment Status', 210, metaY);
    // Status pill
    const isPaid       = payment.status?.toLowerCase() === 'paid';
    const pillBg       = isPaid ? SUCCESS_BG : WARN_BG;
    const pillFg       = isPaid ? SUCCESS_FG : WARN_FG;
    const statusText   = (payment.status || 'Unknown').toUpperCase();
    doc.roundedRect(210, metaY + 9, 68, 16, 3).fill(pillBg);
    doc.fillColor(pillFg).fontSize(8).font('Helvetica-Bold')
       .text(statusText, 210, metaY + 13, { width: 68, align: 'center', characterSpacing: 0.5 });

    label('Payment Mode', 360, metaY);
    value(payment.paymentMode || 'Online Transfer', 360, metaY + 11);

    hRule(125);

    // ── Bill To / Bill From ───────────────────────────────────────────────────
    const billY = 137;

    label('Bill To', 50, billY);
    doc.fillColor(INK).fontSize(12).font('Helvetica-Bold')
       .text(payment.userName || 'Customer', 50, billY + 13);
    doc.fillColor(MUTED).fontSize(9.5).font('Helvetica')
       .text(payment.userEmail || '', 50, billY + 29);

    label('Bill From', W - 200, billY);
    doc.fillColor(INK).fontSize(12).font('Helvetica-Bold')
       .text('Your Company Pvt. Ltd.', W - 200, billY + 13, { width: 150, align: 'right' });
    doc.fillColor(MUTED).fontSize(9.5).font('Helvetica')
       .text('GST: 29ABCDE1234F1Z5', W - 200, billY + 29, { width: 150, align: 'right' });

    hRule(195);

    // ── Line Items Table ──────────────────────────────────────────────────────
    // Header row
    const tY        = 203;
    const col       = { desc: 50, hsn: 290, qty: 370, rate: 430, amt: 490 };

    doc.rect(50, tY, W - 100, 20).fill('#F3F4F6');
    doc.fillColor(INK).fontSize(8).font('Helvetica-Bold');
    const thOpts = { characterSpacing: 0.5 };
    doc.text('DESCRIPTION',      col.desc + 6, tY + 6, thOpts);
    doc.text('HSN/SAC',          col.hsn,      tY + 6, thOpts);
    doc.text('QTY',              col.qty,      tY + 6, thOpts);
    doc.text('UNIT PRICE',       col.rate,     tY + 6, thOpts);
    doc.text('AMOUNT',           col.amt,      tY + 6, { ...thOpts, width: W - 50 - col.amt, align: 'right' });

    // Single line item
    const itemY = tY + 26;
    doc.rect(50, itemY - 4, W - 100, 26).fill(WHITE);
    value(payment.planName || 'Subscription Plan', col.desc + 6, itemY);
    value('998315',                                 col.hsn,      itemY);
    value('1',                                      col.qty,      itemY);
    const unitPrice = `₹${(payment.amount / 100).toFixed(2)}`;
    value(unitPrice, col.rate, itemY);
    value(unitPrice, col.amt, itemY, { width: W - 50 - col.amt, align: 'right' });

    hRule(itemY + 28, 50, W - 50);

    // Subtotal / Tax / Total block
    const summaryX  = W - 230;
    const summaryLX = summaryX;
    const summaryVX = W - 50;
    let   sy        = itemY + 36;
    const lineH     = 20;

    const summaryRow = (lbl, val, bold = false) => {
      doc.fillColor(MUTED).fontSize(9).font(bold ? 'Helvetica-Bold' : 'Helvetica')
         .text(lbl, summaryLX, sy, { width: 120 });
      doc.fillColor(bold ? INK : BODY).fontSize(9).font(bold ? 'Helvetica-Bold' : 'Helvetica')
         .text(val, summaryLX, sy, { width: summaryVX - summaryLX, align: 'right' });
      sy += lineH;
    };

    const base   = payment.amount / 100;
    const gst    = +(base * 0.18).toFixed(2);
    const total  = +(base + gst).toFixed(2);

    summaryRow('Subtotal (excl. GST)',  `₹${base.toFixed(2)}`);
    summaryRow('CGST @ 9%',            `₹${(gst / 2).toFixed(2)}`);
    summaryRow('SGST @ 9%',            `₹${(gst / 2).toFixed(2)}`);

    hRule(sy + 2, summaryLX, W - 50);
    sy += 8;

    // Total row — highlighted
    doc.rect(summaryLX - 8, sy - 4, W - 50 - summaryLX + 18, 26).fill('#EFF6FF');
    summaryRow('Total Amount Due', `₹${total.toFixed(2)}`, true);

    // ── Paid stamp (if paid) ─────────────────────────────────────────────────
    if (isPaid) {
      const stampX = 58, stampY = itemY + 30;
      doc.save();
      doc.rotate(-18, { origin: [stampX + 38, stampY + 20] });
      doc.roundedRect(stampX, stampY, 90, 36, 4)
         .lineWidth(2).strokeColor('#166534').stroke();
      doc.fillColor('#166534').fontSize(18).font('Helvetica-Bold')
         .text('PAID', stampX, stampY + 9, { width: 90, align: 'center', characterSpacing: 3 });
      doc.restore();
    }

    // ── Notes ────────────────────────────────────────────────────────────────
    const notesY = sy + 30;
    hRule(notesY, 50, W - 50);

    doc.fillColor(INK).fontSize(9).font('Helvetica-Bold')
       .text('Notes', 50, notesY + 10);
    doc.fillColor(MUTED).fontSize(9).font('Helvetica')
       .text(
         'This is a computer-generated receipt and is valid without a physical signature. ' +
         'For queries, please quote the receipt number above and contact support@yourcompany.com.',
         50, notesY + 24, { width: W - 100, lineGap: 3 }
       );

    // ── Page Footer ──────────────────────────────────────────────────────────
    doc.rect(0, H - 36, W, 36).fill('#F3F4F6');
    hRule(H - 36, 0, W, RULE, 0.5);

    doc.fillColor(MUTED).fontSize(8).font('Helvetica')
       .text(
         'SPSECURELABS. Ltd.    https://spsecurelabs.tech/',
         50, H - 22, { width: W - 100, align: 'center' }
       );

    doc.end();
  });
}

module.exports = { generateReceipt };