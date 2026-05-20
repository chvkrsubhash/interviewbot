const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load env variables immediately
dotenv.config();

const { db } = require('./config/firebase');

// ── Shared maintenance mode state (separate module to avoid circular require)
const maintenanceMode = require('./config/maintenance');

const app = express();

// Maintenance mode middleware — blocks all API except admin and auth
const maintenanceMiddleware = (req, res, next) => {
  if (!maintenanceMode.enabled) return next();
  const allowed = ['/api/auth', '/api/admin'];
  if (allowed.some(prefix => req.path.startsWith(prefix))) return next();
  return res.status(503).json({
    maintenance: true,
    message: maintenanceMode.message,
    estimatedTime: maintenanceMode.estimatedTime
  });
};

// ── API Routes (MUST be before static/catch-all) ─────────────────────────────
const { router: authRouter } = require('./routes/auth');
const interviewRouter = require('./routes/interview');
const candidateRouter = require('./routes/candidate');
const recruiterRouter = require('./routes/recruiter');
const adminRouter = require('./routes/admin');
const paymentsRouter = require('./routes/payments');

// Middlewares
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(maintenanceMiddleware);

<<<<<<< HEAD
// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Register API routes
=======
>>>>>>> b623a394938160d86341de5fb930dc544f34cb3b
app.use('/api/auth', authRouter);
app.use('/api/interview', interviewRouter);
app.use('/api/recruiter', recruiterRouter);
app.use('/api/admin', adminRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/candidate', candidateRouter);

<<<<<<< HEAD

=======
// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
>>>>>>> b623a394938160d86341de5fb930dc544f34cb3b

// Serve React client build (static assets)
app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));

// Fallback to index.html for client-side routing (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
});

const PORT = process.env.PORT || 5000;

async function initAndSeed() {
  try {
    await db.listCollections();
    console.log('✔ Firebase Firestore database connection active.');

    const User = require('./models/User');
    const Plan = require('./models/Plan');

    // ── Seed default testing accounts
    try {
      const adminExists = await User.findOne({ where: { email: 'admin@prepai.com' } });
      if (!adminExists) {
        await User.create({ name: 'PrepAI Administrator', email: 'admin@prepai.com', password: 'password123', role: 'admin', otp: null, otpExpiry: null, isVerified: true });
        console.log('✔ Seeded admin account: admin@prepai.com / password123');
      }

      const recruiterExists = await User.findOne({ where: { email: 'recruiter@prepai.com' } });
      if (!recruiterExists) {
        await User.create({ name: 'PrepAI Recruiter', email: 'recruiter@prepai.com', password: 'password123', role: 'recruiter', otp: null, otpExpiry: null, isVerified: true });
        console.log('✔ Seeded recruiter account: recruiter@prepai.com / password123');
      }

      const candidateExists = await User.findOne({ where: { email: 'candidate@prepai.com' } });
      if (!candidateExists) {
        await User.create({ name: 'PrepAI Candidate', email: 'candidate@prepai.com', password: 'password123', role: 'candidate', otp: null, otpExpiry: null, isVerified: true });
        console.log('✔ Seeded candidate account: candidate@prepai.com / password123');
      }
    } catch (e) {
      console.warn('⚠️ Account seeding failed:', e.message);
    }

    // ── Seed default subscription plans (INR)
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
            price: 49900,
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
            price: 99900,
            currency: 'INR',
            billingInterval: 'monthly',
            interviewsAllowed: -1,
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

  } catch (err) {
    console.error('❌ Failed to establish Firebase connection:', err.message);
  }
}

// Fire-and-forget — does NOT block the export
initAndSeed();

// Start listening when running directly (not via Vercel serverless)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`✔ Express server running locally on http://localhost:${PORT}`);
  });
}

// Export app for Vercel serverless handler
module.exports = app;
