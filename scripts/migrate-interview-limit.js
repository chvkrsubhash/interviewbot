// Migration script to set default interviewsAllowed to 1 for existing plans
// Run with: node scripts/migrate-interview-limit.js

const { db } = require('../server/config/firebase');

(async () => {
  try {
    const snapshot = await db.collection('plans').get();
    const docs = snapshot.docs || [];
    const batch = db.batch();
    let updatedCount = 0;

    docs.forEach(doc => {
      const data = doc.data();
      // If interviewsAllowed is missing or still the old default (5), set to 1
      if (data.interviewsAllowed === undefined || data.interviewsAllowed === 5) {
        batch.update(doc.ref, { interviewsAllowed: 1 });
        updatedCount++;
        console.log(`Will update plan ${doc.id}`);
      }
    });

    if (updatedCount === 0) {
      console.log('No plans required updating.');
      process.exit(0);
    }

    await batch.commit();
    console.log(`Migration complete. Updated ${updatedCount} plan(s).`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
})();
