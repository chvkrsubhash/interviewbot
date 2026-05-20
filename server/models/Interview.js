const { db } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');
const { executeEmulatedQuery } = require('./User');

class Interview {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.title = data.title || '';
    this.domain = data.domain || '';
    this.experienceLevel = data.experienceLevel || '';
    this.type = data.type || 'technical';
    this.status = data.status || 'scheduled';
    this.score = data.score !== undefined && data.score !== null ? Number(data.score) : null;
    this.cheated = data.cheated !== undefined ? Boolean(data.cheated) : false;
    this.tabSwitches = data.tabSwitches !== undefined ? Number(data.tabSwitches) : 0;
    this.shareToken = data.shareToken || uuidv4();
    this.candidateId = data.candidateId || null;
    
    // Parse questions array. If stored as stringified JSON (backward compatibility), parse it
    if (typeof data.questions === 'string') {
      try {
        this.questions = JSON.parse(data.questions);
      } catch (e) {
        this.questions = [];
      }
    } else {
      this.questions = Array.isArray(data.questions) ? data.questions : [];
    }

    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();

    // Emulate association field
    this.feedback = data.feedback || null;
  }

  async save() {
    this.updatedAt = new Date();
    const docData = this.toJSON();
    await db.collection('interviews').doc(this.id).set(docData, { merge: true });
    return this;
  }

  toJSON() {
    const data = {
      id: this.id,
      title: this.title,
      domain: this.domain,
      experienceLevel: this.experienceLevel,
      type: this.type,
      status: this.status,
      score: this.score,
      cheated: this.cheated,
      tabSwitches: this.tabSwitches,
      shareToken: this.shareToken,
      candidateId: this.candidateId,
      questions: this.questions,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
    if (this.feedback) {
      data.feedback = typeof this.feedback.toJSON === 'function' ? this.feedback.toJSON() : this.feedback;
    }
    return data;
  }

  // Emulate Sequelize model parsing
  getDataValue(field) {
    return this[field];
  }
}

// Helper to prefetch associations
async function loadAssociations(interviews, queryObj) {
  if (!queryObj.include || interviews.length === 0) return;
  const includeFeedback = queryObj.include.some(inc => inc.as === 'feedback' || inc.model && inc.model.name === 'Feedback');
  
  if (includeFeedback) {
    const FeedbackModel = require('./Feedback');
    await Promise.all(interviews.map(async (interview) => {
      const snap = await db.collection('feedbacks').where('interviewId', '==', interview.id).limit(1).get();
      if (!snap.empty) {
        interview.feedback = new FeedbackModel({ id: snap.docs[0].id, ...snap.docs[0].data() });
      } else {
        interview.feedback = null;
      }
    }));
  }
}

// ── Static Emulated Queries ──────────────────────────────────────────────────

Interview.findOne = async function (queryObj = {}) {
  try {
    const docs = await executeEmulatedQuery(db.collection('interviews'), queryObj);
    if (docs.length === 0) return null;
    const interview = new Interview(docs[0]);
    await loadAssociations([interview], queryObj);
    return interview;
  } catch (error) {
    console.error('Error in Interview.findOne:', error.message);
    throw error;
  }
};

Interview.findByPk = async function (id, queryObj = {}) {
  if (!id) return null;
  try {
    const doc = await db.collection('interviews').doc(String(id)).get();
    if (!doc.exists) return null;
    const interview = new Interview({ id: doc.id, ...doc.data() });
    await loadAssociations([interview], queryObj);
    return interview;
  } catch (error) {
    console.error('Error in Interview.findByPk:', error.message);
    throw error;
  }
};

Interview.findAll = async function (queryObj = {}) {
  try {
    const docs = await executeEmulatedQuery(db.collection('interviews'), queryObj);
    const interviews = docs.map(d => new Interview(d));
    await loadAssociations(interviews, queryObj);
    return interviews;
  } catch (error) {
    console.error('Error in Interview.findAll:', error.message);
    throw error;
  }
};

Interview.create = async function (data = {}) {
  try {
    const interview = new Interview(data);
    await interview.save();
    return interview;
  } catch (error) {
    console.error('Error in Interview.create:', error.message);
    throw error;
  }
};

Interview.count = async function (queryObj = {}) {
  try {
    const docs = await executeEmulatedQuery(db.collection('interviews'), queryObj);
    return docs.length;
  } catch (error) {
    console.error('Error in Interview.count:', error.message);
    throw error;
  }
};

module.exports = Interview;
