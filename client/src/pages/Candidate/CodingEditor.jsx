import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Editor from '@monaco-editor/react';
import { Play, RotateCcw, AlertTriangle, CheckCircle, Terminal, HelpCircle, Code2, Loader2 } from 'lucide-react';

const problemsList = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    desc: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.'
    ],
    testCases: [
      { input: 'nums = [2,7,11,15], target = 9', expected: '[0,1]' },
      { input: 'nums = [3,2,4], target = 6', expected: '[1,2]' }
    ],
    defaultCode: {
      javascript: `function twoSum(nums, target) {\n    // Write your logic here\n    const map = new Map();\n    for(let i=0; i<nums.length; i++) {\n        const diff = target - nums[i];\n        if(map.has(diff)) {\n            return [map.get(diff), i];\n        }\n        map.set(nums[i], i);\n    }\n    return [];\n}`,
      python: `def two_sum(nums, target):\n    # Write your logic here\n    hashmap = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in hashmap:\n            return [hashmap[complement], i]\n        hashmap[num] = i\n    return []`,
      cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        unordered_map<int, int> hashmap;\n        for (int i = 0; i < nums.size(); i++) {\n            int complement = target - nums[i];\n            if (hashmap.count(complement)) {\n                return {hashmap[complement], i};\n            }\n            hashmap[nums[i]] = i;\n        }\n        return {};\n    }\n};`,
      java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        Map<Integer, Integer> map = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int complement = target - nums[i];\n            if (map.containsKey(complement)) {\n                return new int[] { map.get(complement), i };\n            }\n            map.put(nums[i], i);\n        }\n        return new int[] {};\n    }\n}`
    }
  },
  {
    id: 'valid-palindrome',
    title: 'Valid Palindrome',
    difficulty: 'Easy',
    desc: 'A phrase is a palindrome if, after converting all uppercase characters into lowercase characters and removing all non-alphanumeric characters, it reads the same forward and backward.\n\nGiven a string `s`, return `true` if it is a palindrome, or `false` otherwise.',
    constraints: [
      '1 <= s.length <= 2 * 10^5',
      's consists only of printable ASCII characters.'
    ],
    testCases: [
      { input: 's = "A man, a plan, a canal: Panama"', expected: 'true' },
      { input: 's = "race a car"', expected: 'false' }
    ],
    defaultCode: {
      javascript: `function isPalindrome(s) {\n    // Write your logic here\n    const cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, "");\n    return cleaned === cleaned.split("").reverse().join("");\n}`,
      python: `def is_palindrome(s: str) -> bool:\n    # Write your logic here\n    cleaned = "".join(char.lower() for char in s if char.isalnum())\n    return cleaned == cleaned[::-1]`,
      cpp: `class Solution {\npublic:\n    bool isPalindrome(string s) {\n        string cleaned = "";\n        for(char c : s) {\n            if(isalnum(c)) cleaned += tolower(c);\n        }\n        string rev = cleaned;\n        reverse(rev.begin(), rev.end());\n        return cleaned == rev;\n    }\n};`,
      java: `class Solution {\n    public boolean isPalindrome(String s) {\n        String cleaned = s.toLowerCase().replaceAll("[^a-zA-Z0-9]", "");\n        String rev = new StringBuilder(cleaned).reverse().toString();\n        return cleaned.equals(rev);\n    }\n}`
    }
  }
];

