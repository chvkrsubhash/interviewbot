const { db } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');
const { applyQuery } = require('./User');

class Payment {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.userId = data.userId || null;
    this.planId = data.planId || null;
    this.planName = data.planName || '';
    this.amount = data.amount !== undefined ? Number(data.amount) : 0; // in paise
    this.currency = data.currency || 'INR';
    this.razorpayOrderId = data.razorpayOrderId || null;
    this.razorpayPaymentId = data.razorpayPaymentId || null;
    this.razorpaySignature = data.razorpaySignature || null;
    this.status = data.status || 'created';
    this.userEmail = data.userEmail || '';
    this.userName = data.userName || '';

    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();

    // Emulate association field
    this.plan = data.plan || null;
    // Expose user property if queried
    this.user = data.user || null;
  }

  async save() {
    this.updatedAt = new Date();
    const docData = this.toJSON();
    await db.collection('payments').doc(this.id).set(docData, { merge: true });
    return this;
  }

  toJSON() {
    const data = {
      id: this.id,
      userId: this.userId,
      planId: this.planId,
      planName: this.planName,
      amount: this.amount,
      currency: this.currency,
      razorpayOrderId: this.razorpayOrderId,
      razorpayPaymentId: this.razorpayPaymentId,
      razorpaySignature: this.razorpaySignature,
      status: this.status,
      userEmail: this.userEmail,
      userName: this.userName,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
    if (this.plan) {
      data.plan = typeof this.plan.toJSON === 'function' ? this.plan.toJSON() : this.plan;
    }
    if (this.user) {
      data.user = typeof this.user.toJSON === 'function' ? this.user.toJSON() : this.user;
    }
    return data;
  }

  // Emulate Sequelize model parsing
  getDataValue(field) {
    return this[field];
  }
}

// Prefetch associations
async function loadAssociations(payments, queryObj) {
  if (!queryObj.include || payments.length === 0) return;
  
  const includePlan = queryObj.include.some(inc => inc.as === 'plan' || inc.model && inc.model.name === 'Plan');
  const includeUser = queryObj.include.some(inc => inc.as === 'user' || inc.model && inc.model.name === 'User');

  if (includePlan) {
    const PlanModel = require('./Plan');
    await Promise.all(payments.map(async (payment) => {
      if (!payment.planId) {
        payment.plan = null;
        return;
      }
      const doc = await db.collection('plans').doc(payment.planId).get();
      if (doc.exists) {
        payment.plan = new PlanModel({ id: doc.id, ...doc.data() });
      } else {
        payment.plan = null;
      }
    }));
  }

  if (includeUser) {
    const UserModel = require('./User');
    await Promise.all(payments.map(async (payment) => {
      if (!payment.userId) {
        payment.user = null;
        return;
      }
      const doc = await db.collection('users').doc(payment.userId).get();
      if (doc.exists) {
        payment.user = new UserModel({ id: doc.id, ...doc.data() });
      } else {
        payment.user = null;
      }
    }));
  }
}

// ── Static Emulated Queries ──────────────────────────────────────────────────

Payment.findOne = async function (queryObj = {}) {
  try {
    const q = applyQuery(db.collection('payments'), queryObj);
    const snap = await q.limit(1).get();
    if (snap.empty) return null;
    const payment = new Payment({ id: snap.docs[0].id, ...snap.docs[0].data() });
    await loadAssociations([payment], queryObj);
    return payment;
  } catch (error) {
    console.error('Error in Payment.findOne:', error.message);
    throw error;
  }
};

Payment.findAll = async function (queryObj = {}) {
  try {
    const q = applyQuery(db.collection('payments'), queryObj);
    const snap = await q.get();
    const payments = snap.docs.map(doc => new Payment({ id: doc.id, ...doc.data() }));
    await loadAssociations(payments, queryObj);
    return payments;
  } catch (error) {
    console.error('Error in Payment.findAll:', error.message);
    throw error;
  }
};

Payment.create = async function (data = {}) {
  try {
    const p = new Payment(data);
    await p.save();
    return p;
  } catch (error) {
    console.error('Error in Payment.create:', error.message);
    throw error;
  }
};

Payment.sum = async function (field, queryObj = {}) {
  try {
    const q = applyQuery(db.collection('payments'), queryObj);
    const snap = await q.get();
    let sum = 0;
    snap.docs.forEach(doc => {
      const val = doc.data()[field];
      if (val !== undefined && val !== null) {
        sum += Number(val);
      }
    });
    return sum;
  } catch (error) {
    console.error(`Error in Payment.sum for field ${field}:`, error.message);
    throw error;
  }
};

module.exports = Payment;
