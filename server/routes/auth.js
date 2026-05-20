const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-prepai-2026';

// Middleware to authenticate requests
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = await User.findByPk(decoded.id);
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Route: User registration
router.post('/signup', async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'Email address already exists' });
    }

    // Mock OTP setup
    const otp = '123456';
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'candidate',
      otp,
      otpExpiry
    });

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        streak: user.streak,
        lastActive: user.lastActive
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server registration error', error: error.message });
  }
});

// Route: User sign-in
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: 'This user account has been suspended by administration.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Increment streak logic if active on a new calendar day
    const lastActiveDate = new Date(user.lastActive).toDateString();
    const today = new Date().toDateString();
    if (lastActiveDate !== today) {
      user.streak += 1;
      user.lastActive = new Date();
      await user.save();
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        streak: user.streak,
        lastActive: user.lastActive
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server authentication error', error: error.message });
  }
});

// Route: Mock OTP Verification
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Instantly allow verified mocks or correct codes
    if (otp === '123456' || user.otp === otp) {
      user.otp = null;
      user.otpExpiry = null;
      await user.save();
      return res.json({ message: 'Account verified successfully!' });
    }

    return res.status(400).json({ message: 'Invalid OTP credentials code' });
  } catch (error) {
    res.status(500).json({ message: 'Server verification error', error: error.message });
  }
});

// Route: Fetch current user profile details
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'role', 'username', 'education', 'skills', 'certifications', 'projects', 'streak', 'lastActive', 'createdAt']
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving user profile', error: error.message });
  }
});

// Route: Update current user profile details
router.put('/profile', protect, async (req, res) => {
  const { name, username, education, skills, certifications, projects } = req.body;
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name !== undefined) user.name = name;
    if (username !== undefined) user.username = username;
    if (education !== undefined) user.education = education;
    if (skills !== undefined) user.skills = skills;
    if (certifications !== undefined) user.certifications = certifications;
    if (projects !== undefined) user.projects = projects;

    await user.save();

    res.json({
      message: 'Profile updated successfully!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        username: user.username,
        education: user.education,
        skills: user.skills,
        certifications: user.certifications,
        projects: user.projects,
        streak: user.streak,
        lastActive: user.lastActive
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user profile', error: error.message });
  }
});

module.exports = { router, protect };
