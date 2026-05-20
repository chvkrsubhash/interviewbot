import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import {
  FileText, Upload, Sparkles, AlertCircle, Building2, Check, ArrowRight, Loader2
} from 'lucide-react';

const domains = ['Frontend', 'Backend', 'AI/ML', 'HR', 'Aptitude', 'DSA', 'System Design'];
const experienceLevels = ['Entry', 'Mid', 'Senior'];
const interviewTypes = [
  { id: 'technical', label: 'Technical Round', desc: 'Questions on algorithms, frameworks, and architecture.' },
  { id: 'behavioral', label: 'HR Behavioral Round', desc: 'STAR methodology scenario evaluations.' },
  { id: 'coding', label: 'Coding Assessment', desc: 'Monaco live programming and logic runner.' }
];

const companies = [
  { name: 'Google', theme: 'border-blue-500/20 text-blue-500 hover:bg-blue-500/5' },
  { name: 'Amazon', theme: 'border-orange-500/20 text-orange-500 hover:bg-orange-500/5' },
  { name: 'Microsoft', theme: 'border-green-500/20 text-green-500 hover:bg-green-500/5' },
  { name: 'TCS', theme: 'border-cyan-500/20 text-cyan-500 hover:bg-cyan-500/5' },
  { name: 'Infosys', theme: 'border-indigo-500/20 text-indigo-500 hover:bg-indigo-500/5' },
  { name: 'Accenture', theme: 'border-purple-500/20 text-purple-500 hover:bg-purple-500/5' }
];

// SVG BrainCircuit icon (fallback)
function BrainCircuit({ className, size }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2v8" /><path d="M12 14v8" /><path d="M22 12H14" /><path d="M10 12H2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M16.5 7.5l-4.5 4.5" /><path d="M7.5 16.5l4.5-4.5" />
      <path d="M7.5 7.5l4.5 4.5" /><path d="M16.5 16.5l-4.5-4.5" />
    </svg>
  );
}

