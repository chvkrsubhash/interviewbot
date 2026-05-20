const express = require('express');
const router = express.Router();
const { protect } = require('./auth');
const { Interview, Feedback, User, Question } = require('../models');
const { callGemini, runLocalSemanticAnalyzer, generateLocalQuestions } = require('../utils/ai');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const execPromise = promisify(exec);

// Route: Get all interviews for current logged-in candidate
router.get('/', protect, async (req, res) => {
  try {
    const interviews = await Interview.findAll({
      where: { candidateId: req.user.id },
      include: [{ model: Feedback, as: 'feedback' }],
      order: [['createdAt', 'DESC']]
    });
    res.json(interviews);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving interviews', error: error.message });
  }
});

// Route: Get active coding questions for candidates
router.get('/coding-questions', protect, async (req, res) => {
  try {
    const questions = await Question.findAll({
      where: { type: 'coding', isActive: true },
      attributes: ['id', 'title', 'difficulty', 'description', 'constraints', 'testCases', 'starterCode'],
      order: [['createdAt', 'DESC']]
    });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching coding questions', error: error.message });
  }
});

// Route: Fetch specific interview session by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const interview = await Interview.findOne({
      where: { id: req.params.id, candidateId: req.user.id },
      include: [{ model: Feedback, as: 'feedback' }]
    });

    if (!interview) {
      return res.status(404).json({ message: 'Interview session not found' });
    }

    const data = interview.toJSON();
    if (data.feedback) {
      // Map confidence level and grammar for frontend standard
      data.feedback.confidence = data.feedback.confidenceLevel;
      data.feedback.grammar = data.feedback.grammarAnalysis;
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving interview session', error: error.message });
  }
});

// Route: Create new scheduled/active interview simulation
router.post('/setup', protect, async (req, res) => {
  const { title, domain, experienceLevel, type, company, skills } = req.body;
  try {
    let questions = [];
    
    // Check if there are active interview questions matching this domain in our SQLite Question bank!
    const dbQuestions = await Question.findAll({
      where: {
        type: 'interview',
        domain: domain,
        isActive: true
      }
    });

    if (dbQuestions && dbQuestions.length >= 4) {
      // Pick 4 random ones from our database bank
      const shuffled = dbQuestions.sort(() => 0.5 - Math.random());
      questions = shuffled.slice(0, 4).map(q => q.description || q.title);
      console.log(`✔ Pulled 4 interview questions from the custom SQLite question bank for domain: ${domain}`);
    } else if (process.env.GEMINI_API_KEY) {
      try {
        const prompt = `Generate exactly 4 highly realistic and challenging interview questions for a candidate with the following profile:
Domain: ${domain}
Experience Level: ${experienceLevel}
Target Company Focus: ${company || 'General'}
Parsed Resume Skills: ${skills && skills.length > 0 ? skills.join(', ') : 'None specified'}
Interview Type: ${type || 'technical'}

Respond ONLY with a JSON array of strings containing the 4 questions, e.g., ["question 1", "question 2", "question 3", "question 4"]. Do not include markdown code blocks or extra text.`;
        const responseText = await callGemini(prompt);
        const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        questions = JSON.parse(jsonStr);
      } catch (err) {
        console.error('Failed to generate questions with Gemini, falling back to local generator:', err);
        questions = generateLocalQuestions(domain, experienceLevel, company, skills);
      }
    } else {
      questions = generateLocalQuestions(domain, experienceLevel, company, skills);
    }

    const interview = await Interview.create({
      title: title || `${company || 'General'} ${domain} Mock Round`,
      domain,
      experienceLevel,
      type: type || 'technical',
      status: 'in_progress',
      candidateId: req.user.id,
      questions: questions
    });

    // After interview is created, send scheduling email to candidate
    const emailUtils = require('../utils/email');
    const interviewDetails = interview;
    const emailHtml = `<p>Dear ${req.user.name},</p><p>Your interview "${interviewDetails.title}" has been scheduled successfully.</p><p>Domain: ${interviewDetails.domain}<br/>Experience Level: ${interviewDetails.experienceLevel}<br/>Type: ${interviewDetails.type}</p><p>Good luck!</p>`;
    emailUtils.sendMail(req.user.email, 'Interview Scheduled', emailHtml)
      .then(() => console.log('Scheduling email sent'))
      .catch(err => console.error('Failed to send scheduling email:', err));
    res.status(201).json(interview);
  } catch (error) {
    res.status(500).json({ message: 'Error instantiating interview setup', error: error.message });
  }
});

