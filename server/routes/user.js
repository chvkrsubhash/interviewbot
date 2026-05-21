const express = require('express');
const router = express.Router();
const { protect } = require('./auth'); // middleware from auth route
const { User, Interview, Plan } = require('../models');

// GET /api/user/plan-status – returns current plan and interview usage
router.get('/plan-status', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Resolve the plan — user.plan may be a UUID or the string 'free'/null
    let plan = null;
    if (user.plan && user.plan !== 'free') {
      plan = await Plan.findByPk(user.plan);
    }

    // If no paid plan found, fall back to the Free plan record (or use defaults)
    if (!plan) {
      plan = await Plan.findOne({ where: { price: 0 } });
    }

    // Count completed interviews for the CURRENT calendar month only
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const allInterviews = await Interview.findAll({
      where: { candidateId: user.id, status: 'completed' }
    });

    const completedThisMonth = allInterviews.filter(i => {
      const d = i.createdAt || i.updatedAt;
      return d && new Date(d) >= new Date(startOfMonth);
    }).length;

    const interviewsAllowed = plan?.interviewsAllowed ?? 1;
    // -1 means unlimited
    const isUnlimited = interviewsAllowed === -1;
    const interviewsRemaining = isUnlimited ? null : Math.max(0, interviewsAllowed - completedThisMonth);

    res.json({
      planId: plan?.id || null,
      planName: plan?.name || 'Free Starter',
      interviewsAllowed: isUnlimited ? -1 : interviewsAllowed,
      completedInterviews: completedThisMonth,
      interviewsRemaining,
      canStartInterview: isUnlimited || interviewsRemaining > 0,
    });
  } catch (error) {
    console.error('Error fetching plan status:', error);
    res.status(500).json({ message: 'Failed to retrieve plan status', error: error.message });
  }
});

module.exports = router;
