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

    // ── Palette ──────────────────────────────────────────────────────────────
    const INK        = '#1A1A2E';
    const BODY       = '#2D2D2D';
    const MUTED      = '#6B7280';
    const ACCENT     = '#1B4F72';
    const RULE       = '#D1D5DB';
    const SUCCESS_BG = '#F0FDF4';
    const SUCCESS_FG = '#166534';
    const WARN_BG    = '#FFFBEB';
    const WARN_FG    = '#92400E';
    const WHITE      = '#FFFFFF';

    // ── Helpers ───────────────────────────────────────────────────────────────
    const hRule = (yPos, lx = 50, rx = W - 50, color = RULE, w = 0.5) => {
      doc.moveTo(lx, yPos).lineTo(rx, yPos).strokeColor(color).lineWidth(w).stroke();
    };
    const label = (txt, x, y, opts = {}) =>
      doc.fillColor(MUTED).fontSize(8).font('Helvetica')
         .text(txt.toUpperCase(), x, y, { characterSpacing: 0.8, ...opts });
    const value = (txt, x, y, opts = {}) =>
      doc.fillColor(BODY).fontSize(10.5).font('Helvetica')
         .text(String(txt), x, y, opts);

    // ── Fee calculations ──────────────────────────────────────────────────────
    const base         = +(payment.amount / 100).toFixed(2);
    const convenienceFee = +(base * 0.011).toFixed(2);   // 1.1%
    const platformFee    = +(base * 0.001).toFixed(2);   // 0.1%
    const total          = +(base + convenienceFee + platformFee).toFixed(2);

    // ── Top accent bar ────────────────────────────────────────────────────────
    doc.rect(0, 0, W, 4).fill(ACCENT);

    // ── Letterhead ────────────────────────────────────────────────────────────
    doc.fillColor(INK).fontSize(15).font('Helvetica-Bold')
       .text('SPSecureLabs', 50, 30);
    doc.fillColor(MUTED).fontSize(8.5).font('Helvetica')
       .text('support@spsecurelabs.tech  ·  www.spsecurelabs.tech', 50, 50);

    // RECEIPT label + receipt ID — right
    doc.fillColor(ACCENT).fontSize(22).font('Helvetica-Bold')
       .text('RECEIPT', W - 160, 28, { width: 110, align: 'right' });
    doc.fillColor(MUTED).fontSize(8.5).font('Helvetica')
       .text(`No. ${payment.id}`, W - 160, 54, { width: 110, align: 'right' });

    hRule(72, 50, W - 50, ACCENT, 1);

    // ── Meta row ──────────────────────────────────────────────────────────────
    const metaY = 84;
    const issuedDate = new Date().toLocaleDateString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric',
    });

    label('Date of Issue', 50, metaY);
    value(issuedDate, 50, metaY + 11);

    label('Receipt ID', 210, metaY);
    doc.fillColor(INK).fontSize(10).font('Helvetica-Bold')
       .text(payment.id, 210, metaY + 11);

    label('Payment Status', 380, metaY);
    const isPaid     = payment.status?.toLowerCase() === 'paid';
    const pillBg     = isPaid ? SUCCESS_BG : WARN_BG;
    const pillFg     = isPaid ? SUCCESS_FG : WARN_FG;
    const statusText = (payment.status || 'Unknown').toUpperCase();
    doc.roundedRect(380, metaY + 9, 68, 16, 3).fill(pillBg);
    doc.fillColor(pillFg).fontSize(8).font('Helvetica-Bold')
       .text(statusText, 380, metaY + 13, { width: 68, align: 'center', characterSpacing: 0.5 });

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
       .text('SPSecureLabs', W - 200, billY + 13, { width: 150, align: 'right' });
    doc.fillColor(MUTED).fontSize(9.5).font('Helvetica')
       .text('Receipt ID: ' + payment.id, W - 200, billY + 29, { width: 150, align: 'right' });

    hRule(195);

    // ── Line Items Table ──────────────────────────────────────────────────────
    const tY  = 203;
    const col = { desc: 50, qty: 340, rate: 400, amt: 480 };

    // Table header
    doc.rect(50, tY, W - 100, 20).fill('#F3F4F6');
    doc.fillColor(INK).fontSize(8).font('Helvetica-Bold');
    const th = { characterSpacing: 0.5 };
    doc.text('DESCRIPTION',  col.desc + 6, tY + 6, th);
    doc.text('QTY',          col.qty,      tY + 6, th);
    doc.text('UNIT PRICE',   col.rate,     tY + 6, th);
    doc.text('AMOUNT',       col.amt,      tY + 6, { ...th, width: W - 50 - col.amt, align: 'right' });

    // Row 1 — Plan
    const r1Y = tY + 26;
    doc.rect(50, r1Y - 4, W - 100, 26).fill(WHITE);
    value(payment.planName || 'Subscription Plan', col.desc + 6, r1Y);
    value('1',                   col.qty,  r1Y);
    value(`₹${base.toFixed(2)}`, col.rate, r1Y);
    value(`₹${base.toFixed(2)}`, col.amt,  r1Y, { width: W - 50 - col.amt, align: 'right' });

    // Row 2 — Convenience Fee
    const r2Y = r1Y + 28;
    doc.rect(50, r2Y - 4, W - 100, 26).fill('#F9FAFB');
    value('Convenience Fee (1.1%)', col.desc + 6, r2Y);
    value('1',                       col.qty,  r2Y);
    value(`₹${convenienceFee.toFixed(2)}`, col.rate, r2Y);
    value(`₹${convenienceFee.toFixed(2)}`, col.amt,  r2Y, { width: W - 50 - col.amt, align: 'right' });

    // Row 3 — Platform Fee
    const r3Y = r2Y + 28;
    doc.rect(50, r3Y - 4, W - 100, 26).fill(WHITE);
    value('Platform Fee (0.1%)', col.desc + 6, r3Y);
    value('1',                    col.qty,  r3Y);
    value(`₹${platformFee.toFixed(2)}`, col.rate, r3Y);
    value(`₹${platformFee.toFixed(2)}`, col.amt,  r3Y, { width: W - 50 - col.amt, align: 'right' });

    hRule(r3Y + 28, 50, W - 50);

    // ── Summary block ─────────────────────────────────────────────────────────
    const summaryLX = W - 230;
    const summaryVX = W - 50;
    let sy          = r3Y + 36;
    const lineH     = 20;

    const summaryRow = (lbl, val, bold = false, highlight = false) => {
      if (highlight) {
        doc.rect(summaryLX - 8, sy - 4, W - 50 - summaryLX + 18, 26).fill('#EFF6FF');
      }
      doc.fillColor(MUTED).fontSize(9).font(bold ? 'Helvetica-Bold' : 'Helvetica')
         .text(lbl, summaryLX, sy, { width: 120 });
      doc.fillColor(bold ? INK : BODY).fontSize(9).font(bold ? 'Helvetica-Bold' : 'Helvetica')
         .text(val, summaryLX, sy, { width: summaryVX - summaryLX, align: 'right' });
      sy += lineH;
    };

    summaryRow('Plan Amount',       `₹${base.toFixed(2)}`);
    summaryRow('Convenience Fee',   `₹${convenienceFee.toFixed(2)}`);
    summaryRow('Platform Fee',      `₹${platformFee.toFixed(2)}`);
    hRule(sy + 2, summaryLX, W - 50);
    sy += 8;
    summaryRow('Total Amount Paid', `₹${total.toFixed(2)}`, true, true);

    // ── PAID stamp ────────────────────────────────────────────────────────────
    if (isPaid) {
      const stampX = 58, stampY = r1Y + 14;
      doc.save();
      doc.rotate(-18, { origin: [stampX + 38, stampY + 20] });
      doc.roundedRect(stampX, stampY, 90, 36, 4)
         .lineWidth(2).strokeColor('#166534').stroke();
      doc.fillColor('#166534').fontSize(18).font('Helvetica-Bold')
         .text('PAID', stampX, stampY + 9, { width: 90, align: 'center', characterSpacing: 3 });
      doc.restore();
    }

    // ── Payment Mode ──────────────────────────────────────────────────────────
    const pmY = sy + 10;
    label('Payment Mode', 50, pmY);
    value(payment.paymentMode || 'Online Transfer', 50, pmY + 11);

    // ── Notes ─────────────────────────────────────────────────────────────────
    const notesY = pmY + 42;
    hRule(notesY, 50, W - 50);

    doc.fillColor(INK).fontSize(9).font('Helvetica-Bold')
       .text('Notes', 50, notesY + 10);
    doc.fillColor(MUTED).fontSize(9).font('Helvetica')
       .text(
         'This is a computer-generated receipt and is valid without a physical signature. ' +
         'For any queries, please quote Receipt ID ' + payment.id + ' and write to support@spsecurelabs.tech.',
         50, notesY + 24, { width: W - 100, lineGap: 3 }
       );

    // ── Page Footer ───────────────────────────────────────────────────────────
    doc.rect(0, H - 36, W, 36).fill('#F3F4F6');
    hRule(H - 36, 0, W, RULE, 0.5);
    doc.fillColor(MUTED).fontSize(8).font('Helvetica')
       .text(
         'SPSecureLabs  ·  support@spsecurelabs.tech  ·  www.spsecurelabs.tech',
         50, H - 22, { width: W - 100, align: 'center' }
       );

    doc.end();
  });
}

module.exports = { generateReceipt };
