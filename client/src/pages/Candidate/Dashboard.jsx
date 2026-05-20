import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import {
  Video, Code2, Trophy, ArrowRight, Award, AlertCircle, FileText, Loader2, Flame
} from 'lucide-react';

export default function CandidateDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCertificate, setShowCertificate] = useState(null);

  // Derived chart data from real interviews
  const [performanceData, setPerformanceData] = useState([]);
  const [skillData, setSkillData] = useState([
    { subject: 'Technical', A: 0, fullMark: 100 },
    { subject: 'Communication', A: 0, fullMark: 100 },
    { subject: 'Problem Solving', A: 0, fullMark: 100 },
    { subject: 'Confidence', A: 0, fullMark: 100 },
    { subject: 'Grammar', A: 0, fullMark: 100 },
  ]);

  useEffect(() => {
    const fetchInterviews = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');

      try {
        const response = await fetch('/api/interview', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const dbInterviews = await response.json();
          const completed = dbInterviews.filter(i => i.status === 'completed');
          setInterviews(completed);

          // Build performance line chart from real data
          const chartData = completed.slice(-5).reverse().map((iv, idx) => ({
            name: `Int ${idx + 1}`,
            score: iv.score || 0
          }));
          setPerformanceData(chartData);

          // Build skill radar from averages across completed interviews
          if (completed.length > 0) {
            const withFeedback = completed.filter(i => i.feedback);
            if (withFeedback.length > 0) {
              const avgTech = Math.round(withFeedback.reduce((s, i) => s + (i.feedback.technicalScore || 0), 0) / withFeedback.length);
              const avgComm = Math.round(withFeedback.reduce((s, i) => s + (i.feedback.communicationScore || 0), 0) / withFeedback.length);
              const avgConf = Math.round(withFeedback.reduce((s, i) => s + (i.feedback.confidenceLevel || i.feedback.confidence || 0), 0) / withFeedback.length);
              const avgScore = Math.round(withFeedback.reduce((s, i) => s + (i.score || 0), 0) / withFeedback.length);
              setSkillData([
                { subject: 'Technical', A: avgTech, fullMark: 100 },
                { subject: 'Communication', A: avgComm, fullMark: 100 },
                { subject: 'Problem Solving', A: Math.min(100, avgScore + 5), fullMark: 100 },
                { subject: 'Confidence', A: avgConf, fullMark: 100 },
                { subject: 'Grammar', A: Math.min(100, avgComm - 5), fullMark: 100 },
              ]);
            }
          }
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('DB fetch failed, using localStorage:', err);
      }

      // Fallback to localStorage
      const stored = localStorage.getItem('completed_interviews');
      if (stored) {
        const parsed = JSON.parse(stored);
        setInterviews(parsed);
        const chartData = parsed.slice(0, 5).reverse().map((iv, idx) => ({
          name: `Int ${idx + 1}`,
          score: iv.score || 0
        }));
        setPerformanceData(chartData);
      } else {
        // Seed initial mock for fresh accounts
        const initialMock = [
          { id: 'int-mock-1', title: 'Google L4 Frontend Round', domain: 'Frontend', score: 82, date: 'May 18, 2026', cheated: false, type: 'technical' },
          { id: 'int-mock-2', title: 'HR Leadership Behavioral Mock', domain: 'HR', score: 75, date: 'May 12, 2026', cheated: false, type: 'behavioral' }
        ];
        localStorage.setItem('completed_interviews', JSON.stringify(initialMock));
        setInterviews(initialMock);
        setPerformanceData([
          { name: 'Int 1', score: 75 },
          { name: 'Int 2', score: 82 },
        ]);
      }
      setLoading(false);
    };

    fetchInterviews();
  }, []);

  const avgScore = interviews.length > 0
    ? Math.round(interviews.reduce((s, i) => s + (i.score || 0), 0) / interviews.length)
    : 0;

  return (
    <div className="space-y-6">
      <Header title="Candidate Dashboard" />

      {/* Quick Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-premium rounded-3xl p-6 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300 cursor-pointer" onClick={() => navigate('/candidate/setup')}>
          <div className="absolute right-0 bottom-0 opacity-10 text-primary-500 scale-150 translate-x-4 translate-y-4">
            <Video size={140} />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-primary-500/10 text-primary-500 flex items-center justify-center mb-4">
            <Video size={24} />
          </div>
          <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2">Simulate Live Interview</h3>
          <p className="text-sm text-slate-400 dark:text-slate-500 font-semibold mb-6">Interactive face-to-face AI interview with dynamic feedback analysis.</p>
          <div className="flex items-center gap-2 font-bold text-sm text-primary-500 group-hover:gap-3 transition-all">
            Start Setup Wizard <ArrowRight size={16} />
          </div>
        </div>

        <div className="glass-premium rounded-3xl p-6 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
          <div className="absolute right-0 bottom-0 opacity-10 text-indigo-500 scale-150 translate-x-4 translate-y-4">
            <Code2 size={140} />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4">
            <Code2 size={24} />
          </div>
          <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2">Monaco Code Editor</h3>
          <p className="text-sm text-slate-400 dark:text-slate-500 font-semibold mb-6">Practice complex algorithms & structures with multi-language execution.</p>
          <Link to="/candidate/coding" className="flex items-center gap-2 font-bold text-sm text-indigo-500 group-hover:gap-3 transition-all">
            Open Coding Studio <ArrowRight size={16} />
          </Link>
        </div>

        <div className="glass-premium rounded-3xl p-6 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
          <div className="absolute right-0 bottom-0 opacity-10 text-orange-500 scale-150 translate-x-4 translate-y-4">
            <Trophy size={140} />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-4">
            <Trophy size={24} />
          </div>
          <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2">Global Leaderboard</h3>
          <p className="text-sm text-slate-400 dark:text-slate-500 font-semibold mb-6">Track your daily high score streak & stand tall among global job seekers.</p>
          <Link to="/candidate/leaderboard" className="flex items-center gap-2 font-bold text-sm text-orange-500 group-hover:gap-3 transition-all">
            Check Leaderboard <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Sessions', value: interviews.length, color: 'text-primary-500', bg: 'bg-primary-500/10' },
          { label: 'Average Score', value: `${avgScore}%`, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
          { label: 'Day Streak', value: `${user?.streak || 0} days`, color: 'text-orange-500', bg: 'bg-orange-500/10', icon: Flame },
          { label: 'Top Score', value: interviews.length > 0 ? `${Math.max(...interviews.map(i => i.score || 0))}%` : 'N/A', color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
        ].map((stat, idx) => (
          <div key={idx} className="glass-premium rounded-2xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
              {stat.icon ? <stat.icon size={20} /> : <Award size={20} />}
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">{stat.label}</div>
              <div className={`font-extrabold text-lg ${stat.color}`}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Performance Score Trend */}
        <div className="glass-premium rounded-3xl p-6 lg:col-span-3">
          <h3 className="font-bold text-base text-slate-800 dark:text-white mb-4">Performance Progression</h3>
          {performanceData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm font-semibold flex-col gap-2">
              {loading ? <Loader2 size={24} className="animate-spin" /> : <><AlertCircle size={24} /><span>Complete your first interview to see trends</span></>}
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.9)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#0ea5e9" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                  <Line type="monotone" dataKey="score" stroke="url(#colorScore)" strokeWidth={3} dot={{ r: 5, stroke: '#0ea5e9', strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Skill Analytics Radar */}
        <div className="glass-premium rounded-3xl p-6 lg:col-span-2 flex flex-col justify-between">
          <h3 className="font-bold text-base text-slate-800 dark:text-white mb-4">Skill Assessment Core</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" radius="70%" data={skillData}>
                <PolarGrid stroke="rgba(148, 163, 184, 0.15)" />
                <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={10} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#64748b" fontSize={8} />
                <Radar name="Metrics" dataKey="A" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Previous Sessions & Learning resources */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Previous Interviews Table */}
        <div className="glass-premium rounded-3xl p-6 lg:col-span-2">
          <h3 className="font-bold text-base text-slate-800 dark:text-white mb-4">Recent Evaluations</h3>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-primary-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400">
                <thead className="text-xs uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="pb-3">Title / Domain</th>
                    <th className="pb-3">Score</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {interviews.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400 font-semibold">
                        <AlertCircle className="mx-auto mb-2 text-slate-300" size={32} />
                        No completed interviews yet. Try setting up your first mock round!
                      </td>
                    </tr>
                  ) : (
                    interviews.map((item) => (
                      <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="py-3.5">
                          <div className="font-bold text-slate-800 dark:text-white">{item.title}</div>
                          <div className="text-[10px] font-extrabold uppercase text-primary-500 tracking-wider mt-0.5">{item.domain}</div>
                        </td>
                        <td className="py-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            (item.score || 0) >= 80
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                              : (item.score || 0) >= 60
                              ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400'
                              : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400'
                          }`}>
                            {item.score || 0}%
                          </span>
                        </td>
                        <td className="py-3.5 font-medium text-slate-400">
                          {item.date || new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="py-3.5 text-right flex items-center justify-end gap-2">
                          {(item.score || 0) >= 80 && (
                            <button
                              onClick={() => setShowCertificate(item)}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-primary-50 dark:hover:bg-primary-950/20 text-slate-400 hover:text-primary-500 transition-colors"
                              title="Generate Mock Certificate"
                            >
                              <Award size={16} />
                            </button>
                          )}
                          <Link
                            to={`/candidate/report/${item.id}`}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
                          >
                            <FileText size={12} /> Detailed Report
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recommended Learning Resources */}
        <div className="glass-premium rounded-3xl p-6">
          <h3 className="font-bold text-base text-slate-800 dark:text-white mb-4">Prep Resources</h3>
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-gradient-to-tr from-slate-50 to-indigo-50/20 dark:from-dark-900/50 dark:to-indigo-950/10 border border-slate-200/40 dark:border-slate-800/80">
              <h4 className="font-bold text-sm text-slate-800 dark:text-white">Technical Coding Strategies</h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1">Cracking structural design, space-time complexities, and algorithmic workflows.</p>
              <a href="#" className="inline-block mt-3 text-xs font-extrabold text-primary-500 uppercase tracking-widest hover:underline">Explore Guides →</a>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-tr from-slate-50 to-indigo-50/20 dark:from-dark-900/50 dark:to-indigo-950/10 border border-slate-200/40 dark:border-slate-800/80">
              <h4 className="font-bold text-sm text-slate-800 dark:text-white">Answering Behavioral Questions</h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1">Utilize the STAR method to describe high-stakes team conflicts and results.</p>
              <a href="#" className="inline-block mt-3 text-xs font-extrabold text-primary-500 uppercase tracking-widest hover:underline">Read Article →</a>
            </div>
          </div>
        </div>
      </div>

      {/* Certificate Modal */}
      {showCertificate && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white text-slate-900 rounded-3xl p-8 border-[12px] border-double border-indigo-950 shadow-2xl relative">
            <button onClick={() => setShowCertificate(null)} className="absolute right-4 top-4 font-bold text-sm text-slate-400 hover:text-slate-600">Close ✕</button>
            <div className="text-center space-y-6">
              <div className="text-primary-600 font-bold uppercase tracking-[0.2em] text-sm">Certificate of Achievement</div>
              <div className="space-y-2">
                <h1 className="font-extrabold text-3xl tracking-tight text-indigo-950 font-serif">MOCK INTERVIEW EXCELLENCE</h1>
                <p className="text-xs text-slate-400 italic font-semibold">Proudly presented to</p>
              </div>
              <div className="py-2 border-b-2 border-indigo-950 max-w-sm mx-auto">
                <span className="font-extrabold text-2xl tracking-wide text-indigo-900">{user?.name}</span>
              </div>
              <p className="text-sm max-w-md mx-auto text-slate-500 font-medium">
                For outstanding technical prowess during the AI-simulated evaluation round of<br />
                <span className="font-bold text-slate-700">{showCertificate.title}</span> with an exceptional grade score of <span className="font-bold text-emerald-600">{showCertificate.score}%</span>.
              </p>
              <div className="grid grid-cols-2 gap-8 pt-8 max-w-lg mx-auto border-t border-slate-100 text-left">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Awarded Date</div>
                  <div className="font-bold text-sm text-slate-700">{showCertificate.date || new Date(showCertificate.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Verifiable Code</div>
                  <div className="font-bold text-sm text-slate-700 font-mono">ID: {showCertificate.id?.substring(0, 12)}...</div>
                </div>
              </div>
              <button onClick={() => window.print()} className="mt-6 px-6 py-2.5 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white font-bold text-xs uppercase tracking-widest transition-all active:scale-95">
                Print Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
