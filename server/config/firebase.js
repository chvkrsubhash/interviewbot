const fs = require('fs');
const path = require('path');

let admin;
let db;

// High-Fidelity Local Firestore Mock DB to ensure the system runs out of the box without any setup.
class FirestoreMock {
  constructor() {
    this.filePath = path.join(__dirname, 'firestoreMockDb.json');
    this.data = {};
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        this.data = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      } else {
        this.data = {};
      }
    } catch (e) {
      console.error('Error loading Firestore Mock DB:', e.message);
      this.data = {};
    }
  }

  save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.error('Error saving Firestore Mock DB:', e.message);
    }
  }

  listCollections() {
    return Promise.resolve(Object.keys(this.data).map(name => ({ id: name })));
  }

  batch() {
    const operations = [];
    return {
      set: (docRef, data) => {
        operations.push({ docRef, data });
      },
      commit: () => {
        operations.forEach(op => {
          const colName = op.docRef._colName;
          const docId = op.docRef._docId;
          if (!this.data[colName]) this.data[colName] = {};
          this.data[colName][docId] = op.data;
        });
        this.save();
        return Promise.resolve();
      }
    };
  }

  collection(colName) {
    return new FirestoreMockCollection(this, colName);
  }
}

class FirestoreMockCollection {
  constructor(db, colName) {
    this.db = db;
    this.colName = colName;
    this.queries = [];
    this._limit = null;
    this._orderByField = null;
    this._orderByDir = 'asc';
  }

  doc(docId) {
    return new FirestoreMockDoc(this.db, this.colName, docId);
  }

  where(field, op, val) {
    const clone = this._clone();
    clone.queries.push((data) => {
      const actualVal = data[field];
      if (op === '==') {
        return actualVal === val;
      } else if (op === '!=') {
        return actualVal !== val;
      } else if (op === 'in') {
        return Array.isArray(val) && val.includes(actualVal);
      } else if (op === '>') {
        return actualVal > val;
      } else if (op === '<') {
        return actualVal < val;
      } else if (op === '>=') {
        return actualVal >= val;
      } else if (op === '<=') {
        return actualVal <= val;
      }
      return true;
    });
    return clone;
  }

  orderBy(field, dir = 'asc') {
    const clone = this._clone();
    clone._orderByField = field;
    clone._orderByDir = dir;
    return clone;
  }

  limit(n) {
    const clone = this._clone();
    clone._limit = n;
    return clone;
  }

  _clone() {
    const clone = new FirestoreMockCollection(this.db, this.colName);
    clone.queries = [...this.queries];
    clone._limit = this._limit;
    clone._orderByField = this._orderByField;
    clone._orderByDir = this._orderByDir;
    return clone;
  }

  get() {
    const colData = this.db.data[this.colName] || {};
    let docs = Object.entries(colData).map(([id, data]) => ({
      id,
      exists: true,
      data: () => data
    }));

    // Apply where queries
    this.queries.forEach(filterFn => {
      docs = docs.filter(doc => filterFn(doc.data()));
    });

    // Apply orderBy
    if (this._orderByField) {
      docs.sort((a, b) => {
        const valA = a.data()[this._orderByField];
        const valB = b.data()[this._orderByField];
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        if (valA < valB) return this._orderByDir === 'asc' ? -1 : 1;
        if (valA > valB) return this._orderByDir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Apply limit
    if (this._limit !== null) {
      docs = docs.slice(0, this._limit);
    }

    return Promise.resolve({
      empty: docs.length === 0,
      size: docs.length,
      docs
    });
  }
}

class FirestoreMockDoc {
  constructor(db, colName, docId) {
    this.db = db;
    this.colName = colName;
    this.id = docId;
    this._colName = colName;
    this._docId = docId;
  }

  get() {
    const colData = this.db.data[this.colName] || {};
    const exists = colData[this.id] !== undefined;
    const data = exists ? colData[this.id] : {};
    return Promise.resolve({
      id: this.id,
      exists,
      data: () => data
    });
  }

  set(data, options = {}) {
    if (!this.db.data[this.colName]) {
      this.db.data[this.colName] = {};
    }
    if (options.merge) {
      this.db.data[this.colName][this.id] = {
        ...(this.db.data[this.colName][this.id] || {}),
        ...data
      };
    } else {
      this.db.data[this.colName][this.id] = data;
    }
    this.db.save();
    return Promise.resolve(true);
  }

  delete() {
    if (this.db.data[this.colName] && this.db.data[this.colName][this.id]) {
      delete this.db.data[this.colName][this.id];
      this.db.save();
    }
    return Promise.resolve(true);
  }
}

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

const hasEnvKeys = !!(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);
const hasJsonFile = fs.existsSync(serviceAccountPath);

if (hasEnvKeys || hasJsonFile) {
  try {
    admin = require('firebase-admin');
    if (hasEnvKeys) {
      console.log('⚡ Initializing Firebase Admin SDK via environment variables...');
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey
        })
      });
    } else {
      console.log('⚡ Initializing Firebase Admin SDK via local serviceAccountKey.json...');
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    db = admin.firestore();
    console.log('✔ Live Firebase Firestore connected successfully.');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
    console.log('🔌 Falling back to local high-fidelity Firestore Mock DB...');
    class FirebaseAuthMock {
      async createUser(properties) {
        return { uid: 'mock_uid_' + Math.random().toString(36).substring(2, 9), email: properties.email };
      }
      async getUserByEmail(email) {
        return { uid: 'mock_uid', email };
      }
      async deleteUser(uid) {
        return {};
      }
    }
    const authMock = new FirebaseAuthMock();
    db = new FirestoreMock();
    admin = {
      firestore: () => db,
      auth: () => authMock,
      credential: { cert: () => ({}) },
      initializeApp: () => {}
    };
    console.log('✔ Firebase Firestore Mock active.');
  }
} else {
  console.log('⚠️ Firebase credentials not configured in .env or server/config/serviceAccountKey.json.');
  console.log('🧪 Initializing high-fidelity local Firestore Mock DB (server/config/firestoreMockDb.json)...');
  class FirebaseAuthMock {
    async createUser(properties) {
      return { uid: 'mock_uid_' + Math.random().toString(36).substring(2, 9), email: properties.email };
    }
    async getUserByEmail(email) {
      return { uid: 'mock_uid', email };
    }
    async deleteUser(uid) {
      return {};
    }
  }
  const authMock = new FirebaseAuthMock();
  db = new FirestoreMock();
  admin = {
    firestore: () => db,
    auth: () => authMock,
    credential: { cert: () => ({}) },
    initializeApp: () => {}
  };
  console.log('✔ Firebase Firestore connected successfully (Local Mock Mode).');
}

module.exports = { admin, db };
