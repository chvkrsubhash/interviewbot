const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const { admin } = require('../config/firebase');

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

    // Check if Firebase Auth is live
    const isFirebaseLive = process.env.FIREBASE_PROJECT_ID && !process.env.FIREBASE_PROJECT_ID.includes('your-');
    let firebaseUser;

    if (isFirebaseLive) {
      try {
        firebaseUser = await admin.auth().createUser({
          email,
          password,
          displayName: name
        });
      } catch (fbErr) {
        if (fbErr.code === 'auth/email-already-exists') {
          return res.status(400).json({ message: 'Email address already exists' });
        }
        return res.status(400).json({ message: fbErr.message });
      }
    }

    // OTP setup - Generate a random 6-digit passcode
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    const user = await User.create({
      id: firebaseUser ? firebaseUser.uid : undefined,
      name,
      email,
      password: password, // Always store hashed password in Firestore so fallback works bulletproofly
      role: role || 'candidate',
      otp,
      otpExpiry
    });

    // Send verification OTP email to user
    const emailUtils = require('../utils/email');
    const emailHtml = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <h2 style="color: #4f46e5; text-align: center; margin-bottom: 24px; font-size: 24px; font-weight: 700;">Verify Your PrepAI Account</h2>
        <p style="font-size: 15px; color: #334155; line-height: 1.5;">Hi ${name},</p>
        <p style="font-size: 15px; color: #334155; line-height: 1.5;">Thank you for registering on PrepAI. To complete your account verification, please enter the following 6-digit one-time passcode (OTP):</p>
        <div style="background-color: #f8fafc; font-size: 28px; font-weight: 800; text-align: center; padding: 18px; border-radius: 12px; letter-spacing: 5px; margin: 24px 0; color: #1e1b4b; border: 1px dashed #c7d2fe;">
          ${otp}
        </div>
        <p style="font-size: 14px; color: #64748b; line-height: 1.5; text-align: center;">This code will remain active for 10 minutes. If you did not register for this account, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">PrepAI — Elevate Your Interview Competence</p>
      </div>
    `;

    emailUtils.sendMail(email, 'Verify Your Email - PrepAI', emailHtml)
      .then(() => console.log(`✔ Verification OTP email successfully dispatched to: ${email}`))
      .catch(err => console.error('✖ Failed to dispatch registration verification email:', err.message));

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
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
    const isFirebaseLive = process.env.FIREBASE_PROJECT_ID && !process.env.FIREBASE_PROJECT_ID.includes('your-');
    let authenticated = false;
    let fbUid;

    if (isFirebaseLive) {
      const apiKey = process.env.FIREBASE_API_KEY;
      if (apiKey && apiKey !== 'your_firebase_web_api_key_here') {
        try {
          const fbRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, returnSecureToken: true })
          });
          const fbData = await fbRes.json();
          if (fbRes.ok) {
            fbUid = fbData.localId;
            authenticated = true;
          } else {
            const errMsg = fbData.error?.message;
            if (errMsg === 'INVALID_PASSWORD' || errMsg === 'EMAIL_NOT_FOUND') {
              return res.status(400).json({ message: 'Invalid email or password' });
            }
            console.warn('Firebase Auth REST API returned error, continuing to local fallback:', errMsg);
          }
        } catch (fbErr) {
          console.warn('Firebase Auth REST API call failed, continuing to local fallback:', fbErr.message);
        }
      } else {
        console.warn('FIREBASE_API_KEY is not configured or is default. Falling back to local secure password check.');
      }
    }

    let user = await User.findOne({ where: { email } });
    if (!user) {
      if (authenticated && fbUid) {
        user = await User.create({
          id: fbUid,
          name: email.split('@')[0],
          email,
          password: password,
          role: 'candidate'
        });
      } else {
        return res.status(400).json({ message: 'Invalid email or password' });
      }
    }

    if (user.isBanned) {
      return res.status(403).json({ message: 'This user account has been suspended by administration.' });
    }

    if (!authenticated) {
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }
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
        isVerified: user.isVerified,
        streak: user.streak,
        lastActive: user.lastActive
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server login error', error: error.message });
  }
});

// Forgot password endpoint – sends a dummy reset link (placeholder implementation)
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    // In a real system we would generate a token and email a reset link.
    // Here we simply respond with success for the UI flow.
    res.json({ message: 'Password reset instructions sent to your email (simulated).' });
  } catch (err) {
    console.error('Forgot password error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
  /*
  const { email, password } = req.body;
  try {
    const isFirebaseLive = process.env.FIREBASE_PROJECT_ID && !process.env.FIREBASE_PROJECT_ID.includes('your-');
    let authenticated = false;
    let fbUid;

    if (isFirebaseLive) {
      const apiKey = process.env.FIREBASE_API_KEY;
      if (apiKey && apiKey !== 'your_firebase_web_api_key_here') {
        // We do a POST request to Firebase Auth REST API to verify user credentials
        try {
          const fbRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, returnSecureToken: true })
          });
          const fbData = await fbRes.json();
          if (fbRes.ok) {
            fbUid = fbData.localId;
            authenticated = true;
          } else {
            const errMsg = fbData.error?.message;
            if (errMsg === 'INVALID_PASSWORD' || errMsg === 'EMAIL_NOT_FOUND') {
              return res.status(400).json({ message: 'Invalid email or password' });
            }
            console.warn('Firebase Auth REST API returned error, continuing to local fallback:', errMsg);
          }
        } catch (fbErr) {
          console.warn('Firebase Auth REST API call failed, continuing to local fallback:', fbErr.message);
        }
      } else {
        console.warn('FIREBASE_API_KEY is not configured or is default. Falling back to local secure password check.');
      }
    }

    let user = await User.findOne({ where: { email } });
    if (!user) {
      if (authenticated && fbUid) {
        // Create user entry dynamically in Firestore if it was created directly in Firebase Auth
        user = await User.create({
          id: fbUid,
          name: email.split('@')[0],
          email,
          password: password,
          role: 'candidate'
        });
      } else {
        return res.status(400).json({ message: 'Invalid email or password' });
      }
    }

    if (user.isBanned) {
      return res.status(403).json({ message: 'This user account has been suspended by administration.' });
    }

    if (!authenticated) {
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }
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
        isVerified: user.isVerified,
        streak: user.streak,
        lastActive: user.lastActive
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server authentication error', error: error.message });
  }
*/

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
      user.isVerified = true;
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
      attributes: ['id', 'name', 'email', 'role', 'username', 'education', 'skills', 'certifications', 'projects', 'streak', 'lastActive', 'isVerified', 'createdAt']
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
