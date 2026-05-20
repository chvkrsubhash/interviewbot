import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../../components/Header';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import {
  Users, Calendar, CheckSquare, Trophy, Link as LinkIcon, Send, Plus,
  Loader2, AlertCircle, Search, Filter, Clock, Check, X
} from 'lucide-react';

const DOMAINS = ['Frontend', 'Backend', 'AI/ML', 'DSA', 'HR', 'System Design', 'Aptitude'];

export default function RecruiterDashboard() {
  const location = useLocation();
  const currentPath = location.pathname;

  // Overview state
  const [metrics, setMetrics] = useState({ totalInterviews: 0, completedInterviews: 0, scheduledInterviews: 0, inProgressInterviews: 0, avgScore: 0 });
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  // Candidates list state
  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [copiedLink, setCopiedLink] = useState('');

  // Invite / Schedule state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteDomain, setInviteDomain] = useState('Frontend');
  const [inviteLevel, setInviteLevel] = useState('Mid');
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [scheduledList, setScheduledList] = useState([]);

  const token = localStorage.getItem('token');

  // Fetch metrics on mount
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch('/api/recruiter/metrics', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMetrics(data);
        }
      } catch (err) {
        console.warn('Metrics fetch error:', err);
      } finally {
        setLoadingMetrics(false);
      }
    };
    fetchMetrics();
  }, []);

  // Fetch candidates when on reports page
  useEffect(() => {
    if (currentPath === '/recruiter/reports' || currentPath === '/recruiter') {
      const fetchCandidates = async () => {
        setLoadingCandidates(true);
        try {
          const res = await fetch('/api/recruiter/candidates', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setCandidates(data);
          }
        } catch (err) {
          console.warn('Candidates fetch error:', err);
        } finally {
          setLoadingCandidates(false);
        }
      };
      fetchCandidates();
    }
  }, [currentPath]);

  // Fetch scheduled list when on schedule page
  useEffect(() => {
    if (currentPath === '/recruiter/schedule') {
      const fetchScheduled = async () => {
        try {
          const res = await fetch('/api/recruiter/candidates', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setScheduledList(data.filter(i => i.status === 'scheduled'));
          }
        } catch (err) {
          console.warn('Scheduled fetch error:', err);
        }
      };
      fetchScheduled();
    }
  }, [currentPath, inviteSuccess]);

  const handleGenerateLink = (token) => {
    const url = `${window.location.origin}/invite/evaluate/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(token);
    setTimeout(() => setCopiedLink(''), 2000);
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    setInviteError('');
    setInviteSuccess('');

    try {
      const res = await fetch('/api/recruiter/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: inviteEmail,
          domain: inviteDomain,
          experienceLevel: inviteLevel
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send invite');

      setInviteSuccess(`✓ Interview scheduled for ${inviteEmail}. Share token: ${data.shareToken}`);
      setInviteEmail('');
    } catch (err) {
      setInviteError(err.message);
    } finally {
      setInviting(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      completed: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400',
      scheduled: 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400',
      in_progress: 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400'
    };
    return map[status] || 'bg-slate-50 text-slate-400';
  };

  const filteredCandidates = candidates.filter(c => {
    const name = c.candidate?.name?.toLowerCase() || '';
    const email = c.candidate?.email?.toLowerCase() || '';
    const matchSearch = name.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Domain distribution for bar chart
  const domainCounts = {};
  candidates.forEach(c => {
    if (c.domain) domainCounts[c.domain] = (domainCounts[c.domain] || 0) + 1;
  });
  const analyticsData = Object.entries(domainCounts).map(([domain, count]) => ({ domain, count }));

  // ── OVERVIEW ──────────────────────────────────────────────────────
  const OverviewPanel = () => (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Interviews', value: metrics.totalInterviews, color: 'text-primary-500', bg: 'bg-primary-500/10', icon: Users },
          { label: 'Scheduled', value: metrics.scheduledInterviews, color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Calendar },
          { label: 'Completed', value: metrics.completedInterviews, color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckSquare },
          { label: 'Avg Score', value: `${metrics.avgScore}%`, color: 'text-orange-500', bg: 'bg-orange-500/10', icon: Trophy }
        ].map((m, idx) => (
          <div key={idx} className="glass-premium rounded-3xl p-6 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl ${m.bg} ${m.color} flex items-center justify-center`}>
              <m.icon size={24} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">{m.label}</span>
              <h4 className="font-extrabold text-xl text-slate-800 dark:text-white">
                {loadingMetrics ? <Loader2 size={18} className="animate-spin" /> : m.value}
              </h4>
            </div>
          </div>
        ))}
      </div>

      {/* Candidates Overview + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <CandidatesTable />
        <div className="glass-premium rounded-3xl p-6 lg:col-span-2 flex flex-col justify-between">
          <h3 className="font-bold text-base text-slate-800 dark:text-white mb-4">Domain Assessment Index</h3>
          <div className="h-64 flex items-center justify-center">
            {analyticsData.length === 0 ? (
              <p className="text-slate-400 text-sm font-semibold">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="domain" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.9)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // ── CANDIDATES TABLE COMPONENT ─────────────────────────────────────
  const CandidatesTable = () => (
    <div className="glass-premium rounded-3xl p-6 lg:col-span-3 space-y-4">
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="font-bold text-base text-slate-800 dark:text-white">Candidate Trackers</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-7 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-500 text-slate-700 dark:text-slate-200 font-semibold"
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
          </select>
        </div>
      </div>

      {loadingCandidates ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin text-primary-500" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400">
            <thead className="text-xs uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="pb-3">Candidate / Domain</th>
                <th className="pb-3">Score</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400 font-semibold">
                    <AlertCircle className="mx-auto mb-2 text-slate-300" size={28} />
                    {searchQuery ? 'No matching candidates' : 'No interview sessions found'}
                  </td>
                </tr>
              ) : filteredCandidates.map((c) => (
                <tr key={c.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="py-3.5">
                    <div className="font-bold text-slate-800 dark:text-white">{c.candidate?.name || 'Unknown'}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{c.candidate?.email} • <span className="font-extrabold uppercase text-primary-500 tracking-wider">{c.domain}</span></div>
                  </td>
                  <td className="py-3.5">
                    {c.status === 'completed' ? (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        (c.score || 0) >= 80 ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600' :
                        (c.score || 0) >= 60 ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600' :
                        'bg-rose-50 dark:bg-rose-950/20 text-rose-600'
                      }`}>
                        {c.score || 0}%
                      </span>
                    ) : <span className="text-slate-400 text-xs font-bold">—</span>}
                  </td>
                  <td className="py-3.5">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wide ${getStatusBadge(c.status)}`}>
                      {c.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    <button
                      onClick={() => handleGenerateLink(c.shareToken)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-primary-50 dark:hover:bg-primary-950/20 text-slate-400 hover:text-primary-500 transition-colors"
                      title="Copy Invitation Link"
                    >
                      {copiedLink === c.shareToken ? <Check size={16} className="text-emerald-500" /> : <LinkIcon size={16} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // ── EVALUATIONS PANEL ──────────────────────────────────────────────
  const EvaluationsPanel = () => (
    <div className="space-y-6">
      <div className="glass-premium rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-base text-slate-800 dark:text-white flex items-center gap-2">
            <CheckSquare size={18} className="text-primary-500" />
            All Candidate Evaluations
          </h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-7 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-500 font-semibold text-slate-700 dark:text-slate-200 w-60"
              />
            </div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
            </select>
          </div>
        </div>

        {loadingCandidates ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={28} className="animate-spin text-primary-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400">
              <thead className="text-xs uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="pb-3">Candidate</th>
                  <th className="pb-3">Domain / Level</th>
                  <th className="pb-3">Overall Score</th>
                  <th className="pb-3">Technical</th>
                  <th className="pb-3">Communication</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Integrity</th>
                  <th className="pb-3 text-right">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 font-semibold">
                      <AlertCircle className="mx-auto mb-2 text-slate-300" size={28} />
                      {searchQuery ? 'No matching candidates found' : 'No evaluations recorded yet'}
                    </td>
                  </tr>
                ) : filteredCandidates.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-3.5">
                      <div className="font-bold text-slate-800 dark:text-white">{c.candidate?.name || 'Unknown'}</div>
                      <div className="text-[10px] text-slate-400">{c.candidate?.email}</div>
                    </td>
                    <td className="py-3.5">
                      <div className="font-bold text-slate-700 dark:text-slate-200 text-xs">{c.domain}</div>
                      <div className="text-[10px] text-slate-400">{c.experienceLevel}</div>
                    </td>
                    <td className="py-3.5">
                      {c.status === 'completed' ? (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          (c.score || 0) >= 80 ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600' :
                          (c.score || 0) >= 60 ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600' :
                          'bg-rose-50 dark:bg-rose-950/20 text-rose-600'
                        }`}>{c.score || 0}%</span>
                      ) : <span className="text-slate-400 text-xs">—</span>}
                    </td>
                    <td className="py-3.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                      {c.feedback?.technicalScore ? `${c.feedback.technicalScore}%` : '—'}
                    </td>
                    <td className="py-3.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                      {c.feedback?.communicationScore ? `${c.feedback.communicationScore}%` : '—'}
                    </td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wide ${getStatusBadge(c.status)}`}>
                        {c.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5">
                      {c.cheated
                        ? <span className="flex items-center gap-1 text-rose-500 text-[10px] font-bold"><X size={12} /> FLAGGED</span>
                        : <span className="flex items-center gap-1 text-emerald-500 text-[10px] font-bold"><Check size={12} /> PASSED</span>
                      }
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => handleGenerateLink(c.shareToken)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-primary-50 dark:hover:bg-primary-950/20 text-slate-400 hover:text-primary-500 transition-colors"
                        title="Copy Interview Link"
                      >
                        {copiedLink === c.shareToken ? <Check size={14} className="text-emerald-500" /> : <LinkIcon size={14} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  // ── SCHEDULING PANEL ──────────────────────────────────────────────
  const SchedulingPanel = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Invite Form */}
      <div className="glass-premium rounded-3xl p-8 space-y-6">
        <div className="space-y-2">
          <h3 className="font-extrabold text-xl text-slate-800 dark:text-white flex items-center gap-2">
            <Send className="text-primary-500" size={22} />
            Schedule Interview
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">
            Enter a candidate's email to create a scheduled interview session. A unique invite link will be generated for them to access the platform.
          </p>
        </div>

        <form onSubmit={handleSendInvite} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Candidate Email</label>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="candidate@company.com"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 dark:bg-dark-900/50 dark:border-slate-800/80 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-semibold text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Interview Domain</label>
            <select
              value={inviteDomain}
              onChange={e => setInviteDomain(e.target.value)}
              className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-800 text-slate-750 dark:text-slate-200 font-bold text-xs focus:outline-none"
            >
              {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Experience Level</label>
            <div className="grid grid-cols-3 gap-2">
              {['Entry', 'Mid', 'Senior'].map(lvl => (
                <button
                  type="button"
                  key={lvl}
                  onClick={() => setInviteLevel(lvl)}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    inviteLevel === lvl
                      ? 'bg-primary-500 border-primary-500 text-white'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {inviteSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 text-xs font-semibold border border-emerald-100 dark:border-emerald-950/30">
              {inviteSuccess}
            </div>
          )}
          {inviteError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 text-xs font-semibold border border-rose-100 dark:border-rose-950/30 flex items-center gap-2">
              <AlertCircle size={14} /> {inviteError}
            </div>
          )}

          <button
            type="submit"
            disabled={inviting}
            className="w-full py-4 bg-gradient-to-r from-primary-600 to-indigo-600 hover:shadow-lg hover:shadow-primary-500/15 text-white rounded-2xl font-bold transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {inviting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {inviting ? 'Scheduling...' : 'Schedule Interview'}
          </button>
        </form>
      </div>

      {/* Scheduled sessions list */}
      <div className="glass-premium rounded-3xl p-6 space-y-4">
        <h3 className="font-bold text-base text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Clock size={18} className="text-blue-500" />
          Scheduled Sessions
        </h3>

        {scheduledList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
            <Calendar size={32} />
            <p className="text-sm font-semibold">No scheduled sessions yet.</p>
            <p className="text-xs">Schedule an interview using the form on the left.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {scheduledList.map((s) => (
              <div key={s.id} className="p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-slate-50/50 dark:bg-dark-900/30 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-slate-800 dark:text-white">{s.candidate?.name || 'Invited Candidate'}</div>
                  <div className="text-[10px] text-slate-400 font-medium">{s.candidate?.email} • <span className="text-primary-500 font-bold uppercase">{s.domain}</span></div>
                </div>
                <button
                  onClick={() => handleGenerateLink(s.shareToken)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-primary-50 dark:hover:bg-primary-950/20 text-slate-400 hover:text-primary-500 transition-colors"
                  title="Copy invite link"
                >
                  {copiedLink === s.shareToken ? <Check size={16} className="text-emerald-500" /> : <LinkIcon size={16} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ── RENDER ─────────────────────────────────────────────────────────
  const titles = {
    '/recruiter': 'Recruiter Administration Hub',
    '/recruiter/reports': 'Candidate Evaluations',
    '/recruiter/schedule': 'Interview Scheduling'
  };

  return (
    <div className="space-y-6">
      <Header title={titles[currentPath] || 'Recruiter Hub'} />

      {currentPath === '/recruiter' && <OverviewPanel />}
      {currentPath === '/recruiter/reports' && <EvaluationsPanel />}
      {currentPath === '/recruiter/schedule' && <SchedulingPanel />}
    </div>
  );
}
