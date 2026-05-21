const express = require('express');
const router = express.Router();
const https = require('https');
const crypto = require('crypto');
const { protect } = require('./auth');
const { Payment, Plan, User } = require('../models');
const { sendPaymentEmail } = require('../utils/sendPaymentEmail');

// ─── Razorpay HTTP helpers (no npm package needed) ────────────────────────────

function razorpayRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret || keyId === 'your_razorpay_key_id_here') {
      return reject(new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in server/.env'));
    }

    const authString = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const postData = body ? JSON.stringify(body) : undefined;

    const options = {
      hostname: 'api.razorpay.com',
      port: 443,
      path: `/v1${path}`,
      method,
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json',
        ...(postData && { 'Content-Length': Buffer.byteLength(postData) })
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) return reject(new Error(parsed.error.description || parsed.error.code));
          resolve(parsed);
        } catch (e) {
          reject(new Error('Invalid JSON from Razorpay: ' + data));
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

// ─── Route: Create Razorpay Order ────────────────────────────────────────────

router.post('/create-order', protect, async (req, res) => {
  const { planId } = req.body;
  if (!planId) return res.status(400).json({ message: 'planId is required' });

  try {
    const plan = await Plan.findByPk(planId);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    if (!plan.isActive) return res.status(400).json({ message: 'Plan is no longer available' });
    if (plan.price === 0) return res.status(400).json({ message: 'Free plans do not require payment' });

    const receipt = `prepai_${req.user.id.substring(0, 8)}_${Date.now()}`;

    const razorOrder = await razorpayRequest('POST', '/orders', {
      amount: plan.price,       // in paise already
      currency: 'INR',
      receipt,
      notes: {
        planName: plan.name,
        userId: req.user.id,
        userEmail: req.user.email
      }
    });

    // Create payment record in DB (status: created)
    const payment = await Payment.create({
      userId: req.user.id,
      planId: plan.id,
      planName: plan.name,
      amount: plan.price,
      currency: 'INR',
      razorpayOrderId: razorOrder.id,
      status: 'created',
      userEmail: req.user.email,
      userName: req.user.name
    });

    res.json({
      orderId: razorOrder.id,
      amount: razorOrder.amount,
      currency: razorOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      paymentDbId: payment.id,
      plan: {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        description: plan.description
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to create payment order' });
  }
});

// ─── Route: Verify & Confirm Payment ─────────────────────────────────────────

router.post('/verify', protect, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentDbId } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ message: 'Missing Razorpay payment verification fields' });
  }

  try {
    // Verify HMAC signature using key secret
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const expectedSig = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSig !== razorpay_signature) {
      // Mark as failed
      await Payment.update(
        { status: 'failed', razorpayPaymentId: razorpay_payment_id },
        { where: { razorpayOrderId: razorpay_order_id } }
      );
      return res.status(400).json({ message: 'Payment signature verification failed. Transaction rejected.' });
    }

    // Signature valid — mark as paid
    const payment = await Payment.findOne({ where: { razorpayOrderId: razorpay_order_id } });
    if (!payment) return res.status(404).json({ message: 'Payment record not found' });

    payment.status = 'paid';
    payment.razorpayPaymentId = razorpay_payment_id;
    await payment.save();

    // ✅ Update the user's active plan in the database
    const user = await User.findByPk(req.user.id);
    if (user) {
      user.plan = payment.planId;
      await user.save();
    }

    await sendPaymentEmail(payment);

    res.json({ message: 'Payment verified successfully', payment });
  } catch (error) {
    res.status(500).json({ message: 'Payment verification error', error: error.message });
  }
});

// ─── Route: Get user's payment history ────────────────────────────────────────

router.get('/history', protect, async (req, res) => {
  try {
    const payments = await Payment.findAll({
      where: { userId: req.user.id },
      include: [{ model: Plan, as: 'plan', attributes: ['name', 'price', 'billingInterval'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payment history', error: error.message });
  }
});

// ─── Route: Get all plans (public) ────────────────────────────────────────────

router.get('/plans', async (req, res) => {
  try {
    const plans = await Plan.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC']]
    });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching plans', error: error.message });
  }
});

module.exports = router;
