import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../../components/Header';
import {
  FileText, Award, Calendar, CheckCircle2, XCircle, Share2, Clipboard, ArrowLeft,
  ChevronRight, ThumbsUp, AlertCircle, Compass, Star, Loader2
} from 'lucide-react';

export default function InterviewReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setError('');

      // 1. Try fetching from the database first
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(`/api/interview/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const dbData = await response.json();

          // Normalize DB data into the component's expected format
          const normalized = {
            id: dbData.id,
            title: dbData.title,
            domain: dbData.domain,
            experience: dbData.experienceLevel,
            score: dbData.score || 0,
            date: new Date(dbData.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            cheated: dbData.cheated || false,
            tabSwitches: dbData.tabSwitches || 0,
            transcript: dbData.feedback?.transcript || [],
            feedback: {
              technicalScore: dbData.feedback?.technicalScore || 0,
              communicationScore: dbData.feedback?.communicationScore || 0,
              confidence: dbData.feedback?.confidenceLevel || dbData.feedback?.confidence || 0,
              grammar: dbData.feedback?.grammarAnalysis || 'No grammar analysis available.',
              strengths: parseJsonField(dbData.feedback?.strengths, ['Strong conceptual understanding']),
              weaknesses: parseJsonField(dbData.feedback?.weaknesses, ['Areas for improvement identified']),
              suggestions: parseJsonField(dbData.feedback?.suggestions, ['Continue practicing mock interviews'])
            }
          };
          setData(normalized);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('DB fetch failed, trying localStorage:', err);
      }

      // 2. Fallback to localStorage
      try {
        const stored = localStorage.getItem('completed_interviews');
        if (stored) {
          const parsed = JSON.parse(stored);
          const session = parsed.find(item => item.id === id);
          if (session) {
            setData(session);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('localStorage parse failed:', err);
      }

      setError('Report not found');
      setLoading(false);
    };

    fetchReport();
  }, [id]);

  // Helper to safely parse JSON array fields
  const parseJsonField = (field, fallback) => {
    if (!field) return fallback;
    if (Array.isArray(field)) return field;
    try { return JSON.parse(field); } catch { return fallback; }
  };

  const handleShareClick = () => {
    const url = `${window.location.origin}/share/evaluation/${id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-500 dark:text-emerald-400';
    if (score >= 60) return 'text-amber-500 dark:text-amber-400';
    return 'text-rose-500 dark:text-rose-400';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/20';
    if (score >= 60) return 'bg-amber-500/10 border-amber-500/20';
    return 'bg-rose-500/10 border-rose-500/20';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Header title="AI Evaluation Report" />
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center space-y-3">
            <Loader2 size={36} className="animate-spin text-primary-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-500">Loading your evaluation report...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <Header title="Evaluation Missing" />
        <div className="glass-premium rounded-3xl p-8 text-center space-y-4">
          <AlertCircle className="mx-auto text-rose-500 animate-bounce" size={48} />
          <h3 className="font-extrabold text-lg text-slate-800 dark:text-white">Report Not Found</h3>
          <p className="text-sm text-slate-400 dark:text-slate-500 font-semibold max-w-sm mx-auto">
            This interview session evaluation is either unavailable or has expired.
          </p>
          <Link to="/candidate" className="inline-block px-5 py-2.5 rounded-xl bg-primary-500 text-white font-bold text-xs uppercase tracking-wider shadow-md">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const fb = data.feedback;

  return (
    <div className="space-y-6">
      <Header title="AI Evaluation Report" />

      {/* Share / Back Panel */}
      <div className="flex justify-between items-center gap-4">
        <button
          onClick={() => navigate('/candidate')}
          className="flex items-center gap-1.5 font-bold text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft size={16} /> Return to Dashboard
        </button>

        <button
          onClick={handleShareClick}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-dark-950 font-bold text-xs uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1.5 shadow-md"
        >
          {copied ? <Clipboard size={14} /> : <Share2 size={14} />}
          {copied ? 'Link Copied!' : 'Share Evaluation'}
        </button>
      </div>

      {/* Score Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`glass-premium rounded-3xl p-6 border-t-4 flex flex-col items-center justify-center text-center ${getScoreBg(data.score)}`}>
          <span className="text-[10px] uppercase font-bold text-slate-400">Overall Rating</span>
          <div className={`font-extrabold text-5xl tracking-tight py-2 ${getScoreColor(data.score)}`}>
            {data.score}%
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase">
            {data.score >= 80 ? 'Exceptional Pass' : (data.score >= 60 ? 'Standard Pass' : 'Review Required')}
          </span>
        </div>

        <div className="glass-premium rounded-3xl p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase">
            <span>Technical Knowledge</span>
            <Compass size={14} className="text-primary-500" />
          </div>
          <div className="py-3">
            <div className="font-extrabold text-3xl text-slate-800 dark:text-white">{fb.technicalScore}%</div>
            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 mt-2 overflow-hidden">
              <div className="h-full bg-primary-500 rounded-full transition-all duration-700" style={{ width: `${fb.technicalScore}%` }}></div>
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold">Evaluates algorithm core & details</span>
        </div>

        <div className="glass-premium rounded-3xl p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase">
            <span>Communication Skills</span>
            <ThumbsUp size={14} className="text-indigo-500" />
          </div>
          <div className="py-3">
            <div className="font-extrabold text-3xl text-slate-800 dark:text-white">{fb.communicationScore}%</div>
            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 mt-2 overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all duration-700" style={{ width: `${fb.communicationScore}%` }}></div>
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold">Evaluates articulation, flow & clarity</span>
        </div>

        <div className="glass-premium rounded-3xl p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase">
            <span>Confidence Index</span>
            <Star size={14} className="text-orange-500" />
          </div>
          <div className="py-3">
            <div className="font-extrabold text-3xl text-slate-800 dark:text-white">{fb.confidence || fb.confidenceLevel || 0}%</div>
            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 mt-2 overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full transition-all duration-700" style={{ width: `${fb.confidence || fb.confidenceLevel || 0}%` }}></div>
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold">Analyzes speech pitch and volume levels</span>
        </div>
      </div>

      {/* Strengths & Weaknesses Split Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-premium rounded-3xl p-6 space-y-4">
          <h3 className="font-bold text-base text-slate-800 dark:text-white flex items-center gap-1.5">
            <CheckCircle2 className="text-emerald-500" size={18} />
            Key Strengths
          </h3>
          <div className="space-y-2">
            {(fb.strengths || []).map((str, index) => (
              <div key={index} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-350 font-medium">
                <span className="text-emerald-500 font-bold mt-0.5">•</span>
                <p>{str}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-premium rounded-3xl p-6 space-y-4">
          <h3 className="font-bold text-base text-slate-800 dark:text-white flex items-center gap-1.5">
            <XCircle className="text-rose-500" size={18} />
            Growth Opportunities
          </h3>
          <div className="space-y-2">
            {(fb.weaknesses || []).map((weak, index) => (
              <div key={index} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-350 font-medium">
                <span className="text-rose-500 font-bold mt-0.5">•</span>
                <p>{weak}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grammar, Improvement Suggestions & Security Checks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-premium rounded-3xl p-6 space-y-3">
          <h4 className="font-bold text-sm text-slate-800 dark:text-white uppercase tracking-wider">Grammar & Articulation</h4>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-350 leading-relaxed">
            {fb.grammar || fb.grammarAnalysis || 'No grammar data recorded.'}
          </p>
        </div>

        <div className="glass-premium rounded-3xl p-6 space-y-3">
          <h4 className="font-bold text-sm text-slate-800 dark:text-white uppercase tracking-wider">Improvement Steps</h4>
          <ul className="space-y-2">
            {(fb.suggestions || []).map((sug, i) => (
              <li key={i} className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                <ChevronRight size={14} className="text-primary-500" />
                {sug}
              </li>
            ))}
          </ul>
        </div>

        <div className={`glass-premium rounded-3xl p-6 space-y-3 border-l-4 ${data.cheated ? 'border-rose-500 bg-rose-500/5' : 'border-emerald-500 bg-emerald-500/5'}`}>
          <h4 className="font-bold text-sm text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Award size={16} />
            Security & Integrity
          </h4>
          <div className="space-y-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <div>Tab Switching Logged: <span className="font-bold text-slate-800 dark:text-white">{data.tabSwitches} switches</span></div>
            <div>Integrity Flags: <span className={`font-bold ${data.cheated ? 'text-rose-500' : 'text-emerald-500'}`}>{data.cheated ? 'FAILED' : 'PASSED'}</span></div>
            <p className="text-[10px] text-slate-400 italic">
              Integrity index tracks window defocus triggers using browser viewport events to preserve assessment standards.
            </p>
          </div>
        </div>
      </div>

      {/* Full Session Transcript Q&A */}
      {data.transcript && data.transcript.length > 0 && (
        <div className="glass-premium rounded-3xl p-6 space-y-6">
          <h3 className="font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">Session Dialogue Transcript</h3>
          <div className="space-y-6">
            {data.transcript.map((item, index) => (
              <div key={index} className="space-y-3">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-900/50 border border-slate-200/40 dark:border-slate-800/80">
                  <div className="text-[10px] font-bold uppercase text-primary-500 tracking-wider mb-1">Interviewer Q{index + 1}</div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 italic">"{item.question}"</p>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-100/30 dark:border-indigo-950/20 ml-6">
                  <div className="text-[10px] font-bold uppercase text-indigo-500 tracking-wider mb-1">Your Verbal Response</div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                    {item.answer ? item.answer : <span className="text-slate-400 italic">No speech transcription logged.</span>}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
