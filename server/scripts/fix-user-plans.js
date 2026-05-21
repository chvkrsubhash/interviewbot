/**
 * One-time migration: Set user.plan from their most recent PAID payment.
 * Run with: node server/scripts/fix-user-plans.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { User, Payment, Plan } = require('../models');

(async () => {
  try {
    // Find all paid payments
    const paidPayments = await Payment.findAll({
      where: { status: 'paid' },
      order: [['createdAt', 'DESC']]
    });

    const userPlanMap = {};
    for (const p of paidPayments) {
      // Keep only the most recent paid payment per user
      if (!userPlanMap[p.userId]) {
        userPlanMap[p.userId] = p.planId;
      }
    }

    let updated = 0;
    for (const [userId, planId] of Object.entries(userPlanMap)) {
      const user = await User.findByPk(userId);
      if (user && user.plan !== planId) {
        user.plan = planId;
        await user.save();
        console.log(`✅ Updated user ${userId} → plan ${planId}`);
        updated++;
      } else if (user) {
        console.log(`ℹ️  User ${userId} already on plan ${planId}`);
      }
    }

    console.log(`\nDone. ${updated} user(s) updated.`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
})();
