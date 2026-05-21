const express = require('express');
const router = express.Router();
const { protect } = require('./auth');
const { User, Interview, Feedback, Plan, Payment, Question } = require('../models');

// Middleware: Enforce admin role
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admin privileges required' });
  }
  next();
};

// ── User Management ─────────────────────────────────────────────────────────

router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'streak', 'isBanned', 'lastActive', 'createdAt', 'plan'],
      order: [['createdAt', 'DESC']]
    });

    const usersWithStats = await Promise.all(users.map(async (u) => {
      const totalInterviews = await Interview.count({ where: { candidateId: u.id } });
      const completedInterviews = await Interview.count({ where: { candidateId: u.id, status: 'completed' } });
      const totalSpent = await Payment.sum('amount', { where: { userId: u.id, status: 'paid' } }) || 0;
      return { ...u.toJSON(), totalInterviews, completedInterviews, totalSpent };
    }));

    res.json(usersWithStats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user roster', error: error.message });
  }
});

router.post('/users/:id/ban', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ message: 'Cannot suspend another administrator account' });

    user.isBanned = !user.isBanned;
    await user.save();

    res.json({ message: `User ${user.email} has been ${user.isBanned ? 'banned' : 'unbanned'}.`, isBanned: user.isBanned, userId: user.id });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user ban status', error: error.message });
  }
});

// ── Platform Metrics ─────────────────────────────────────────────────────────

router.get('/metrics', protect, adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalCandidates = await User.count({ where: { role: 'candidate' } });
    const totalRecruiters = await User.count({ where: { role: 'recruiter' } });
    const totalBanned = await User.count({ where: { isBanned: true } });
    const totalInterviews = await Interview.count();
    const completedInterviews = await Interview.count({ where: { status: 'completed' } });

    res.json({ totalUsers, totalCandidates, totalRecruiters, totalBanned, totalInterviews, completedInterviews });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching platform metrics', error: error.message });
  }
});

// ── Income & Revenue Panel ────────────────────────────────────────────────────

