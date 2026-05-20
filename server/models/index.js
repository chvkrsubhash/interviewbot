const User = require('./User');
const Interview = require('./Interview');
const Feedback = require('./Feedback');
const Plan = require('./Plan');
const Payment = require('./Payment');
const Question = require('./Question');

// Note: Relations (associations) are resolved dynamically inside the Firestore Sequelize-compatibility wrappers.
// This keeps the export syntax 100% compatible with existing controller/route imports.

module.exports = {
  User,
  Interview,
  Feedback,
  Plan,
  Payment,
  Question
};
