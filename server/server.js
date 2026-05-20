const express = require('express');
const cors = require('cors');
// Load env variables immediately
const dotenv = require('dotenv');

dotenv.config();

const path = require('path');
const { db } = require('./config/firebase');

// ── Shared maintenance mode state (separate module to avoid circular require)
const maintenanceMode = require('./config/maintenance');

const app = express();

// Maintenance mode middleware — blocks all routes except auth and admin
const maintenanceMiddleware = (req, res, next) => {
  if (!maintenanceMode.enabled) return next();
  // Allow auth and admin routes through maintenance
  const allowed = ['/api/auth', '/api/admin', '/admin'];
  if (allowed.some(prefix => req.path.startsWith(prefix))) return next();
  // Serve static maintenance page for all other requests
  return res.sendFile(path.join(__dirname, '..', 'client', 'public', 'maintenance.html'));
};

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(maintenanceMiddleware);

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve React client build
app.use(express.static(path.join(__dirname, '..', 'client', 'build')));

// Fallback to index.html for client-side routing (excluding API routes)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
});

const { router: authRouter } = require('./routes/auth');
const interviewRouter = require('./routes/interview');
const recruiterRouter = require('./routes/recruiter');
const adminRouter = require('./routes/admin');
const paymentsRouter = require('./routes/payments');

app.use('/api/auth', authRouter);
app.use('/api/interview', interviewRouter);
app.use('/api/recruiter', recruiterRouter);
app.use('/api/admin', adminRouter);
app.use('/api/payments', paymentsRouter);

// Sync database and start server
const PORT = process.env.PORT || 5000;

// Test Firestore connection and trigger seeding
db.listCollections()
  .then(async () => {
    console.log('✔ Firebase Firestore database connection active.');

    const User = require('./models/User');
    const Plan = require('./models/Plan');

    // ── Seed default testing accounts ──────────────────────────────────────
    try {
      const adminExists = await User.findOne({ where: { email: 'admin@prepai.com' } });
      if (!adminExists) {
        await User.create({ name: 'PrepAI Administrator', email: 'admin@prepai.com', password: 'password123', role: 'admin', otp: null, otpExpiry: null });
        console.log('✔ Seeded admin account: admin@prepai.com / password123');
      }

      const recruiterExists = await User.findOne({ where: { email: 'recruiter@prepai.com' } });
      if (!recruiterExists) {
        await User.create({ name: 'PrepAI Recruiter', email: 'recruiter@prepai.com', password: 'password123', role: 'recruiter', otp: null, otpExpiry: null });
        console.log('✔ Seeded recruiter account: recruiter@prepai.com / password123');
      }

      const candidateExists = await User.findOne({ where: { email: 'candidate@prepai.com' } });
      if (!candidateExists) {
        await User.create({ name: 'PrepAI Candidate', email: 'candidate@prepai.com', password: 'password123', role: 'candidate', otp: null, otpExpiry: null });
        console.log('✔ Seeded candidate account: candidate@prepai.com / password123');
      }
    } catch (e) {
      console.warn('⚠️ Account seeding failed:', e.message);
    }

    // ── Seed default subscription plans (INR) ──────────────────────────────
    try {
      const planCount = await Plan.count();
      if (planCount === 0) {
        await Plan.bulkCreate([
          {
            name: 'Free Starter',
            description: 'Perfect for exploring PrepAI with basic interview practice.',
            price: 0,
            currency: 'INR',
            billingInterval: 'free',
            interviewsAllowed: 3,
            isActive: true,
            isPopular: false,
            badgeColor: 'slate',
            sortOrder: 1,
            features: [
              '3 AI mock interviews per month',
              'Basic performance scoring',
              'Limited question bank access',
              'Email support'
            ]
          },
          {
            name: 'Pro Learner',
            description: 'Ideal for serious job seekers preparing for placements.',
            price: 49900,    // ₹499 in paise
            currency: 'INR',
            billingInterval: 'monthly',
            interviewsAllowed: 20,
            isActive: true,
            isPopular: true,
            badgeColor: 'primary',
            sortOrder: 2,
            features: [
              '20 AI mock interviews per month',
              'Full AI performance feedback',
              'Technical + HR + Aptitude rounds',
              'Monaco code editor access',
              'Resume parser & skill mapping',
              'Priority email support'
            ]
          },
          {
            name: 'Elite Placement',
            description: 'For power users targeting FAANG and top-tier companies.',
            price: 99900,    // ₹999 in paise
            currency: 'INR',
            billingInterval: 'monthly',
            interviewsAllowed: -1,  // unlimited
            isActive: true,
            isPopular: false,
            badgeColor: 'orange',
            sortOrder: 3,
            features: [
              'Unlimited AI mock interviews',
              'FAANG company-specific mock rounds',
              'Advanced AI evaluation with grammar analysis',
              'Interview recording & playback',
              'Recruiter visibility & profile boost',
              'Dedicated placement counsellor',
              '24/7 priority support'
            ]
          }
        ]);
        console.log('✔ Seeded default subscription plans (Free, Pro ₹499, Elite ₹999).');
      }
    } catch (e) {
      console.warn('⚠️ Plan seeding failed:', e.message);
    }

    // Only start listening when running directly (not via Vercel serverless)
    if (require.main === module) {
      app.listen(PORT, () => {
        console.log(`✔ Express server running locally on http://localhost:${PORT}`);
      });
    }
  })
  .catch(err => {
    console.error('❌ Failed to establish Firebase connection:', err.message);
  });

// Export app for Vercel serverless handler
module.exports = app;
