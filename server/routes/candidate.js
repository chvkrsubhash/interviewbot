const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const path = require('path');
const fs = require('fs');

// Configure multer storage (in memory)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /\.(pdf|doc|docx)$/i;
    if (!allowed.test(file.originalname)) {
      return cb(new Error('Only PDF, DOC, DOCX files are allowed'));
    }
    cb(null, true);
  }
});

// Simple keyword based skill extraction (can be enhanced later)
const skillDictionary = [
  'javascript', 'node.js', 'react', 'express', 'mongodb', 'sql', 'sqlite', 'sequelize', 'python', 'java', 'c++', 'c#', 'git', 'docker', 'aws', 'azure',
  'html', 'css', 'typescript', 'graphql', 'rest', 'api', 'microservices', 'machine learning', 'deep learning', 'nlp', 'data analysis', 'statistics'
];

function extractSkills(text) {
  const lower = text.toLowerCase();
  const found = new Set();
  skillDictionary.forEach(skill => {
    if (lower.includes(skill)) {
      // preserve original capitalisation for display
      found.add(skill.charAt(0).toUpperCase() + skill.slice(1));
    }
  });
  return Array.from(found);
}

// Very naive domain & experience detection (mirrors client mock logic)
function detectDomainAndExp(filename) {
  const name = filename.toLowerCase();
  let domain = 'Frontend';
  if (name.includes('backend') || name.includes('node') || name.includes('python')) domain = 'Backend';
  else if (name.includes('ai') || name.includes('ml') || name.includes('data')) domain = 'AI/ML';
  else if (name.includes('design') || name.includes('system')) domain = 'System Design';
  else if (name.includes('dsa') || name.includes('algo')) domain = 'DSA';

  let exp = 'Entry';
  if (name.includes('senior') || name.includes('lead')) exp = 'Senior';
  else if (name.includes('junior') || name.includes('intern')) exp = 'Entry';
  else exp = 'Mid';

  return { domain, exp };
}

router.post('/parse-resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No resume file uploaded' });
    }
    // Extract text from PDF (if PDF). For DOC/DOCX we fallback to empty string for now.
    let rawText = '';
    if (req.file.mimetype === 'application/pdf') {
      rawText = (await pdfParse(req.file.buffer)).text;
    } else {
      // In a full implementation, you'd use a library like "docx" or "mammoth".
      rawText = '';
    }
    const skills = extractSkills(rawText);
    const { domain, exp } = detectDomainAndExp(req.file.originalname);
    return res.json({ detectedDomain: domain, detectedExp: exp, skills });
  } catch (err) {
    console.error('Resume parsing error:', err);
    return res.status(500).json({ message: 'Failed to parse resume', error: err.message });
  }
});

module.exports = router;
