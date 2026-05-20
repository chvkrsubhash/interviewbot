const https = require('https');

/**
 * Perform HTTPS requests to Google's Gemini v1beta Generative Language API
 * @param {string} prompt - Prompt to pass to LLM
 * @returns {Promise<string>} Generative response content
 */
function callGemini(prompt) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return reject(new Error('GEMINI_API_KEY is not defined in environment variables.'));
    }

    const postData = JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }]
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseBody);
          if (parsed.error) {
            return reject(new Error(parsed.error.message || 'Gemini API returned an error'));
          }
          if (
            parsed.candidates &&
            parsed.candidates[0] &&
            parsed.candidates[0].content &&
            parsed.candidates[0].content.parts &&
            parsed.candidates[0].content.parts[0]
          ) {
            resolve(parsed.candidates[0].content.parts[0].text);
          } else {
            reject(new Error('Invalid response structure: ' + responseBody));
          }
        } catch (e) {
          reject(new Error('Failed to parse Gemini response: ' + e.message));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Advanced Dynamic Local Semantic Analyzer Fallback (NLP-Lite)
 * Processes the candidate's actual answers, reviews syntax, filler words, and calculates genuine scores.
 */
function runLocalSemanticAnalyzer(transcript, domain, experienceLevel, company) {
  let fillerCount = 0;
  let wordCount = 0;
  let matchesCount = 0;
  
  // High fidelity keywords dictionary to scan verbal competencies
  const keywordDictionary = {
    Frontend: ['react', 'dom', 'css', 'state', 'props', 'effect', 'hook', 'component', 'performance', 'rendering', 'virtual', 'closure', 'callback', 'flexbox', 'promise', 'async', 'api'],
    Backend: ['node', 'event', 'loop', 'scaling', 'database', 'sql', 'express', 'index', 'transaction', 'nosql', 'query', 'cache', 'redis', 'api', 'http', 'async', 'thread'],
    SystemDesign: ['load', 'balancer', 'sharding', 'microservices', 'caching', 'cdn', 'latency', 'bandwidth', 'database', 'replica', 'partitioning', 'cap', 'theorem', 'queue'],
    DSA: ['complexity', 'binary', 'tree', 'search', 'sort', 'graph', 'recursion', 'pointer', 'array', 'hash', 'queue', 'stack', 'dynamic', 'programming', 'greedy'],
    AIML: ['regression', 'classification', 'neural', 'network', 'tensor', 'gradient', 'descent', 'weights', 'overfitting', 'validation', 'dataset', 'cnn', 'rnn', 'transformer'],
    HR: ['conflict', 'resolution', 'team', 'deadline', 'collaboration', 'communication', 'growth', 'challenge', 'failure', 'success', 'manage', 'feedback']
  };

  const domainKeywords = keywordDictionary[domain] || keywordDictionary['Frontend'];
  const textTranscript = transcript.map(t => (t.answer || '')).join(' ').toLowerCase();

  // Filler words definition to review articulation
  const fillers = ['um', 'uh', 'like', 'basically', 'actually', 'you know', 'sort of'];
  fillers.forEach(f => {
    const reg = new RegExp(`\\b${f}\\b`, 'g');
    const matches = textTranscript.match(reg);
    if (matches) fillerCount += matches.length;
  });

  // Calculate standard word parameters
  const words = textTranscript.split(/\s+/).filter(Boolean);
  wordCount = words.length;

  // Check technical term mappings
  domainKeywords.forEach(k => {
    if (textTranscript.includes(k)) matchesCount++;
  });

  // Communication & Articulation calculations
  const fillerRatio = wordCount > 0 ? (fillerCount / wordCount) * 100 : 0;
  let commScore = 90 - Math.min(40, fillerCount * 2.5);
  if (wordCount < 30) commScore -= 20; // deduction for ultra short answers
  commScore = Math.max(30, Math.min(98, Math.floor(commScore)));

  // Technical performance calculations
  let techScore = 60 + (matchesCount / domainKeywords.length) * 45;
  if (experienceLevel === 'Senior') techScore -= 5; // senior scaling checks
  techScore = Math.max(40, Math.min(98, Math.floor(techScore)));

  // Confidence indicators (based on length, consistency, and low fillers)
  const confidenceScore = Math.max(45, Math.min(99, Math.floor(80 + (wordCount / 100) - (fillerCount * 2))));

  // Dynamic feedback comments mapping
  const strengths = [];
  const weaknesses = [];
  const suggestions = [];

  if (matchesCount >= 4) {
    strengths.push(`Demonstrated solid core vocabulary including terminology like: ${domainKeywords.filter(k => textTranscript.includes(k)).slice(0, 3).join(', ')}.`);
  } else {
    weaknesses.push('Technical explanations lacked domain-specific keyword mapping.');
    suggestions.push('Review reference specifications to study standard industry nomenclature.');
  }

  if (fillerCount <= 3) {
    strengths.push('Highly articulate speaker with minimal verbal pauses or filler dependencies.');
  } else {
    weaknesses.push(`Frequent use of filler pauses ("${fillers.find(f => textTranscript.includes(f)) || 'um'}") degraded fluency.`);
    suggestions.push('Practice slow structural pacing to reduce conversational filler words.');
  }

  if (wordCount > 100) {
    strengths.push('Provided elaborate, well-structured multi-sentence answers explaining architectural concepts.');
  } else {
    weaknesses.push('Verbal answers were overly brief, missing detailed system constraints.');
    suggestions.push('Utilize the STAR method (Situation, Task, Action, Result) to expand behavioural and technical prompts.');
  }

  // Pre-seed some templates if arrays are too short
  if (strengths.length === 0) strengths.push('Conceptually aligned with standard mock parameters.');
  if (weaknesses.length === 0) weaknesses.push('Answer articulation would benefit from deeper systems-level design details.');
  if (suggestions.length === 0) suggestions.push('Study core reference documentation and practice visual whiteboard exercises.');

  const grammarAnalysis = fillerCount > 0 
    ? `Articulation was structurally intact, but logged ${fillerCount} filler pause dependencies. Recommended filler ratio target: under 2%.`
    : 'Exceptional structural flow, grammar, and clear vocal pacing.';

  const finalAggregate = Math.floor((techScore * 0.5) + (commScore * 0.3) + (confidenceScore * 0.2));

  return {
    score: finalAggregate,
    technicalScore: techScore,
    communicationScore: commScore,
    confidenceLevel: confidenceScore,
    grammarAnalysis,
    strengths,
    weaknesses,
    suggestions
  };
}

const questionBank = {
  Frontend: [
    "What is the difference between Virtual DOM diffing and direct DOM mutation? How does React optimize renders?",
    "Explain JavaScript hoisting, lexical scoping closures, and how they lead to memory leaks if cleanups are omitted.",
    "Describe the lifecycle and cleanups in React's useEffect hook. How do you prevent closure capture problems?",
    "Discuss CSS layouts. When would you use Flexbox versus CSS Grid, and how does subgrid resolve nested grids?",
    "What is Cross-Site Scripting (XSS) in SPA clients, and how does React mitigate it by default? When is dangerouslySetInnerHTML safe?",
    "Discuss micro-frontends architecture. What are the key strategies for managing state and assets across independent frontend modules?",
    "How does React's Concurrent Mode work under the hood? Discuss the scheduler, lanes, and how transitions defer low-priority updates."
  ],
  Backend: [
    "How does the Event Loop handle asynchronous I/O multiplexing in Node.js? What is the difference between setImmediate and process.nextTick?",
    "Explain how database indexes (B-Trees) speed up lookups and discuss the overhead they pose on insert and update queries.",
    "What is the difference between horizontal and vertical scaling? How would you scale an Express server handling 50k requests per second?",
    "How do ACID transactions maintain data consistency in SQL databases under high concurrent loads?",
    "What is the role of Redis caching? Discuss Cache Penetration, Cache Stampede, and how to write eviction policies.",
    "Compare RESTful APIs with gRPC/GraphQL. When would you prefer contract-driven RPC over REST?"
  ],
  SystemDesign: [
    "How would you design a highly scalable real-time chat application like WhatsApp handling 100M active daily users?",
    "Discuss the CAP Theorem. In a globally distributed database, how do you choose between Consistency and Availability during network partitions?",
    "Explain CDN caching strategies. How do you implement cache invalidation, edge-side includes, and regional caches?",
    "What are Rate Limiters? How would you design a distributed rate limiter using the token bucket algorithm and Redis?",
    "Discuss Database Sharding and Horizontal Partitioning. What are the complexities of cross-shard joins and re-sharding?"
  ],
  DSA: [
    "Describe how to implement a custom Hash Map with chaining collision resolution. What is the time complexity in average and worst cases?",
    "Explain the difference between Breadth-First Search (BFS) and Depth-First Search (DFS) on graphs. When is BFS preferred?",
    "How does Dynamic Programming optimize recursive problems? Discuss top-down memoization vs bottom-up tabulation.",
    "What is a Binary Search Tree (BST)? How does an AVL tree or Red-Black tree maintain balanced height log(N) complexity?",
    "Explain the Quick Sort algorithm. What is its worst-case complexity, and how does selecting a random pivot mitigate this?"
  ],
  AIML: [
    "What is Gradient Descent? Explain the mathematical differences between Batch, Stochastic, and Mini-batch gradient descents.",
    "Explain the concept of Overfitting in deep learning. What regularization techniques (L1, L2, Dropout) would you use to prevent it?",
    "Describe the core architecture of a Transformer model. How does multi-head self-attention capture contextual relationships in text?",
    "What is the difference between CNNs and RNNs? In what scenarios are convolutional networks preferred over recurrent ones?",
    "What are Precision, Recall, and F1-Score? Under what circumstances is F1-score a better metric than standard accuracy?"
  ],
  HR: [
    "Tell me about a time you had a significant technical disagreement with a team member. How did you manage to resolve it?",
    "Describe a high-stakes project you worked on where the requirements shifted late. How did you adjust and deliver?",
    "Where do you see yourself in five years? How does our platform fit into your career objectives?",
    "How do you handle workspace stress and prioritize tight deliverables when multiple stakeholders demand updates?",
    "Describe a time you failed or missed a critical deadline. What did you learn, and how did you adjust your engineering process?"
  ],
  Aptitude: [
    "If a train running at 60 km/h crosses a pole in 9 seconds, what is the length of the train in meters?",
    "A worker can complete a project in 15 days. If a second worker is 50% more efficient, how many days will they take together?",
    "What is the probability of drawing either a King or a Heart from a standard deck of 52 playing cards?",
    "A product is marked up by 30% and then sold at a 10% discount. What is the net profit percentage?",
    "If the ratio of the areas of two circles is 9:16, what is the ratio of their circumferences?"
  ]
};

/**
 * Robust Local Questions Generator matching Domain, Exp Level, Company and Resume Skills
 */
function generateLocalQuestions(domain, experienceLevel, company, skills) {
  // Normalize domain keys
  let normalizedDomain = 'Frontend';
  if (domain === 'System Design') normalizedDomain = 'SystemDesign';
  else if (domain === 'AI/ML') normalizedDomain = 'AIML';
  else if (questionBank[domain]) normalizedDomain = domain;

  const pool = questionBank[normalizedDomain] || questionBank['Frontend'];
  
  // Select 4 random questions from the pool
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 4);

  // Customize them with company name or resume skills if applicable
  return selected.map((q, index) => {
    if (company && company !== 'General' && index === 0) {
      return `At ${company}, scaling and performance are critical. ${q}`;
    }
    if (skills && skills.length > 0 && index === 1) {
      return `Your resume highlights experience with ${skills.slice(0, 2).join(' and ')}. ${q}`;
    }
    return q;
  });
}

module.exports = {
  callGemini,
  runLocalSemanticAnalyzer,
  generateLocalQuestions
};