export default function CodingEditor() {
  const [problems, setProblems] = useState(problemsList);
  const [activeProblem, setActiveProblem] = useState(problemsList[0]);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(problemsList[0].defaultCode['javascript']);
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [runError, setRunError] = useState(null);

  useEffect(() => {
    const fetchDbQuestions = async () => {
      try {
        const token = localStorage.getItem('token');
        const r = await fetch('/api/interview/coding-questions', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (r.ok) {
          const dbQ = await r.json();
          const mappedQ = dbQ.map(q => ({
            id: q.id,
            title: q.title,
            difficulty: q.difficulty,
            desc: q.description,
            constraints: q.constraints || [],
            testCases: q.testCases || [],
            defaultCode: q.starterCode || { javascript: '', python: '', cpp: '', java: '' }
          }));
          setProblems([...problemsList, ...mappedQ]);
        }
      } catch (err) {
        console.error("Error fetching db coding questions:", err);
      }
    };
    fetchDbQuestions();
  }, []);

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setLanguage(lang);
    setCode(activeProblem.defaultCode[lang]);
    setResults(null);
    setConsoleLogs([]);
    setRunError(null);
  };

  const handleProblemChange = (prob) => {
    setActiveProblem(prob);
    setCode(prob.defaultCode[language]);
    setConsoleLogs([]);
    setResults(null);
    setRunError(null);
  };

  const handleReset = () => {
    setCode(activeProblem.defaultCode[language]);
    setConsoleLogs([]);
    setResults(null);
    setRunError(null);
  };

  const handleRunCode = async () => {
    setRunning(true);
    setConsoleLogs(['⚡ Sending code to execution sandbox...']);
    setResults(null);
    setRunError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/interview/run-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code,
          language,
          problemId: activeProblem.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Server error during code execution');
      }

      const { stdout, stderr, success } = data;

      // Parse test case results from stdout
      const lines = stdout.split('\n').filter(Boolean);
      const testResultLines = lines.filter(l => l.includes('TEST_CASE_'));
      const otherLines = lines.filter(l => !l.includes('TEST_CASE_'));

      const logs = [];
      if (otherLines.length > 0) logs.push(...otherLines);
      if (success) {
        logs.push('✔ Sandbox execution complete.');
      } else {
        logs.push('⚠ Process exited with errors.');
      }
      if (stderr) {
        logs.push('─── stderr ───');
        logs.push(...stderr.split('\n').filter(Boolean));
      }
      setConsoleLogs(logs);

      // Parse test case pass/fail
      const parsedCases = activeProblem.testCases.map((tc, idx) => {
        const matchLine = testResultLines.find(l => l.includes(`TEST_CASE_${idx + 1}_RESULT:`));
        if (!matchLine) return { case: tc.input, status: success ? 'pass' : 'fail', got: 'N/A' };
        const passed = matchLine.includes(': PASS');
        const gotMatch = matchLine.match(/Got:\s*(.+)/);
        return {
          case: tc.input,
          status: passed ? 'pass' : 'fail',
          got: gotMatch ? gotMatch[1].trim() : 'N/A'
        };
      });

      const passedCount = parsedCases.filter(c => c.status === 'pass').length;
      setResults({
        status: passedCount === parsedCases.length ? 'success' : 'failed',
        passed: passedCount,
        failed: parsedCases.length - passedCount,
        details: parsedCases
      });

    } catch (err) {
      setConsoleLogs([`❌ Execution Error: ${err.message}`]);
      setRunError(err.message);
      setResults({ status: 'error', message: err.message });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <Header title="Monaco Coding Studio" />

      {/* Selector ribbon */}
      <div className="flex justify-between items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex gap-2">
          {problems.map((prob) => (
            <button
              key={prob.id}
              onClick={() => handleProblemChange(prob)}
              className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wide border transition-all ${
                activeProblem.id === prob.id
                  ? 'bg-slate-800 border-slate-800 text-white dark:bg-white dark:border-white dark:text-dark-950'
                  : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              {prob.title}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={handleLanguageChange}
            className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs focus:outline-none"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python 3</option>
            <option value="cpp">C++ (GCC)</option>
            <option value="java">Java 17</option>
          </select>

          <button
            onClick={handleReset}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            title="Reset code editor"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Side: Question Details */}
        <div className="glass-premium rounded-3xl p-6 lg:col-span-2 space-y-6 flex flex-col justify-between h-[520px] overflow-y-auto">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-extrabold text-lg text-slate-800 dark:text-white flex items-center gap-1.5">
                <Code2 className="text-primary-500" size={20} />
                {activeProblem.title}
              </h2>
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 font-extrabold text-[10px] uppercase">
                {activeProblem.difficulty}
              </span>
            </div>

            <p className="text-sm font-semibold text-slate-600 dark:text-slate-350 leading-relaxed whitespace-pre-line">
              {activeProblem.desc}
            </p>

            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase text-slate-400">Constraints:</h4>
              <ul className="text-xs font-semibold text-slate-500 dark:text-slate-400 space-y-1 list-disc pl-4">
                {activeProblem.constraints.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Test cases representation */}
          <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
            <h4 className="font-bold text-xs uppercase text-slate-400 flex items-center gap-1">
              <HelpCircle size={12} /> Predefined Test Cases:
            </h4>
            {activeProblem.testCases.map((tc, index) => (
              <div key={index} className="p-3 rounded-xl bg-slate-50 dark:bg-dark-900/50 border border-slate-200/50 dark:border-slate-800/80 text-xs font-semibold">
                <div className="text-slate-400 font-medium">Case {index + 1}: <code className="text-slate-700 dark:text-slate-200 font-mono">{tc.input}</code></div>
                <div className="text-slate-400 font-medium mt-1">Expected: <code className="text-primary-500 font-mono">{tc.expected}</code></div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Editor and Output */}
        <div className="lg:col-span-3 flex flex-col justify-between h-[520px] gap-4">
          {/* Monaco Editor Container */}
          <div className="flex-1 rounded-3xl overflow-hidden border border-slate-200/60 dark:border-slate-800/80 shadow-md">
            <Editor
              height="100%"
              language={language === 'cpp' ? 'cpp' : language}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value)}
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                fontFamily: 'JetBrains Mono, Fira Code, monospace',
                lineHeight: 20,
                padding: { top: 12 }
              }}
            />
          </div>

          {/* Run Command Button & Console */}
          <div className="glass-premium rounded-3xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1 text-slate-400 font-extrabold text-xs uppercase">
                <Terminal size={14} className="text-primary-500" />
                <span>Console Log / Test Suite</span>
              </div>
              
              <button
                onClick={handleRunCode}
                disabled={running}
                className="px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-60 active:scale-95 flex items-center gap-1.5 shadow-md shadow-primary-500/10"
              >
                {running ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} fill="currentColor" />}
                {running ? 'Executing...' : 'Run Code'}
              </button>
            </div>

            {/* Logs display */}
            <div className="h-36 rounded-2xl bg-slate-900 border border-slate-800 p-4 font-mono text-xs overflow-y-auto text-slate-300 space-y-1.5">
              {consoleLogs.map((log, index) => (
                <div key={index} className={`leading-relaxed ${log.startsWith('❌') || log.startsWith('⚠') ? 'text-rose-400' : log.startsWith('✔') ? 'text-emerald-400' : log.startsWith('─') ? 'text-slate-500' : 'text-slate-300'}`}>
                  {log}
                </div>
              ))}
              
              {/* Test results detail block */}
              {results && results.status === 'success' && (
                <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <CheckCircle size={14} /> All Tests Passed ({results.passed}/{results.passed})
                  </div>
                  {results.details.map((det, index) => (
                    <div key={index} className="text-slate-400 text-[10px] pl-5">
                      Case {index + 1}: Expected <span className="text-primary-400 font-mono">{activeProblem.testCases[index].expected}</span> | Got <span className="text-emerald-400 font-mono">{det.got}</span>
                    </div>
                  ))}
                </div>
              )}

              {results && results.status === 'failed' && (
                <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                  <div className="flex items-center gap-1.5 font-bold text-rose-400">
                    <AlertTriangle size={14} /> Test Suite Failed ({results.passed} Passed | {results.failed} Failed)
                  </div>
                  {results.details.map((det, index) => (
                    <div key={index} className="text-slate-400 text-[10px] pl-5 flex gap-2">
                      <span>Case {index + 1}:</span>
                      <span className={det.status === 'pass' ? 'text-emerald-400' : 'text-rose-400'}>
                        {det.status === 'pass' ? 'PASSED' : `FAILED (Expected ${activeProblem.testCases[index].expected} but got ${det.got})`}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {results && results.status === 'error' && (
                <div className="pt-2 border-t border-slate-800/60 text-rose-400 font-bold">
                  ❌ {results.message}
                </div>
              )}

              {!running && consoleLogs.length === 0 && (
                <span className="text-slate-500 italic">Hit 'Run Code' to execute against test cases...</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