router.get('/income', protect, adminOnly, async (req, res) => {
  try {
    const payments = await Payment.findAll({
      order: [['createdAt', 'DESC']],
      include: [{ model: User, as: 'user', attributes: ['name', 'email'] }]
    });

    const paidPayments = payments.filter(p => p.status === 'paid');

    const totalRevenuePaise = paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalRevenueINR = (totalRevenuePaise / 100).toFixed(2);

    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);
    const monthlyRevenuePaise = paidPayments
      .filter(p => new Date(p.createdAt) >= thisMonthStart)
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    const monthlyRevenueINR = (monthlyRevenuePaise / 100).toFixed(2);

    // Revenue by plan
    const planRevenue = {};
    paidPayments.forEach(p => {
      const planName = p.planName || 'Unknown';
      if (!planRevenue[planName]) planRevenue[planName] = 0;
      planRevenue[planName] += p.amount || 0;
    });

    const revenueByPlan = Object.entries(planRevenue).map(([name, paise]) => ({
      plan: name,
      revenueINR: (paise / 100).toFixed(2),
      count: paidPayments.filter(p => p.planName === name).length
    }));

    // Monthly trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const monthPaid = paidPayments.filter(p => {
        const created = new Date(p.createdAt);
        return created >= monthStart && created <= monthEnd;
      });
      const monthRevenue = monthPaid.reduce((s, p) => s + (p.amount || 0), 0) / 100;
      monthlyTrend.push({
        month: d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
        revenue: parseFloat(monthRevenue.toFixed(2)),
        transactions: monthPaid.length
      });
    }

    res.json({
      totalRevenueINR: parseFloat(totalRevenueINR),
      monthlyRevenueINR: parseFloat(monthlyRevenueINR),
      totalTransactions: payments.length,
      successfulTransactions: paidPayments.length,
      failedTransactions: payments.filter(p => p.status === 'failed').length,
      revenueByPlan,
      monthlyTrend,
      recentPayments: payments.slice(0, 20).map(p => ({
        id: p.id,
        userName: p.user?.name || p.userName || '—',
        userEmail: p.user?.email || p.userEmail || '—',
        planName: p.planName,
        amountINR: (p.amount / 100).toFixed(2),
        status: p.status,
        razorpayPaymentId: p.razorpayPaymentId,
        createdAt: p.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching income data', error: error.message });
  }
});

// ── Plan Management ────────────────────────────────────────────────────────────

router.get('/plans', protect, adminOnly, async (req, res) => {
  try {
    const plans = await Plan.findAll({ order: [['sortOrder', 'ASC']] });
    // Attach payment count per plan
    const plansWithStats = await Promise.all(plans.map(async (plan) => {
      try {
        const paymentsCount = await Payment.count({ where: { planId: plan.id, status: 'paid' } });
        const totalRevenuePaise = await Payment.sum('amount', { where: { planId: plan.id, status: 'paid' } }) || 0;
        return {
          ...plan.toJSON(),
          subscriberCount: paymentsCount,
          revenueINR: (totalRevenuePaise / 100).toFixed(2)
        };
      } catch (err) {
        console.error('Error fetching stats for plan', plan.id, err.message);
        return {
          ...plan.toJSON(),
          subscriberCount: 0,
          revenueINR: '0.00'
        };
      }
    }));
    res.json(plansWithStats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching plans', error: error.message });
  }
});

router.post('/plans', protect, adminOnly, async (req, res) => {
  const { name, description, price, billingInterval, interviewsAllowed, features, isPopular, badgeColor, sortOrder } = req.body;
  if (!name || price === undefined) return res.status(400).json({ message: 'name and price are required' });
  try {
    const plan = await Plan.create({
      name, description,
      price: Math.round(parseFloat(price) * 100), // convert INR to paise
      billingInterval: billingInterval || 'monthly',
      interviewsAllowed: interviewsAllowed || 5,
      features: features || [],
      isActive: true,
      isPopular: isPopular || false,
      badgeColor: badgeColor || 'primary',
      sortOrder: sortOrder || 99
    });
    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Error creating plan', error: error.message });
  }
});

router.put('/plans/:id', protect, adminOnly, async (req, res) => {
  try {
    const plan = await Plan.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    const { name, description, price, billingInterval, interviewsAllowed, features, isActive, isPopular, badgeColor, sortOrder } = req.body;
    if (name !== undefined) plan.name = name;
    if (description !== undefined) plan.description = description;
    if (price !== undefined) plan.price = Math.round(parseFloat(price) * 100);
    if (billingInterval !== undefined) plan.billingInterval = billingInterval;
    if (interviewsAllowed !== undefined) plan.interviewsAllowed = interviewsAllowed;
    if (features !== undefined) plan.features = features;
    if (isActive !== undefined) plan.isActive = isActive;
    if (isPopular !== undefined) plan.isPopular = isPopular;
    if (badgeColor !== undefined) plan.badgeColor = badgeColor;
    if (sortOrder !== undefined) plan.sortOrder = sortOrder;

    await plan.save();
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Error updating plan', error: error.message });
  }
});

router.delete('/plans/:id', protect, adminOnly, async (req, res) => {
  try {
    const plan = await Plan.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    await plan.destroy();
    res.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting plan', error: error.message });
  }
});

// ── Maintenance Mode ────────────────────────────────────────────────────────
// Uses shared config/maintenance.js to avoid circular require with server.js

const maintenanceMode = require('../config/maintenance');

router.get('/maintenance', protect, adminOnly, (req, res) => {
  res.json(maintenanceMode);
});

router.post('/maintenance', protect, adminOnly, (req, res) => {
  const { enabled, message, estimatedTime } = req.body;

  if (enabled !== undefined) maintenanceMode.enabled = Boolean(enabled);
  if (message !== undefined) maintenanceMode.message = message;
  if (estimatedTime !== undefined) maintenanceMode.estimatedTime = estimatedTime;

  console.log(`⚙ Maintenance mode ${maintenanceMode.enabled ? 'ENABLED' : 'DISABLED'} by admin`);
  res.json({ success: true, maintenanceMode });
});

// ── Question Bank CRUD ────────────────────────────────────────────────────────

router.get('/questions', protect, adminOnly, async (req, res) => {
  const { type, domain } = req.query;
  const whereClause = {};
  if (type) whereClause.type = type;
  if (domain) whereClause.domain = domain;

  try {
    const questions = await Question.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching questions roster', error: error.message });
  }
});

router.post('/questions', protect, adminOnly, async (req, res) => {
  const { type, domain, difficulty, title, description, constraints, testCases, starterCode, testCode, tags, isActive } = req.body;
  if (!domain || !title || !description) {
    return res.status(400).json({ message: 'domain, title, and description are required fields' });
  }
  try {
    const question = await Question.create({
      type: type || 'interview',
      domain,
      difficulty: difficulty || 'Medium',
      title,
      description,
      constraints: constraints || [],
      testCases: testCases || [],
      starterCode: starterCode || {},
      testCode: testCode || {},
      tags: tags || [],
      isActive: isActive !== undefined ? isActive : true
    });
    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ message: 'Error creating question', error: error.message });
  }
});

router.put('/questions/:id', protect, adminOnly, async (req, res) => {
  try {
    const question = await Question.findByPk(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    const { type, domain, difficulty, title, description, constraints, testCases, starterCode, testCode, tags, isActive } = req.body;

    if (type !== undefined) question.type = type;
    if (domain !== undefined) question.domain = domain;
    if (difficulty !== undefined) question.difficulty = difficulty;
    if (title !== undefined) question.title = title;
    if (description !== undefined) question.description = description;
    if (constraints !== undefined) question.constraints = constraints;
    if (testCases !== undefined) question.testCases = testCases;
    if (starterCode !== undefined) question.starterCode = starterCode;
    if (testCode !== undefined) question.testCode = testCode;
    if (tags !== undefined) question.tags = tags;
    if (isActive !== undefined) question.isActive = isActive;

    await question.save();
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: 'Error updating question', error: error.message });
  }
});

