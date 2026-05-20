const { db } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');
const { executeEmulatedQuery } = require('./User');

class Question {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.type = data.type || 'interview';
    this.domain = data.domain || '';
    this.difficulty = data.difficulty || 'Medium';
    this.title = data.title || '';
    this.description = data.description || '';

    // Handle Arrays (parse if stored as string JSON, else default to array)
    this.constraints = this._parseArray(data.constraints);
    this.testCases = this._parseArray(data.testCases);
    this.tags = this._parseArray(data.tags);

    // Handle Objects (parse if stringified, else default to empty object)
    this.starterCode = this._parseObject(data.starterCode);
    this.testCode = this._parseObject(data.testCode);

    this.isActive = data.isActive !== undefined ? Boolean(data.isActive) : true;
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
  }

  _parseArray(field) {
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch (e) {
        return [];
      }
    }
    return Array.isArray(field) ? field : [];
  }

  _parseObject(field) {
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch (e) {
        return {};
      }
    }
    return field && typeof field === 'object' ? field : {};
  }

  async save() {
    this.updatedAt = new Date();
    const docData = this.toJSON();
    await db.collection('questions').doc(this.id).set(docData, { merge: true });
    return this;
  }

  async destroy() {
    await db.collection('questions').doc(this.id).delete();
    return this;
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      domain: this.domain,
      difficulty: this.difficulty,
      title: this.title,
      description: this.description,
      constraints: this.constraints,
      testCases: this.testCases,
      starterCode: this.starterCode,
      testCode: this.testCode,
      tags: this.tags,
      isActive: this.isActive,
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

Question.findByPk = async function (id) {
  if (!id) return null;
  try {
    const doc = await db.collection('questions').doc(String(id)).get();
    if (!doc.exists) return null;
    return new Question({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error in Question.findByPk:', error.message);
    throw error;
  }
};

Question.findOne = async function (queryObj = {}) {
  try {
    const docs = await executeEmulatedQuery(db.collection('questions'), queryObj);
    if (docs.length === 0) return null;
    return new Question(docs[0]);
  } catch (error) {
    console.error('Error in Question.findOne:', error.message);
    throw error;
  }
};

Question.findAll = async function (queryObj = {}) {
  try {
    const docs = await executeEmulatedQuery(db.collection('questions'), queryObj);
    return docs.map(d => new Question(d));
  } catch (error) {
    console.error('Error in Question.findAll:', error.message);
    throw error;
  }
};

Question.create = async function (data = {}) {
  try {
    const q = new Question(data);
    await q.save();
    return q;
  } catch (error) {
    console.error('Error in Question.create:', error.message);
    throw error;
  }
};

Question.count = async function (queryObj = {}) {
  try {
    const docs = await executeEmulatedQuery(db.collection('questions'), queryObj);
    return docs.length;
  } catch (error) {
    console.error('Error in Question.count:', error.message);
    throw error;
  }
};

module.exports = Question;
