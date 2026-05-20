const express = require('express');
const router = express.Router();
const { protect } = require('./auth');
const { Interview, Feedback, User } = require('../models');
const bcrypt = require('bcryptjs');

// Route: Get all candidate interviews for recruiter view (all statuses)
router.get('/candidates', protect, async (req, res) => {
  try {
    if (req.user.role !== 'recruiter' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Recruiters only' });
    }

    const interviews = await Interview.findAll({
      include: [
        { model: Feedback, as: 'feedback' },
        { model: User, as: 'candidate', attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(interviews);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving recruiter dashboard lists', error: error.message });
  }
});

// Route: Schedule and invite a candidate to an interview
router.post('/invite', protect, async (req, res) => {
  if (req.user.role !== 'recruiter' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Recruiters only' });
  }

  const { email, domain, experienceLevel } = req.body;
  if (!email || !domain) {
    return res.status(400).json({ message: 'Email and domain are required' });
  }

  try {
    // Find or create the candidate user
    let candidate = await User.findOne({ where: { email } });
    if (!candidate) {
      // Create a placeholder account for the invited candidate
      const tempPassword = Math.random().toString(36).substring(2, 10) + 'Ai!';
      candidate = await User.create({
        name: email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').trim() || 'Invited Candidate',
        email,
        password: tempPassword,
        role: 'candidate'
      });
    }

    // Create a scheduled interview session for this candidate
    const interview = await Interview.create({
      title: `${req.user.name || 'Recruiter'} Scheduled - ${domain} Round`,
      domain,
      experienceLevel: experienceLevel || 'Mid',
      type: 'technical',
      status: 'scheduled',
      candidateId: candidate.id,
      questions: []
    });

    const inviteLink = `${req.headers.origin || 'http://localhost:3000'}/invite/evaluate/${interview.shareToken}`;

    res.status(201).json({
      message: `Invitation scheduled for ${email}`,
      candidateId: candidate.id,
      interviewId: interview.id,
      shareToken: interview.shareToken,
      inviteLink,
      interview
    });
  } catch (error) {
    res.status(500).json({ message: 'Error scheduling interview invite', error: error.message });
  }
});

// Route: Get recruiter overview metrics
router.get('/metrics', protect, async (req, res) => {
  if (req.user.role !== 'recruiter' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const totalInterviews = await Interview.count();
    const completedInterviews = await Interview.count({ where: { status: 'completed' } });
    const scheduledInterviews = await Interview.count({ where: { status: 'scheduled' } });
    const inProgressInterviews = await Interview.count({ where: { status: 'in_progress' } });

    // Get average score from completed interviews
    const completed = await Interview.findAll({ where: { status: 'completed' }, attributes: ['score'] });
    const avgScore = completed.length > 0
      ? Math.round(completed.reduce((sum, i) => sum + (i.score || 0), 0) / completed.length)
      : 0;

    res.json({
      totalInterviews,
      completedInterviews,
      scheduledInterviews,
      inProgressInterviews,
      avgScore
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recruiter metrics', error: error.message });
  }
});

module.exports = router;