// Route: Save completed interview evaluation & calculate visual ratings
router.post('/evaluate/:id', protect, async (req, res) => {
  const { tabSwitches, transcript } = req.body;
  try {
    const interview = await Interview.findOne({
      where: { id: req.params.id, candidateId: req.user.id }
    });

    if (!interview) {
      return res.status(404).json({ message: 'Target interview session not found' });
    }

    const totalSwitches = parseInt(tabSwitches || 0, 10);
    let evaluation;

    // ── Empty Answer Detection ────────────────────────────────────────────────
    // Count meaningful words the candidate actually spoke/typed (exclude default placeholder)
    const PLACEHOLDER = 'no verbal answer recorded';
    const totalMeaningfulWords = (transcript || []).reduce((sum, item) => {
      const rawAnswer = (item.answer || '').toLowerCase().trim();
      // Strip out placeholder strings and count what's left
      const cleaned = rawAnswer
        .replace(new RegExp(PLACEHOLDER, 'g'), '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .trim();
      return sum + cleaned.split(/\s+/).filter(Boolean).length;
    }, 0);

    if (totalMeaningfulWords < 8) {
      // Candidate submitted with no real answers — give a truthful score of 0
      evaluation = {
        score: 0,
        technicalScore: 0,
        communicationScore: 0,
        confidenceLevel: 0,
        grammarAnalysis: 'No verbal or written responses were recorded during this interview session. Evaluation cannot be completed without candidate input.',
        strengths: [
          'Successfully joined and launched the interview environment.',
          'Interview session was set up correctly with all permissions granted.'
        ],
        weaknesses: [
          'No answers were provided for any of the interview questions.',
          'Technical knowledge and communication skills could not be assessed.',
          'Confidence and articulation metrics were unavailable without verbal input.',
          'Session integrity is weakened by absence of candidate responses.'
        ],
        suggestions: [
          'Attempt to answer every question — even a partial response demonstrates engagement.',
          'Use the voice transcription button or type your answer manually in the text area.',
          'Prepare 2–3 key points for each question before starting the session.',
          'Practice mock answers using the preparation resources on the dashboard.'
        ]
      };
    } else if (process.env.GEMINI_API_KEY) {
      // ── AI Evaluation via Gemini ───────────────────────────────────────────
      try {
        const prompt = `You are an expert AI interviewer. Analyze the following transcript of a mock interview and provide detailed, professional, and rigorous feedback.
Domain: ${interview.domain}
Experience Level: ${interview.experienceLevel}
Interview Title: ${interview.title}
Tab Switches / Potential Cheating Detected: ${totalSwitches}

Transcript:
${JSON.stringify(transcript, null, 2)}

Please evaluate and respond ONLY with a JSON object of the following format:
{
  "score": (integer between 0 and 100, deducting heavily if cheating/tab switches are high),
  "technicalScore": (integer between 0 and 100),
  "communicationScore": (integer between 0 and 100),
  "confidenceLevel": (integer between 0 and 100),
  "grammarAnalysis": "detailed string of grammar & articulation analysis",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "suggestions": ["suggestion 1", "suggestion 2"],
  "remarks": ["critique for question 1 answer", "critique for question 2 answer", "critique for question 3 answer", "critique for question 4 answer"]
}
The "remarks" array must have exactly ${(transcript || []).length} entries — one focused critique per answer (50-80 words each), noting vocabulary usage, depth, clarity, and improvement tips.
Do not include markdown format or extra commentary, return only valid raw JSON.`;
        const responseText = await callGemini(prompt);
        const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        evaluation = JSON.parse(jsonStr);
      } catch (err) {
        console.error('Gemini evaluation failed, falling back to local semantic analyzer:', err);
        evaluation = runLocalSemanticAnalyzer(transcript, interview.domain, interview.experienceLevel, interview.title);
      }
    } else {
      // ── Local NLP Fallback ─────────────────────────────────────────────────
      evaluation = runLocalSemanticAnalyzer(transcript, interview.domain, interview.experienceLevel, interview.title);
    }

    // Apply tab-switch score deduction
    const scoreDeduction = totalSwitches * 12;
    let finalScore = evaluation.score;
    if (totalSwitches > 0) {
      finalScore = Math.max(0, evaluation.score - scoreDeduction);
      evaluation.technicalScore = Math.max(0, evaluation.technicalScore - scoreDeduction);
      evaluation.communicationScore = Math.max(0, evaluation.communicationScore - scoreDeduction);
    }

    interview.status = 'completed';
    interview.score = finalScore;
    interview.tabSwitches = totalSwitches;
    interview.cheated = totalSwitches > 0;
    await interview.save();

    // Persist Feedback record to database, mapping remarks into each transcript item
    const feedback = await Feedback.create({
      interviewId: interview.id,
      technicalScore: evaluation.technicalScore,
      communicationScore: evaluation.communicationScore,
      grammarAnalysis: evaluation.grammarAnalysis,
      confidenceLevel: evaluation.confidenceLevel,
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
      suggestions: evaluation.suggestions,
      transcript: (transcript || []).map((item, idx) => ({
        ...item,
        remarks: (evaluation.remarks && evaluation.remarks[idx])
          ? evaluation.remarks[idx]
          : `Your answer for question ${idx + 1} demonstrated basic understanding. Focus on adding concrete examples and technical depth to stand out in real interviews.`
      }))
    });

    // Update user streak and last active timestamp
    req.user.streak += 1;
    req.user.lastActive = new Date();
    await req.user.save();

    res.json({ interview, feedback });
  } catch (error) {
    res.status(500).json({ message: 'Error creating AI evaluation feedback', error: error.message });
  }
});

// Route: Execute user code in a local process sandbox
router.post('/run-code', protect, async (req, res) => {
  const { code, language, problemId } = req.body;
  
  if (!code || !language || !problemId) {
    return res.status(400).json({ message: 'Missing code, language or problemId' });
  }

  // Create temporary sandbox directory inside server/uploads/
  const sandboxDir = path.join(__dirname, '..', 'uploads', 'sandbox');
  if (!fs.existsSync(sandboxDir)) {
    fs.mkdirSync(sandboxDir, { recursive: true });
  }

  const sessionId = Date.now() + Math.random().toString(36).substring(2, 9);
  let fileName = '';
  let command = '';
  let fullCode = code;

  // Append runners based on problem and language
  if (problemId === 'two-sum') {
    if (language === 'javascript') {
      fileName = `two_sum_${sessionId}.js`;
      fullCode += `
// Test runner
try {
  const cases = [
    { nums: [2, 7, 11, 15], target: 9, expected: [0, 1] },
    { nums: [3, 2, 4], target: 6, expected: [1, 2] }
  ];
  cases.forEach((tc, idx) => {
    const res = twoSum(tc.nums, tc.target);
    const passed = JSON.stringify(res) === JSON.stringify(tc.expected) || JSON.stringify(res) === JSON.stringify([...tc.expected].reverse());
    console.log("TEST_CASE_" + (idx + 1) + "_RESULT: " + (passed ? "PASS" : "FAIL") + " | Got: " + JSON.stringify(res));
  });
} catch (e) {
  console.error("Runner Error: " + e.message);
}
`;
      command = `node "${path.join(sandboxDir, fileName)}"`;
    } else if (language === 'python') {
      fileName = `two_sum_${sessionId}.py`;
      fullCode += `
# Test runner
try:
    cases = [
        {"nums": [2, 7, 11, 15], "target": 9, "expected": [0, 1]},
        {"nums": [3, 2, 4], "target": 6, "expected": [1, 2]}
    ]
    func = None
    if 'two_sum' in globals():
        func = two_sum
    elif 'Solution' in globals():
        func = Solution().twoSum
        
    if func:
        for idx, tc in enumerate(cases):
            res = func(tc["nums"], tc["target"])
            passed = sorted(res) == sorted(tc["expected"])
            print(f"TEST_CASE_{idx + 1}_RESULT: {'PASS' if passed else 'FAIL'} | Got: {res}")
    else:
        print("Error: Target function (two_sum or Solution.twoSum) not found.")
except Exception as e:
    print("Runner Error:", str(e))
`;
      command = `python "${path.join(sandboxDir, fileName)}"`;
    } else if (language === 'cpp') {
      fileName = `two_sum_${sessionId}.cpp`;
      fullCode = `
#include <iostream>
#include <vector>
#include <unordered_map>
#include <string>
#include <algorithm>
using namespace std;

${code}

int main() {
    Solution solver;
    // Case 1
    vector<int> nums1 = {2, 7, 11, 15};
    vector<int> res1 = solver.twoSum(nums1, 9);
    bool p1 = (res1.size() == 2 && ((res1[0] == 0 && res1[1] == 1) || (res1[0] == 1 && res1[1] == 0)));
    cout << "TEST_CASE_1_RESULT: " << (p1 ? "PASS" : "FAIL") << " | Got: [";
    for(size_t i=0; i<res1.size(); i++) cout << res1[i] << (i==res1.size()-1 ? "" : ",");
    cout << "]" << endl;

    // Case 2
    vector<int> nums2 = {3, 2, 4};
    vector<int> res2 = solver.twoSum(nums2, 6);
    bool p2 = (res2.size() == 2 && ((res2[0] == 1 && res2[1] == 2) || (res2[0] == 2 && res2[1] == 1)));
    cout << "TEST_CASE_2_RESULT: " << (p2 ? "PASS" : "FAIL") << " | Got: [";
    for(size_t i=0; i<res2.size(); i++) cout << res2[i] << (i==res2.size()-1 ? "" : ",");
    cout << "]" << endl;
    return 0;
}
`;
      const binaryName = `two_sum_${sessionId}.exe`;
      command = `g++ "${path.join(sandboxDir, fileName)}" -o "${path.join(sandboxDir, binaryName)}" && "${path.join(sandboxDir, binaryName)}"`;
    } else if (language === 'java') {
      const sessionJavaDir = path.join(sandboxDir, `java_${sessionId}`);
      fs.mkdirSync(sessionJavaDir);
      fileName = path.join(`java_${sessionId}`, 'Solution.java');
      fullCode = `
import java.util.*;

${code}

class SolutionRunner {
    public static void main(String[] args) {
        Solution solver = new Solution();
        int[] res1 = solver.twoSum(new int[]{2, 7, 11, 15}, 9);
        boolean p1 = (res1.length == 2 && ((res1[0] == 0 && res1[1] == 1) || (res1[0] == 1 && res1[1] == 0)));
        System.out.println("TEST_CASE_1_RESULT: " + (p1 ? "PASS" : "FAIL") + " | Got: [" + (res1.length == 2 ? res1[0] + "," + res1[1] : "") + "]");

        int[] res2 = solver.twoSum(new int[]{3, 2, 4}, 6);
        boolean p2 = (res2.length == 2 && ((res2[0] == 1 && res2[1] == 2) || (res2[0] == 2 && res2[1] == 1)));
        System.out.println("TEST_CASE_2_RESULT: " + (p2 ? "PASS" : "FAIL") + " | Got: [" + (res2.length == 2 ? res2[0] + "," + res2[1] : "") + "]");
    }
}
`;
      command = `javac "${path.join(sessionJavaDir, 'Solution.java')}" && java -cp "${sessionJavaDir}" SolutionRunner`;
    }
  } else if (problemId === 'valid-palindrome') {
    if (language === 'javascript') {
      fileName = `val_pal_${sessionId}.js`;
      fullCode += `
try {
  const cases = [
    { input: "A man, a plan, a canal: Panama", expected: true },
    { input: "race a car", expected: false }
  ];
  cases.forEach((tc, idx) => {
    const res = isPalindrome(tc.input);
    const passed = res === tc.expected;
    console.log("TEST_CASE_" + (idx + 1) + "_RESULT: " + (passed ? "PASS" : "FAIL") + " | Got: " + res);
  });
} catch (e) {
  console.error("Runner Error: " + e.message);
}
`;
      command = `node "${path.join(sandboxDir, fileName)}"`;
    } else if (language === 'python') {
      fileName = `val_pal_${sessionId}.py`;
      fullCode += `
try {
    cases = [
        {"input": "A man, a plan, a canal: Panama", "expected": True},
        {"input": "race a car", "expected": False}
    ]
    func = None
    if 'is_palindrome' in globals():
        func = is_palindrome
    elif 'isPalindrome' in globals():
        func = isPalindrome
    elif 'Solution' in globals():
        func = Solution().isPalindrome
        
    if func:
        for idx, tc in enumerate(cases):
            res = func(tc["input"])
            passed = res == tc["expected"]
            print(f"TEST_CASE_{idx + 1}_RESULT: {'PASS' if passed else 'FAIL'} | Got: {res}")
    else:
        print("Error: Target function not found.")
except Exception as e:
    print("Runner Error:", str(e))
`;
      command = `python "${path.join(sandboxDir, fileName)}"`;
    } else if (language === 'cpp') {
      fileName = `val_pal_${sessionId}.cpp`;
      fullCode = `
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <cctype>
using namespace std;

${code}

int main() {
    Solution solver;
    bool r1 = solver.isPalindrome("A man, a plan, a canal: Panama");
    cout << "TEST_CASE_1_RESULT: " << (r1 == true ? "PASS" : "FAIL") << " | Got: " << (r1 ? "true" : "false") << endl;

    bool r2 = solver.isPalindrome("race a car");
    cout << "TEST_CASE_2_RESULT: " << (r2 == false ? "PASS" : "FAIL") << " | Got: " << (r2 ? "true" : "false") << endl;
    return 0;
}
`;
      const binaryName = `val_pal_${sessionId}.exe`;
      command = `g++ "${path.join(sandboxDir, fileName)}" -o "${path.join(sandboxDir, binaryName)}" && "${path.join(sandboxDir, binaryName)}"`;
    } else if (language === 'java') {
      const sessionJavaDir = path.join(sandboxDir, `java_${sessionId}`);
      fs.mkdirSync(sessionJavaDir);
      fileName = path.join(`java_${sessionId}`, 'Solution.java');
      fullCode = `
import java.util.*;

${code}

class SolutionRunner {
    public static void main(String[] args) {
        Solution solver = new Solution();
        boolean r1 = solver.isPalindrome("A man, a plan, a canal: Panama");
        System.out.println("TEST_CASE_1_RESULT: " + (r1 == true ? "PASS" : "FAIL") + " | Got: " + r1);

        boolean r2 = solver.isPalindrome("race a car");
        System.out.println("TEST_CASE_2_RESULT: " + (r2 == false ? "PASS" : "FAIL") + " | Got: " + r2);
    }
}
`;
      command = `javac "${path.join(sessionJavaDir, 'Solution.java')}" && java -cp "${sessionJavaDir}" SolutionRunner`;
    }
  } else {
    try {
      const dbProblem = await Question.findOne({
        where: { id: problemId, type: 'coding', isActive: true }
      });

      if (!dbProblem) {
        return res.status(404).json({ message: `Coding challenge not found: ${problemId}` });
      }

      const testCode = dbProblem.testCode && dbProblem.testCode[language];
      if (!testCode) {
        return res.status(400).json({ message: `No test runner code configured for language: ${language}` });
      }

      if (language === 'javascript') {
        fileName = `custom_js_${sessionId}.js`;
        fullCode = code + "\n\n" + testCode;
        command = `node "${path.join(sandboxDir, fileName)}"`;
      } else if (language === 'python') {
        fileName = `custom_py_${sessionId}.py`;
        fullCode = code + "\n\n" + testCode;
        command = `python "${path.join(sandboxDir, fileName)}"`;
      } else if (language === 'cpp') {
        fileName = `custom_cpp_${sessionId}.cpp`;
        if (testCode.includes('//{{CANDIDATE_CODE}}')) {
          fullCode = testCode.replace('//{{CANDIDATE_CODE}}', code);
        } else {
          fullCode = testCode + "\n\n" + code;
        }
        const binaryName = `custom_cpp_${sessionId}.exe`;
        command = `g++ "${path.join(sandboxDir, fileName)}" -o "${path.join(sandboxDir, binaryName)}" && "${path.join(sandboxDir, binaryName)}"`;
      } else if (language === 'java') {
        const sessionJavaDir = path.join(sandboxDir, `java_${sessionId}`);
        fs.mkdirSync(sessionJavaDir);
        fileName = path.join(`java_${sessionId}`, 'Solution.java');
        if (testCode.includes('//{{CANDIDATE_CODE}}')) {
          fullCode = testCode.replace('//{{CANDIDATE_CODE}}', code);
        } else {
          fullCode = testCode + "\n\n" + code;
        }
        command = `javac "${path.join(sessionJavaDir, 'Solution.java')}" && java -cp "${sessionJavaDir}" SolutionRunner`;
      } else {
        return res.status(400).json({ message: `Unsupported sandbox language: ${language}` });
      }
    } catch (dbErr) {
      return res.status(500).json({ message: 'Error retrieving dynamic coding challenge', error: dbErr.message });
    }
  }

  const filePath = path.join(sandboxDir, fileName);

  try {
    // Write full execution code to sandbox
    fs.writeFileSync(filePath, fullCode);

    // Execute process
    const { stdout, stderr } = await execPromise(command, { timeout: 8000 });
    
    // Cleanup temporary files
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      if (language === 'cpp') {
        const binPath = filePath.replace('.cpp', '.exe');
        if (fs.existsSync(binPath)) fs.unlinkSync(binPath);
      } else if (language === 'java') {
        const sessionJavaDir = path.join(sandboxDir, `java_${sessionId}`);
        if (fs.existsSync(sessionJavaDir)) {
          fs.rmSync(sessionJavaDir, { recursive: true, force: true });
        }
      }
    } catch (err) {
      console.warn("Sandbox cleanup warning:", err.message);
    }

    res.json({
      stdout: stdout || '',
      stderr: stderr || '',
      success: true
    });

  } catch (error) {
    // Return stdout / stderr even if process failed (compilation errors, runtime exceptions)
    res.json({
      stdout: error.stdout || '',
      stderr: error.stderr || error.message || 'Execution failed.',
      success: false
    });
  }
});

module.exports = router;
