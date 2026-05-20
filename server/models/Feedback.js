const { db } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');
const { applyQuery } = require('./User');

class Feedback {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.technicalScore = data.technicalScore !== undefined ? Number(data.technicalScore) : 0;
    this.communicationScore = data.communicationScore !== undefined ? Number(data.communicationScore) : 0;
    this.grammarAnalysis = data.grammarAnalysis || '';
    this.confidenceLevel = data.confidenceLevel !== undefined ? Number(data.confidenceLevel) : 100;
    this.interviewId = data.interviewId || null;

    // Handle Arrays (parse if stored as string JSON, else default to array)
    this.strengths = this._parseArray(data.strengths);
    this.weaknesses = this._parseArray(data.weaknesses);
    this.suggestions = this._parseArray(data.suggestions);
    this.transcript = this._parseArray(data.transcript);

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

  async save() {
    this.updatedAt = new Date();
    const docData = this.toJSON();
    await db.collection('feedbacks').doc(this.id).set(docData, { merge: true });
    return this;
  }

  toJSON() {
    return {
      id: this.id,
      technicalScore: this.technicalScore,
      communicationScore: this.communicationScore,
      grammarAnalysis: this.grammarAnalysis,
      confidenceLevel: this.confidenceLevel,
      interviewId: this.interviewId,
      strengths: this.strengths,
      weaknesses: this.weaknesses,
      suggestions: this.suggestions,
      transcript: this.transcript,
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

Feedback.findOne = async function (queryObj = {}) {
  try {
    const q = applyQuery(db.collection('feedbacks'), queryObj);
    const snap = await q.limit(1).get();
    if (snap.empty) return null;
    return new Feedback({ id: snap.docs[0].id, ...snap.docs[0].data() });
  } catch (error) {
    console.error('Error in Feedback.findOne:', error.message);
    throw error;
  }
};

Feedback.create = async function (data = {}) {
  try {
    const fb = new Feedback(data);
    await fb.save();
    return fb;
  } catch (error) {
    console.error('Error in Feedback.create:', error.message);
    throw error;
  }
};

module.exports = Feedback;
