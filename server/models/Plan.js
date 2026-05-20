const { db } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');
const { applyQuery } = require('./User');

class Plan {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.name = data.name || '';
    this.description = data.description || '';
    this.price = data.price !== undefined ? Number(data.price) : 0; // in paise
    this.currency = data.currency || 'INR';
    this.billingInterval = data.billingInterval || 'monthly';
    this.interviewsAllowed = data.interviewsAllowed !== undefined ? Number(data.interviewsAllowed) : 5;
    
    // Parse features array
    if (typeof data.features === 'string') {
      try {
        this.features = JSON.parse(data.features);
      } catch (e) {
        this.features = [];
      }
    } else {
      this.features = Array.isArray(data.features) ? data.features : [];
    }

    this.isActive = data.isActive !== undefined ? Boolean(data.isActive) : true;
    this.badgeColor = data.badgeColor || 'primary';
    this.isPopular = data.isPopular !== undefined ? Boolean(data.isPopular) : false;
    this.sortOrder = data.sortOrder !== undefined ? Number(data.sortOrder) : 0;

    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
  }

  async save() {
    this.updatedAt = new Date();
    const docData = this.toJSON();
    await db.collection('plans').doc(this.id).set(docData, { merge: true });
    return this;
  }

  async destroy() {
    await db.collection('plans').doc(this.id).delete();
    return this;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      price: this.price,
      currency: this.currency,
      billingInterval: this.billingInterval,
      interviewsAllowed: this.interviewsAllowed,
      features: this.features,
      isActive: this.isActive,
      badgeColor: this.badgeColor,
      isPopular: this.isPopular,
      sortOrder: this.sortOrder,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }

  // Emulate Sequelize model parsing
  getDataValue(field) {
    return this[field];
  }
}

// ── Static Emulated Queries ──────────────────────────────────────────────────

Plan.findByPk = async function (id) {
  if (!id) return null;
  try {
    const doc = await db.collection('plans').doc(String(id)).get();
    if (!doc.exists) return null;
    return new Plan({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error in Plan.findByPk:', error.message);
    throw error;
  }
};

Plan.findOne = async function (queryObj = {}) {
  try {
    const q = applyQuery(db.collection('plans'), queryObj);
    const snap = await q.limit(1).get();
    if (snap.empty) return null;
    return new Plan({ id: snap.docs[0].id, ...snap.docs[0].data() });
  } catch (error) {
    console.error('Error in Plan.findOne:', error.message);
    throw error;
  }
};

Plan.findAll = async function (queryObj = {}) {
  try {
    const q = applyQuery(db.collection('plans'), queryObj);
    const snap = await q.get();
    return snap.docs.map(doc => new Plan({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error in Plan.findAll:', error.message);
    throw error;
  }
};

Plan.create = async function (data = {}) {
  try {
    const p = new Plan(data);
    await p.save();
    return p;
  } catch (error) {
    console.error('Error in Plan.create:', error.message);
    throw error;
  }
};

Plan.count = async function (queryObj = {}) {
  try {
    const q = applyQuery(db.collection('plans'), queryObj);
    const snap = await q.get();
    return snap.size;
  } catch (error) {
    console.error('Error in Plan.count:', error.message);
    throw error;
  }
};

Plan.bulkCreate = async function (plansArray = []) {
  try {
    const batch = db.batch();
    const plansInstances = [];

    plansArray.forEach(pData => {
      const plan = new Plan(pData);
      plansInstances.push(plan);
      const docRef = db.collection('plans').doc(plan.id);
      batch.set(docRef, plan.toJSON());
    });

    await batch.commit();
    return plansInstances;
  } catch (error) {
    console.error('Error in Plan.bulkCreate:', error.message);
    throw error;
  }
};

module.exports = Plan;
