const { db } = require('../config/firebase');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Resilient helper to query Firestore without triggering composite index requirements.
// Equality filters on primitive values are performed database-side (leveraging Firestore automatic single-field indexes).
// Complex filters, ordering, and slicing/limits are done in-memory.
async function executeEmulatedQuery(collectionRef, queryObj = {}) {
  let q = collectionRef;
  
  if (queryObj.where) {
    // Only apply the FIRST simple equality filter database-side.
    // This utilizes Firestore's automatic single-field indexes and avoids triggering any composite index requirement.
    // All other filters, sorting, and limits are emulated in-memory below.
    const simpleEntries = Object.entries(queryObj.where).filter(([key, value]) => {
      return value !== undefined && value !== null && (value === null || typeof value !== 'object');
    });
    if (simpleEntries.length > 0) {
      const [key, value] = simpleEntries[0];
      q = q.where(key, '==', value);
    }
  }

  const snap = await q.get();
  let docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // 1. Apply complex filters (e.g. operators Op.ne, Op.in) in-memory
  if (queryObj.where) {
    docs = docs.filter(docData => {
      return Object.entries(queryObj.where).every(([key, value]) => {
        if (value === undefined || value === null) return true;
        const actualVal = docData[key];

        if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'Object') {
          return Object.getOwnPropertySymbols(value).concat(Object.keys(value)).every(sym => {
            const symStr = String(sym);
            const opVal = value[sym];
            if (symStr.includes('ne') || symStr.includes('!=') || symStr.includes('Op.ne')) {
              return actualVal !== opVal;
            }
            if (symStr.includes('in') || symStr.includes('Op.in')) {
              return Array.isArray(opVal) && opVal.includes(actualVal);
            }
            return true;
          });
        }

        return actualVal === value;
      });
    });
  }

  // 2. Apply sorting in-memory
  if (queryObj.order) {
    const orderItem = queryObj.order[0];
    if (orderItem && Array.isArray(orderItem)) {
      const [field, direction] = orderItem;
      const isDesc = direction && direction.toLowerCase() === 'desc';
      docs.sort((a, b) => {
        let valA = a[field];
        let valB = b[field];

        // Robust date parsing/comparison
        if (typeof field === 'string' && (field.includes('Date') || field === 'createdAt' || field === 'updatedAt')) {
          if (valA) valA = new Date(valA).getTime();
          if (valB) valB = new Date(valB).getTime();
        }

        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        if (valA < valB) return isDesc ? 1 : -1;
        if (valA > valB) return isDesc ? -1 : 1;
        return 0;
      });
    }
  }

  // 3. Apply limit/slicing in-memory
  if (queryObj.limit !== undefined) {
    docs = docs.slice(0, Number(queryObj.limit));
  }

  return docs;
}

class User {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.name = data.name || '';
    this.email = data.email || '';
    this.password = data.password || '';
    this.role = data.role || 'candidate';
    this.plan = data.plan || 'free'; // new field
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
    this.isVerified = data.isVerified !== undefined ? Boolean(data.isVerified) : false;
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
      plan: this.plan,
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
      isVerified: this.isVerified,
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
    const docs = await executeEmulatedQuery(db.collection('users'), queryObj);
    if (docs.length === 0) return null;
    return new User(docs[0]);
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
    const docs = await executeEmulatedQuery(db.collection('users'), queryObj);
    return docs.map(d => new User(d));
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
    const docs = await executeEmulatedQuery(db.collection('users'), queryObj);
    return docs.length;
  } catch (error) {
    console.error('Error in User.count:', error.message);
    throw error;
  }
};

User.executeEmulatedQuery = executeEmulatedQuery; // Export helper on User class

module.exports = User;