const banner = require('../config/banner');

// ── Banner Announcement Control ──────────────────────────────────────────────

router.get('/banner', (req, res) => {
  res.json(banner);
});

router.post('/banner', protect, adminOnly, (req, res) => {
  const { enabled, message, color, link } = req.body;

  if (enabled !== undefined) banner.enabled = Boolean(enabled);
  if (message !== undefined) banner.message = message;
  if (color !== undefined) banner.color = color;
  if (link !== undefined) banner.link = link;

  console.log(`⚙ Announcement banner ${banner.enabled ? 'ENABLED' : 'DISABLED'} by admin`);
  res.json({ success: true, banner });
});

// ── Admin Broadcast & Promotional Emails ──────────────────────────────────────

router.post('/broadcast', protect, adminOnly, async (req, res) => {
  const { subject, message, role } = req.body;
  if (!subject || !message) {
    return res.status(400).json({ message: 'subject and message are required fields' });
  }

  try {
    const filter = {};
    if (role && role !== 'all') filter.role = role;
    
    const users = await User.findAll({ where: filter });
    if (users.length === 0) {
      return res.json({ message: 'No registered users match this role criteria.' });
    }

    const emailUtils = require('../utils/email');
    
    // Dispatch emails
    const sendPromises = users.map(user => {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #4f46e5; text-align: center; margin-bottom: 20px;">PrepAI Announcement</h2>
          <p style="font-size: 16px; color: #1e293b;">Hi ${user.name || 'User'},</p>
          <div style="line-height: 1.6; color: #334155; font-size: 15px; margin: 20px 0; white-space: pre-line;">
            ${message}
          </div>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center;">You are receiving this system update because you are registered on PrepAI. If you'd like to unsubscribe, please update your notifications settings.</p>
        </div>
      `;
      return emailUtils.sendMail(user.email, subject, emailHtml)
        .catch(err => console.error(`Failed to send system broadcast email to ${user.email}:`, err.message));
    });

    await Promise.all(sendPromises);
    res.json({ success: true, message: `Successfully sent promotional/broadcast emails to ${users.length} matching users.` });
  } catch (error) {
    res.status(500).json({ message: 'Error executing admin email broadcast', error: error.message });
  }
});

router.delete('/questions/:id', protect, adminOnly, async (req, res) => {
  try {
    const question = await Question.findByPk(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    await question.destroy();
    res.json({ message: 'Question deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting question', error: error.message });
  }
});

module.exports = router;

// Update a user's plan
router.put('/users/:id/plan', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { planId } = req.body;
    if (!planId) return res.status(400).json({ message: 'planId is required' });
    // Validate plan exists
    const plan = await Plan.findByPk(planId);
    if (!plan) return res.status(400).json({ message: 'Invalid planId' });
    user.plan = planId;
    await user.save();
    res.json({ message: 'User plan updated', userId: user.id, planId: planId });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user plan', error: error.message });
  }
});