export default function InterviewSetup() {
  const navigate = useNavigate();
  const [domain, setDomain] = useState('Frontend');
  const [experience, setExperience] = useState('Entry');
  const [interviewType, setInterviewType] = useState('technical');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Resume parsing states
  const [resume, setResume] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState(null);

  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setResume(file);
    setParsing(true);
    setParsedData(null);

    // Send file to backend for parsing
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('resume', file);
    fetch('/api/candidate/parse-resume', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          throw new Error(data.message || 'Failed to parse resume');
        }
        setParsedData(data);
        setDomain(data.detectedDomain);
        setExperience(data.detectedExp);
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => setParsing(false));
  };

  const handleStartSimulation = async () => {
    setLoading(true);
    setError('');

    if (interviewType === 'coding') {
      navigate('/candidate/coding');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/interview/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: `${company || 'General'} ${domain} Mock Round`,
          domain,
          experienceLevel: experience,
          type: interviewType,
          company: company || 'General',
          skills: parsedData ? parsedData.skills : ['General Domain Knowledge']
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create interview session');

      // Save interview session ID and AI-generated questions for the simulator
      localStorage.setItem('active_interview_id', data.id);
      localStorage.setItem('active_interview_questions', JSON.stringify(data.questions));
      localStorage.setItem('active_interview_config', JSON.stringify({
        domain,
        experience,
        type: interviewType,
        company: company || 'General',
        skills: parsedData ? parsedData.skills : [],
        title: data.title
      }));

      navigate('/candidate/simulate');
    } catch (err) {
      setError(err.message || 'Could not start interview session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Header title="Interview Wizard" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wizard Form Panels */}
        <div className="glass-premium rounded-3xl p-6 lg:col-span-2 space-y-6">
          {/* Step 1: Select Domain */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary-500/10 text-primary-500 flex items-center justify-center text-xs font-extrabold">1</span>
              Select Tech Domain
            </h3>
            <div className="flex flex-wrap gap-2">
              {domains.map((d) => (
                <button
                  key={d}
                  onClick={() => setDomain(d)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider border transition-all ${
                    domain === d
                      ? 'bg-primary-500 border-primary-500 text-white shadow-md shadow-primary-500/15'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Experience level */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary-500/10 text-primary-500 flex items-center justify-center text-xs font-extrabold">2</span>
              Experience Level
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {experienceLevels.map((exp) => (
                <button
                  key={exp}
                  onClick={() => setExperience(exp)}
                  className={`py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider border transition-all ${
                    experience === exp
                      ? 'bg-primary-500 border-primary-500 text-white shadow-md'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                  }`}
                >
                  {exp} Level
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Interview Form Type */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary-500/10 text-primary-500 flex items-center justify-center text-xs font-extrabold">3</span>
              Select Interview Type
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {interviewTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setInterviewType(type.id)}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    interviewType === type.id
                      ? 'border-primary-500 bg-primary-500/5 ring-1 ring-primary-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                  }`}
                >
                  <div className="font-bold text-sm text-slate-800 dark:text-white mb-1">{type.label}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 font-semibold">{type.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 4: Company rounds */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary-500/10 text-primary-500 flex items-center justify-center text-xs font-extrabold">4</span>
              Mock Company Rounds (Optional)
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {companies.map((comp) => (
                <button
                  key={comp.name}
                  onClick={() => setCompany(company === comp.name ? '' : comp.name)}
                  className={`py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                    company === comp.name
                      ? 'bg-slate-800 border-slate-800 text-white dark:bg-white dark:border-white dark:text-dark-950'
                      : `border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:scale-102`
                  }`}
                >
                  <Building2 size={12} />
                  {comp.name}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 text-sm font-semibold border border-rose-100 dark:border-rose-950/30 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleStartSimulation}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-primary-500/15 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Generating AI Questions...
              </>
            ) : (
              <>
                Launch Interview Environment <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>

        {/* Right Panel: Resume upload and parsing summary */}
        <div className="space-y-6">
          {/* Uploader panel */}
          <div className="glass-premium rounded-3xl p-6 space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <BrainCircuit className="text-primary-500" size={18} />
              AI Resume Parser
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">
              Upload your resume. Our AI parser will analyze skills and map interview questions directly to your resume contents.
            </p>

            <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary-500/40 transition-colors">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="text-slate-400 mb-2" size={24} />
              <div className="font-bold text-sm text-slate-700 dark:text-slate-300">
                {resume ? resume.name : 'Upload Resume File'}
              </div>
              <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">PDF, DOC, DOCX up to 5MB</div>
            </div>

            {parsing && (
              <div className="flex items-center justify-center gap-2 py-4 text-xs font-bold text-primary-500">
                <Loader2 size={16} className="animate-spin" />
                Analyzing skills & projects...
              </div>
            )}

            {parsedData && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-950/20 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                  <Check size={14} /> Resume Parsed Successfully
                </div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Detected <span className="font-bold text-slate-700 dark:text-slate-200">{parsedData.detectedDomain}</span> domain at a{' '}
                  <span className="font-bold text-slate-700 dark:text-slate-200">{parsedData.detectedExp}</span> level.
                </div>
                <div className="flex flex-wrap gap-1 pt-1.5">
                  {parsedData.skills.map((s, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-[10px] font-bold">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick instructions alert */}
          <div className="glass-premium rounded-3xl p-6 border-l-4 border-amber-500 bg-amber-500/5 space-y-2">
            <h4 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
              <AlertCircle size={16} className="text-amber-500" />
              Environment Rules
            </h4>
            <ul className="text-xs text-slate-400 dark:text-slate-500 font-semibold space-y-1 list-disc pl-4">
              <li>Ensure webcam & microphone permission are granted.</li>
              <li>Remain in full-screen; tab switching will trigger cheating logs.</li>
              <li>Answer clearly; follow-up questions depend on your logic.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
