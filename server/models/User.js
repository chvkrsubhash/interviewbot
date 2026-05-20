const { db } = require('../config/firebase');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Global helper to apply Sequelize where queries to Firestore
function applyQuery(collectionRef, queryObj = {}) {
  let q = collectionRef;
  if (queryObj.where) {
    Object.entries(queryObj.where).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'Object') {
          // Handle operator objects like [Op.ne], etc.
          Object.getOwnPropertySymbols(value).concat(Object.keys(value)).forEach(sym => {
            const symStr = String(sym);
            if (symStr.includes('ne') || symStr.includes('!=') || symStr.includes('Op.ne')) {
              q = q.where(key, '!=', value[sym]);
            } else if (symStr.includes('in') || symStr.includes('Op.in')) {
              q = q.where(key, 'in', value[sym]);
            }
          });
        } else {
          q = q.where(key, '==', value);
        }
      }
    });
  }
  if (queryObj.order) {
    const orderItem = queryObj.order[0];
    if (orderItem && Array.isArray(orderItem)) {
      const [field, direction] = orderItem;
      q = q.orderBy(field, direction && direction.toLowerCase() === 'desc' ? 'desc' : 'asc');
    }
  }
  if (queryObj.limit !== undefined) {
    q = q.limit(Number(queryObj.limit));
  }
  return q;
}

class User {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.name = data.name || '';
    this.email = data.email || '';
    this.password = data.password || '';
    this.role = data.role || 'candidate';
    this.streak = data.streak !== undefined ? Number(data.streak) : 0;
    this.lastActive = data.lastActive ? new Date(data.lastActive) : new Date();
    this.isBanned = data.isBanned !== undefined ? Boolean(data.isBanned) : false;
    this.username = data.username || null;
    this.education = Array.isArray(data.education) ? data.education : [];
    this.skills = Array.isArray(data.skills) ? data.skills : [];
    this.certifications = Array.isArray(data.certifications) ? data.certifications : [];
    this.projects = Array.isArray(data.projects) ? data.projects : [];
    this.otp = data.otp || null;
    this.otpExpiry = data.otpExpiry ? new Date(data.otpExpiry) : null;
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();

    // Cache initial password to check for changes
    this._originalPassword = this.password;
  }

  // Mimic Sequelize instance.changed('password')
  changed(field) {
    if (field === 'password') {
      return this.password !== this._originalPassword;
    }
    return false;
  }

  async comparePassword(enteredPassword) {
    try {
      return await bcrypt.compare(enteredPassword, this.password);
    } catch (err) {
      return false;
    }
  }

  // Save changes back to Firestore
  async save() {
    // Hash password if not already hashed
    const isAlreadyHashed = this.password && (this.password.startsWith('$2a$') || this.password.startsWith('$2b$'));

    if (this.password && !isAlreadyHashed) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }

    this.updatedAt = new Date();
    const docData = this.toJSON();
    
    await db.collection('users').doc(this.id).set(docData, { merge: true });
    this._originalPassword = this.password; // Sync original password
    return this;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      password: this.password,
      role: this.role,
      streak: this.streak,
      lastActive: this.lastActive.toISOString(),
      isBanned: this.isBanned,
      username: this.username,
      education: this.education,
      skills: this.skills,
      certifications: this.certifications,
      projects: this.projects,
      otp: this.otp,
      otpExpiry: this.otpExpiry ? this.otpExpiry.toISOString() : null,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }

  // Mimic Sequelize model.toJSON
  getDataValue(field) {
    return this[field];
  }
}

// ── Static Emulated Queries ──────────────────────────────────────────────────

User.findOne = async function (queryObj = {}) {
  try {
    const q = applyQuery(db.collection('users'), queryObj);
    const snap = await q.limit(1).get();
    if (snap.empty) return null;
    return new User({ id: snap.docs[0].id, ...snap.docs[0].data() });
  } catch (error) {
    console.error('Error in User.findOne:', error.message);
    throw error;
  }
};

User.findByPk = async function (id) {
  if (!id) return null;
  try {
    const doc = await db.collection('users').doc(String(id)).get();
    if (!doc.exists) return null;
    return new User({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error in User.findByPk:', error.message);
    throw error;
  }
};

User.findAll = async function (queryObj = {}) {
  try {
    const q = applyQuery(db.collection('users'), queryObj);
    const snap = await q.get();
    return snap.docs.map(doc => new User({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error in User.findAll:', error.message);
    throw error;
  }
};

User.create = async function (data = {}) {
  try {
    const user = new User(data);
    await user.save();
    return user;
  } catch (error) {
    console.error('Error in User.create:', error.message);
    throw error;
  }
};

User.count = async function (queryObj = {}) {
  try {
    const q = applyQuery(db.collection('users'), queryObj);
    const snap = await q.get();
    return snap.size;
  } catch (error) {
    console.error('Error in User.count:', error.message);
    throw error;
  }
};

User.applyQuery = applyQuery; // Export query builder for reuse in other models

module.exports = User;
