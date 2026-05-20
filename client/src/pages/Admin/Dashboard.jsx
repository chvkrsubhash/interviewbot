import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../../components/Header';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import {
  ShieldAlert, ShieldCheck, Users, HardDrive, Scroll, RefreshCw, Loader2,
  AlertCircle, Search, UserX, UserCheck, IndianRupee, TrendingUp,
  CreditCard, Zap, Crown, Rocket, Plus, Pencil, Trash2, Check, X,
  Wrench, Power, Save, AlertTriangle, CheckCircle2, Ban, Activity, Megaphone, Send, ToggleLeft, ToggleRight, Link2
} from 'lucide-react';

// ─── Shared helpers ────────────────────────────────────────────────────────────
const fmtINR = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);

export default function AdminDashboard() {
  const location = useLocation();
  const currentPath = location.pathname;

  const [metrics, setMetrics] = useState({ totalUsers: 0, totalCandidates: 0, totalRecruiters: 0, totalBanned: 0, totalInterviews: 0, completedInterviews: 0 });
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [banningId, setBanningId] = useState(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetch('/api/admin/metrics', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setMetrics(d); })
      .finally(() => setLoadingMetrics(false));
  }, []);

  useEffect(() => {
    if (currentPath === '/admin/users') fetchUsers();
  }, [currentPath]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const r = await fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } });
      if (r.ok) setUsers(await r.json());
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleToggleBan = async (userId, isBanned) => {
    setBanningId(userId);
    try {
      const r = await fetch(`/api/admin/users/${userId}/ban`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
      if (r.ok) {
        const d = await r.json();
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBanned: d.isBanned } : u));
        setMetrics(prev => ({ ...prev, totalBanned: d.isBanned ? prev.totalBanned + 1 : prev.totalBanned - 1 }));
      }
    } finally {
      setBanningId(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const titles = {
    '/admin': 'System Administrator Dashboard',
    '/admin/income': 'Income & Revenue Analytics',
    '/admin/plans': 'Subscription Plan Management',
    '/admin/users': 'User Registry Management',
    '/admin/maintenance': 'Maintenance Mode Control',
    '/admin/questions': 'Question Bank Management',
    '/admin/broadcast': 'Banner & Broadcast Center'
  };

  return (
    <div className="space-y-6">
      <Header title={titles[currentPath] || 'Admin Dashboard'} />
      {currentPath === '/admin' && <OverviewPanel metrics={metrics} loading={loadingMetrics} token={token} />}
      {currentPath === '/admin/income' && <IncomePanel token={token} />}
      {currentPath === '/admin/plans' && <PlansPanel token={token} />}
      {currentPath === '/admin/users' && <UserRegistryPanel users={filteredUsers} allUsers={users} loading={loadingUsers} searchQuery={searchQuery} setSearchQuery={setSearchQuery} roleFilter={roleFilter} setRoleFilter={setRoleFilter} onToggleBan={handleToggleBan} banningId={banningId} onRefresh={fetchUsers} />}
      {currentPath === '/admin/maintenance' && <MaintenancePanel token={token} />}
      {currentPath === '/admin/questions' && <QuestionsPanel token={token} />}
      {currentPath === '/admin/broadcast' && <BroadcastPanel token={token} />}
    </div>
  );
}

// ─── 1. OVERVIEW ─────────────────────────────────────────────────────────────
function OverviewPanel({ metrics, loading, token }) {
  const [income, setIncome] = useState(null);

  useEffect(() => {
    fetch('/api/admin/income', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => setIncome(d));
  }, []);

  const stats = [
    { label: 'Total Users', value: metrics.totalUsers, color: 'text-primary-500', bg: 'bg-primary-500/10', Icon: Users },
    { label: 'Total Interviews', value: metrics.totalInterviews, color: 'text-indigo-500', bg: 'bg-indigo-500/10', Icon: HardDrive },
    { label: 'Revenue (INR)', value: income ? fmtINR(income.totalRevenueINR) : '—', color: 'text-emerald-500', bg: 'bg-emerald-500/10', Icon: IndianRupee },
    { label: 'Suspended Accounts', value: metrics.totalBanned, color: 'text-rose-500', bg: 'bg-rose-500/10', Icon: ShieldAlert }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((m, idx) => (
          <div key={idx} className="glass-premium rounded-3xl p-6 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl ${m.bg} ${m.color} flex items-center justify-center`}>
              <m.Icon size={24} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">{m.label}</span>
              <h4 className="font-extrabold text-xl text-slate-800 dark:text-white">
                {loading ? <Loader2 size={18} className="animate-spin" /> : m.value}
              </h4>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="glass-premium rounded-3xl p-6 lg:col-span-3 space-y-4">
          <h3 className="font-bold text-base text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            <Users size={18} className="text-primary-500" /> User Breakdown
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Candidates', value: metrics.totalCandidates, color: 'from-primary-500/20 to-indigo-500/20 border-primary-500/20 text-primary-500' },
              { label: 'Recruiters', value: metrics.totalRecruiters, color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/20 text-emerald-500' },
              { label: 'Banned', value: metrics.totalBanned, color: 'from-rose-500/20 to-red-500/20 border-rose-500/20 text-rose-500' }
            ].map((s, idx) => (
              <div key={idx} className={`p-5 rounded-2xl bg-gradient-to-tr ${s.color} border text-center`}>
                <div className="font-extrabold text-2xl">{loading ? '—' : s.value}</div>
                <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-premium rounded-3xl p-6 lg:col-span-2">
          <h3 className="font-bold text-base text-slate-800 dark:text-white mb-4">Monthly Revenue</h3>
          {income?.monthlyTrend ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={income.monthlyTrend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip formatter={(v) => [`₹${v}`, 'Revenue']} contentStyle={{ background: 'rgba(15,23,42,0.9)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                  <defs>
                    <linearGradient id="gr1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" fill="url(#gr1)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-52 flex items-center justify-center"><Loader2 size={24} className="animate-spin text-primary-500" /></div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 2. INCOME PANEL ─────────────────────────────────────────────────────────
function IncomePanel({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/income', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 size={32} className="animate-spin text-primary-500" /></div>;
  if (!data) return <div className="glass-premium rounded-3xl p-8 text-center text-slate-400 font-semibold">No income data available</div>;

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Revenue (INR)', value: fmtINR(data.totalRevenueINR), color: 'text-emerald-500', bg: 'bg-emerald-500/10', Icon: IndianRupee },
          { label: 'This Month (INR)', value: fmtINR(data.monthlyRevenueINR), color: 'text-primary-500', bg: 'bg-primary-500/10', Icon: TrendingUp },
          { label: 'Successful Payments', value: data.successfulTransactions, color: 'text-indigo-500', bg: 'bg-indigo-500/10', Icon: CheckCircle2 },
          { label: 'Failed Payments', value: data.failedTransactions, color: 'text-rose-500', bg: 'bg-rose-500/10', Icon: AlertTriangle }
        ].map((m, idx) => (
          <div key={idx} className="glass-premium rounded-3xl p-6 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl ${m.bg} ${m.color} flex items-center justify-center`}>
              <m.Icon size={24} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">{m.label}</span>
              <div className={`font-extrabold text-xl ${m.color}`}>{m.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Monthly Revenue trend */}
        <div className="glass-premium rounded-3xl p-6 lg:col-span-3">
          <h3 className="font-bold text-base text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-500" /> 6-Month Revenue Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip formatter={(v) => [`₹${v}`, 'Revenue']} contentStyle={{ background: 'rgba(15,23,42,0.9)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#incomeGrad)" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by plan */}
        <div className="glass-premium rounded-3xl p-6 lg:col-span-2">
          <h3 className="font-bold text-base text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <CreditCard size={18} className="text-primary-500" /> Revenue by Plan
          </h3>
          {data.revenueByPlan.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm font-semibold flex-col gap-2">
              <IndianRupee size={32} className="opacity-30" />
              No paid transactions yet
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.revenueByPlan} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="plan" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip formatter={(v) => [`₹${v}`, 'Revenue']} contentStyle={{ background: 'rgba(15,23,42,0.9)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                  <Bar dataKey="revenueINR" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="glass-premium rounded-3xl p-6 space-y-4">
        <h3 className="font-bold text-base text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
          Recent Transactions
        </h3>
        {data.recentPayments.length === 0 ? (
          <div className="py-8 text-center text-slate-400 font-semibold flex flex-col items-center gap-2">
            <IndianRupee size={32} className="opacity-30" />
            No payment transactions recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase font-extrabold tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="pb-3">User</th>
                  <th className="pb-3">Plan</th>
                  <th className="pb-3">Amount (INR)</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Razorpay ID</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.recentPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-3">
                      <div className="font-bold text-slate-800 dark:text-white text-sm">{p.userName || '—'}</div>
                      <div className="text-[10px] text-slate-400">{p.userEmail}</div>
                    </td>
                    <td className="py-3 font-bold text-slate-600 dark:text-slate-300">{p.planName}</td>
                    <td className="py-3 font-extrabold text-emerald-600 dark:text-emerald-400">{fmtINR(p.amountINR)}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase ${
                        p.status === 'paid' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600' :
                        p.status === 'failed' ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600' :
                        'bg-amber-50 dark:bg-amber-950/20 text-amber-600'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 text-xs font-mono text-slate-400">{p.razorpayPaymentId || '—'}</td>
                    <td className="py-3 text-xs text-slate-400">
                      {new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
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
}

// ─── 3. PLANS MANAGEMENT ─────────────────────────────────────────────────────
function PlansPanel({ token }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', price: '', billingInterval: 'monthly', interviewsAllowed: 5, features: '', isPopular: false, badgeColor: 'primary', isActive: true });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/plans', { headers: { 'Authorization': `Bearer ${token}` } });
      if (r.ok) setPlans(await r.json());
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchPlans(); }, []);

  const resetForm = () => setForm({ name: '', description: '', price: '', billingInterval: 'monthly', interviewsAllowed: 5, features: '', isPopular: false, badgeColor: 'primary', isActive: true });

  const openEdit = (plan) => {
    setEditingId(plan.id);
    setShowCreate(false);
    setForm({
      name: plan.name,
      description: plan.description || '',
      price: (plan.price / 100).toString(),
      billingInterval: plan.billingInterval,
      interviewsAllowed: plan.interviewsAllowed,
      features: (plan.features || []).join('\n'),
      isPopular: plan.isPopular,
      badgeColor: plan.badgeColor || 'primary',
      isActive: plan.isActive
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        ...form,
        features: form.features.split('\n').map(f => f.trim()).filter(Boolean),
        interviewsAllowed: parseInt(form.interviewsAllowed)
      };

      let r;
      if (editingId) {
        r = await fetch(`/api/admin/plans/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
      } else {
        r = await fetch('/api/admin/plans', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
      }

      const data = await r.json();
      if (!r.ok) throw new Error(data.message || 'Save failed');

      setSuccess(editingId ? 'Plan updated successfully.' : 'New plan created successfully.');
      setEditingId(null);
      setShowCreate(false);
      resetForm();
      fetchPlans();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this plan? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      const r = await fetch(`/api/admin/plans/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (r.ok) {
        setSuccess('Plan deleted.');
        fetchPlans();
      }
    } finally { setDeletingId(null); }
  };

  const PlanForm = () => (
    <div className="glass-premium rounded-3xl p-6 space-y-5 border-2 border-primary-500/20">
      <h4 className="font-bold text-base text-slate-800 dark:text-white">
        {editingId ? 'Edit Plan' : 'Create New Plan'}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Plan Name *</label>
          <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-semibold text-sm focus:outline-none focus:ring-1 focus:ring-primary-500" placeholder="Pro Learner" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Price (₹ INR) *</label>
          <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-semibold text-sm focus:outline-none focus:ring-1 focus:ring-primary-500" placeholder="499" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Billing Interval</label>
          <select value={form.billingInterval} onChange={e => setForm(p => ({ ...p, billingInterval: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-800 font-bold text-sm text-slate-700 dark:text-slate-200 focus:outline-none">
            <option value="free">Free</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="lifetime">Lifetime</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Interviews/Month (-1 = unlimited)</label>
          <input type="number" value={form.interviewsAllowed} onChange={e => setForm(p => ({ ...p, interviewsAllowed: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-semibold text-sm focus:outline-none focus:ring-1 focus:ring-primary-500" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Badge Color</label>
          <select value={form.badgeColor} onChange={e => setForm(p => ({ ...p, badgeColor: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-800 font-bold text-sm text-slate-700 dark:text-slate-200 focus:outline-none">
            <option value="slate">Slate (Free)</option>
            <option value="primary">Primary Blue (Pro)</option>
            <option value="orange">Orange Gold (Elite)</option>
          </select>
        </div>
        <div className="flex items-center gap-4 pt-5">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
            <input type="checkbox" checked={form.isPopular} onChange={e => setForm(p => ({ ...p, isPopular: e.target.checked }))} className="accent-primary-500" />
            Mark as Popular
          </label>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="accent-primary-500" />
            Active (visible)
          </label>
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
        <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-semibold text-sm focus:outline-none focus:ring-1 focus:ring-primary-500" placeholder="Short plan description..." />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Features (one per line)</label>
        <textarea value={form.features} onChange={e => setForm(p => ({ ...p, features: e.target.value }))} rows={4} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-semibold text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none" placeholder="20 AI interviews per month&#10;Monaco code editor&#10;Priority support" />
      </div>
      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 disabled:opacity-60">
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
          {saving ? 'Saving...' : 'Save Plan'}
        </button>
        <button onClick={() => { setEditingId(null); setShowCreate(false); resetForm(); }} className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800/50">
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-base text-slate-800 dark:text-white">All Subscription Plans</h3>
        <button onClick={() => { setShowCreate(true); setEditingId(null); resetForm(); }} className="px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all">
          <Plus size={14} /> New Plan
        </button>
      </div>

      {error && <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 text-xs font-semibold border border-rose-100 dark:border-rose-950/30">{error}</div>}
      {success && <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 text-xs font-semibold border border-emerald-100 dark:border-emerald-950/30">{success}</div>}

      {(showCreate || editingId) && <PlanForm />}

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={28} className="animate-spin text-primary-500" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className="glass-premium rounded-3xl p-6 space-y-4 relative">
              {plan.isPopular && (
                <div className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full bg-primary-500 text-white text-[9px] font-extrabold uppercase tracking-wider">Popular</div>
              )}
              {!plan.isActive && (
                <div className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full bg-slate-500/20 text-slate-500 text-[9px] font-extrabold uppercase tracking-wider">Inactive</div>
              )}
              <div>
                <h4 className="font-extrabold text-lg text-slate-800 dark:text-white">{plan.name}</h4>
                <div className="font-extrabold text-3xl text-primary-500 mt-1">
                  {plan.price === 0 ? '₹0' : fmtINR(plan.price / 100)}
                  {plan.price > 0 && <span className="text-sm text-slate-400 font-semibold">/{plan.billingInterval}</span>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <div>Subscribers: <span className="font-bold text-slate-700 dark:text-slate-200">{plan.subscriberCount || 0}</span></div>
                <div>Revenue: <span className="font-bold text-emerald-600">₹{plan.revenueINR || '0'}</span></div>
                <div>Interviews: <span className="font-bold text-slate-700 dark:text-slate-200">{plan.interviewsAllowed === -1 ? '∞ Unlimited' : plan.interviewsAllowed}</span></div>
              </div>
              <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button onClick={() => openEdit(plan)} className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-center gap-1.5 transition-all">
                  <Pencil size={12} /> Edit
                </button>
                <button onClick={() => handleDelete(plan.id)} disabled={deletingId === plan.id} className="flex-1 py-2 rounded-xl border border-rose-100 dark:border-rose-950/30 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50">
                  {deletingId === plan.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 4. USER REGISTRY ─────────────────────────────────────────────────────────
function UserRegistryPanel({ users, allUsers, loading, searchQuery, setSearchQuery, roleFilter, setRoleFilter, onToggleBan, banningId, onRefresh }) {
  return (
    <div className="glass-premium rounded-3xl p-6 space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <h3 className="font-bold text-base text-slate-800 dark:text-white flex items-center gap-2">
          <Users size={18} className="text-primary-500" />
          User Registry <span className="text-xs font-bold text-slate-400">({users.length} of {allUsers.length})</span>
        </h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search name or email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-7 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-500 font-semibold text-slate-700 dark:text-slate-200 w-56" />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-300 focus:outline-none">
            <option value="all">All Roles</option>
            <option value="candidate">Candidates</option>
            <option value="recruiter">Recruiters</option>
            <option value="admin">Admins</option>
          </select>
          <button onClick={onRefresh} className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={28} className="animate-spin text-primary-500" /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase font-extrabold tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="pb-3">User</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Interviews</th>
                <th className="pb-3">Spent (INR)</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-400 font-semibold"><AlertCircle className="mx-auto mb-2 text-slate-300" size={28} />{searchQuery ? 'No matching users' : 'No users found'}</td></tr>
              ) : users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="py-3.5">
                    <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1">{u.name}{u.role === 'admin' && <ShieldCheck size={13} className="text-primary-500" />}</div>
                    <div className="text-[10px] text-slate-400">{u.email}</div>
                  </td>
                  <td className="py-3.5">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wide ${u.role === 'admin' ? 'bg-primary-500/10 text-primary-500' : u.role === 'recruiter' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{u.role}</span>
                  </td>
                  <td className="py-3.5 text-xs">
                    <div className="font-bold text-slate-700 dark:text-slate-200">{u.totalInterviews || 0} total</div>
                    <div className="text-slate-400">{u.completedInterviews || 0} done</div>
                  </td>
                  <td className="py-3.5 font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                    {u.totalSpent > 0 ? fmtINR(u.totalSpent / 100) : '—'}
                  </td>
                  <td className="py-3.5">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase border ${u.isBanned ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                      {u.isBanned ? 'Banned' : 'Active'}
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    {u.role === 'admin' ? (
                      <span className="text-[10px] text-slate-400 font-bold italic">Protected</span>
                    ) : (
                      <button onClick={() => onToggleBan(u.id, u.isBanned)} disabled={banningId === u.id} className={`px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all border disabled:opacity-50 flex items-center gap-1 ml-auto ${u.isBanned ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-950/30 text-emerald-600' : 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-950/30 text-rose-600'}`}>
                        {banningId === u.id ? <Loader2 size={10} className="animate-spin" /> : u.isBanned ? <><UserCheck size={10} /> Revoke</> : <><UserX size={10} /> Suspend</>}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── 5. MAINTENANCE MODE ─────────────────────────────────────────────────────
function MaintenancePanel({ token }) {
  const [status, setStatus] = useState({ enabled: false, message: '', estimatedTime: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/maintenance', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setStatus(d); })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const r = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(status)
      });
      if (r.ok) {
        const d = await r.json();
        setStatus(d.maintenanceMode);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 size={32} className="animate-spin text-primary-500" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Big Toggle Card */}
      <div className={`rounded-3xl p-8 border-2 transition-all ${status.enabled ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/20' : 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20'} glass-premium`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${status.enabled ? 'bg-rose-500/20 text-rose-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
              {status.enabled ? <Wrench size={32} /> : <Activity size={32} />}
            </div>
            <div>
              <h3 className="font-extrabold text-xl text-slate-800 dark:text-white">Maintenance Mode</h3>
              <div className={`flex items-center gap-1.5 text-sm font-bold mt-0.5 ${status.enabled ? 'text-rose-500' : 'text-emerald-500'}`}>
                <span className={`w-2 h-2 rounded-full ${status.enabled ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                {status.enabled ? 'Platform is OFFLINE for users' : 'Platform is LIVE and operational'}
              </div>
            </div>
          </div>

          <button
            onClick={() => setStatus(s => ({ ...s, enabled: !s.enabled }))}
            className={`relative w-14 h-7 rounded-full transition-all duration-300 ${status.enabled ? 'bg-rose-500' : 'bg-emerald-500'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${status.enabled ? 'translate-x-7' : 'translate-x-0'}`}></span>
          </button>
        </div>

        {status.enabled && (
          <div className="p-4 rounded-2xl bg-rose-100 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm font-semibold flex items-start gap-2">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <span>⚠ Maintenance mode is <strong>ACTIVE</strong>. All candidate, recruiter, and code execution API routes will return a 503 response. Admin routes remain accessible.</span>
          </div>
        )}
      </div>

      {/* Configuration */}
      <div className="glass-premium rounded-3xl p-6 space-y-5">
        <h4 className="font-bold text-base text-slate-800 dark:text-white">Maintenance Message</h4>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">User-Facing Message</label>
          <textarea
            value={status.message}
            onChange={e => setStatus(s => ({ ...s, message: e.target.value }))}
            rows={3}
            className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-semibold text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
            placeholder="PrepAI is currently undergoing scheduled maintenance. We'll be back shortly..."
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Estimated Completion Time (optional)</label>
          <input
            value={status.estimatedTime}
            onChange={e => setStatus(s => ({ ...s, estimatedTime: e.target.value }))}
            className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-semibold text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="e.g. 2 hours, or 15:00 IST, May 21st"
          />
        </div>

        <button onClick={handleSave} disabled={saving} className="px-8 py-3 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm uppercase tracking-wider transition-all disabled:opacity-60 flex items-center gap-2">
          {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Power size={16} />}
          {saving ? 'Applying...' : saved ? 'Saved Successfully!' : `Apply — Turn ${status.enabled ? 'ON' : 'OFF'} Maintenance`}
        </button>
      </div>
    </div>
  );
}

// ─── 6. QUESTION BANK PANEL ──────────────────────────────────────────────────
function QuestionsPanel({ token }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [domainFilter, setDomainFilter] = useState('all');

  // Form State
  const [form, setForm] = useState({
    type: 'interview',
    domain: 'Backend',
    difficulty: 'Medium',
    title: '',
    description: '',
    constraints: [],
    testCases: [{ input: '', expected: '' }],
    starterCode: { javascript: '', python: '', cpp: '', java: '' },
    testCode: { javascript: '', python: '', cpp: '', java: '' },
    tags: [],
    isActive: true
  });

  // Sub-tabs for Coding Challenge form
  const [formSubTab, setFormSubTab] = useState('basic'); // 'basic' | 'sandbox'
  const [activeLangTab, setActiveLangTab] = useState('javascript');

  // Multi-input helpers
  const [newConstraint, setNewConstraint] = useState('');
  const [newTag, setNewTag] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/questions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (r.ok) setQuestions(await r.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const resetForm = () => {
    setForm({
      type: 'interview',
      domain: 'Backend',
      difficulty: 'Medium',
      title: '',
      description: '',
      constraints: [],
      testCases: [{ input: '', expected: '' }],
      starterCode: { javascript: '', python: '', cpp: '', java: '' },
      testCode: { javascript: '', python: '', cpp: '', java: '' },
      tags: [],
      isActive: true
    });
    setFormSubTab('basic');
    setNewConstraint('');
    setNewTag('');
    setError('');
  };

  const handlePrepopulate = () => {
    setForm(p => ({
      ...p,
      type: 'coding',
      title: 'Add Two Numbers',
      domain: 'DSA',
      difficulty: 'Easy',
      description: 'Create a function/class method `add` that takes two integers `a` and `b` as parameters and returns their sum.',
      constraints: [
        '-10^9 <= a, b <= 10^9',
        'a and b are integers'
      ],
      testCases: [
        { input: 'a = 2, b = 3', expected: '5' },
        { input: 'a = -1, b = 5', expected: '4' }
      ],
      starterCode: {
        javascript: `function add(a, b) {\n  // Write your code here\n  return 0;\n}`,
        python: `def add(a, b):\n    # Write your code here\n    return 0`,
        cpp: `class Solution {\npublic:\n    int add(int a, int b) {\n        // Write your code here\n        return 0;\n    }\n};`,
        java: `class Solution {\n    public int add(int a, int b) {\n        // Write your code here\n        return 0;\n    }\n}`
      },
      testCode: {
        javascript: `// JavaScript assertions\ntry {\n  const res1 = add(2, 3);\n  console.log("TEST_CASE_1_RESULT: " + (res1 === 5 ? "PASS" : "FAIL") + " | Got: " + res1);\n\n  const res2 = add(-1, 5);\n  console.log("TEST_CASE_2_RESULT: " + (res2 === 4 ? "PASS" : "FAIL") + " | Got: " + res2);\n} catch (e) {\n  console.error("Runner Error: " + e.message);\n}`,
        python: `# Python assertions\ntry:\n    res1 = add(2, 3)\n    print(f"TEST_CASE_1_RESULT: {'PASS' if res1 == 5 else 'FAIL'} | Got: {res1}")\n\n    res2 = add(-1, 5)\n    print(f"TEST_CASE_2_RESULT: {'PASS' if res2 == 4 else 'FAIL'} | Got: {res2}")\nexcept Exception as e:\n    print("Runner Error:", str(e))`,
        cpp: `// C++ assertions\n#include <iostream>\nusing namespace std;\n\n//{{CANDIDATE_CODE}}\n\nint main() {\n    Solution solver;\n    int res1 = solver.add(2, 3);\n    cout << "TEST_CASE_1_RESULT: " << (res1 == 5 ? "PASS" : "FAIL") << " | Got: " << res1 << endl;\n\n    int res2 = solver.add(-1, 5);\n    cout << "TEST_CASE_2_RESULT: " << (res2 == 4 ? "PASS" : "FAIL") << " | Got: " << res2 << endl;\n    return 0;\n}`,
        java: `// Java assertions\nimport java.util.*;\n\n//{{CANDIDATE_CODE}}\n\nclass SolutionRunner {\n    public static void main(String[] args) {\n        Solution solver = new Solution();\n        int res1 = solver.add(2, 3);\n        System.out.println("TEST_CASE_1_RESULT: " + (res1 == 5 ? "PASS" : "FAIL") + " | Got: " + res1);\n\n        int res2 = solver.add(-1, 5);\n        System.out.println("TEST_CASE_2_RESULT: " + (res2 == 4 ? "PASS" : "FAIL") + " | Got: " + res2);\n    }\n}`
      },
      tags: ['Math', 'Basic']
    }));
    setSuccess('Boilerplate coding challenge pre-populated successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleEdit = (q) => {
    setEditingId(q.id);
    setShowForm(true);
    setForm({
      type: q.type,
      domain: q.domain,
      difficulty: q.difficulty,
      title: q.title,
      description: q.description || '',
      constraints: q.constraints || [],
      testCases: q.testCases && q.testCases.length > 0 ? q.testCases : [{ input: '', expected: '' }],
      starterCode: q.starterCode || { javascript: '', python: '', cpp: '', java: '' },
      testCode: q.testCode || { javascript: '', python: '', cpp: '', java: '' },
      tags: q.tags || [],
      isActive: q.isActive
    });
    setFormSubTab('basic');
  };

  const handleToggleActive = async (q) => {
    try {
      const r = await fetch(`/api/admin/questions/${q.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !q.isActive })
      });
      if (r.ok) {
        setQuestions(prev => prev.map(item => item.id === q.id ? { ...item, isActive: !item.isActive } : item));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question permanently? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      const r = await fetch(`/api/admin/questions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (r.ok) {
        setSuccess('Question deleted successfully.');
        fetchQuestions();
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    if (!form.title || !form.description) {
      setError('Title and Description are required.');
      setSaving(false);
      return;
    }

    try {
      const cleanedForm = { ...form };
      if (cleanedForm.type === 'interview') {
        cleanedForm.constraints = [];
        cleanedForm.testCases = [];
        cleanedForm.starterCode = {};
        cleanedForm.testCode = {};
      } else {
        // Filter out empty test cases
        cleanedForm.testCases = cleanedForm.testCases.filter(t => t.input && t.expected);
      }

      let r;
      if (editingId) {
        r = await fetch(`/api/admin/questions/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(cleanedForm)
        });
      } else {
        r = await fetch('/api/admin/questions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(cleanedForm)
        });
      }

      const data = await r.json();
      if (!r.ok) throw new Error(data.message || 'Operation failed');

      setSuccess(editingId ? 'Question updated successfully.' : 'Question created successfully.');
      setShowForm(false);
      setEditingId(null);
      resetForm();
      fetchQuestions();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // List filter logic
  const filteredQuestions = questions.filter(q => {
    const matchSearch = q.title?.toLowerCase().includes(searchQuery.toLowerCase()) || q.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = typeFilter === 'all' || q.type === typeFilter;
    const matchDomain = domainFilter === 'all' || q.domain === domainFilter;
    return matchSearch && matchType && matchDomain;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="font-bold text-base text-slate-800 dark:text-white flex items-center gap-2">
          <Scroll size={18} className="text-primary-500" />
          Question Repository <span className="text-xs font-bold text-slate-400">({filteredQuestions.length} items)</span>
        </h3>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            resetForm();
          }}
          className="px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all"
        >
          <Plus size={14} /> Add Question
        </button>
      </div>

      {error && <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 text-xs font-semibold border border-rose-100 dark:border-rose-950/30">{error}</div>}
      {success && <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 text-xs font-semibold border border-emerald-100 dark:border-emerald-950/30">{success}</div>}

      {/* CREATE & EDIT FORM DRAWER */}
      {showForm && (
        <div className="glass-premium rounded-3xl p-6 border-2 border-primary-500/20 space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <h4 className="font-extrabold text-base text-slate-800 dark:text-white">
              {editingId ? 'Modify Question Details' : 'Introduce New Question'}
            </h4>
            {form.type === 'coding' && !editingId && (
              <button
                type="button"
                onClick={handlePrepopulate}
                className="px-3.5 py-1.5 rounded-xl border border-dashed border-primary-500 text-primary-500 hover:bg-primary-500/10 text-xs font-bold uppercase transition-all"
              >
                Pre-populate Boilerplate Code
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Common Columns */}
            <div className="space-y-4 lg:col-span-1">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Question Type</label>
                <select
                  value={form.type}
                  onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-800 font-bold text-sm text-slate-700 dark:text-slate-200 focus:outline-none"
                >
                  <option value="interview">Interview Prompt (Qualitative)</option>
                  <option value="coding">Coding Challenge (Quantitative)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Domain / Subject Category</label>
                <select
                  value={form.domain}
                  onChange={e => setForm(p => ({ ...p, domain: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-800 font-bold text-sm text-slate-700 dark:text-slate-200 focus:outline-none"
                >
                  <option value="Frontend">Frontend Development</option>
                  <option value="Backend">Backend Development</option>
                  <option value="SystemDesign">System Design</option>
                  <option value="DSA">Data Structures & Algos (DSA)</option>
                  <option value="AIML">AI / Machine Learning</option>
                  <option value="HR">Human Resources (HR)</option>
                  <option value="Aptitude">Aptitude & Logical</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Complexity Rating</label>
                <div className="flex gap-2">
                  {['Easy', 'Medium', 'Hard'].map(diff => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, difficulty: diff }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-extrabold uppercase border transition-all ${
                        form.difficulty === diff
                          ? diff === 'Easy' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' :
                            diff === 'Medium' ? 'bg-primary-500/10 border-primary-500 text-primary-500' :
                            'bg-rose-500/10 border-rose-500 text-rose-500'
                          : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Question Title *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-semibold text-sm focus:outline-none"
                  placeholder="e.g. Design a URL Shortener or Fibonacci Numbers"
                />
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-350 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
                    className="accent-primary-500"
                  />
                  Active (Visible to candidates)
                </label>
              </div>

              {/* Tag Injector */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Subject Tags</label>
                <div className="flex gap-2">
                  <input
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newTag.trim() && !form.tags.includes(newTag.trim())) {
                          setForm(p => ({ ...p, tags: [...p.tags, newTag.trim()] }));
                          setNewTag('');
                        }
                      }
                    }}
                    placeholder="Type tag & hit Enter..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-semibold text-xs focus:outline-none"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-extrabold flex items-center gap-1">
                      {tag}
                      <button type="button" onClick={() => setForm(p => ({ ...p, tags: p.tags.filter(t => t !== tag) }))} className="hover:text-rose-500">
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Description & Detailed configuration */}
            <div className="space-y-4 lg:col-span-2">
              {form.type === 'interview' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Prompt Description *</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    rows={12}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-semibold text-sm focus:outline-none resize-none"
                    placeholder="Enter the detailed qualitative questions the AI will pose or rate candidate answers against..."
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Coding challenge form navigation tabs */}
                  <div className="flex border-b border-slate-100 dark:border-slate-800 pb-1 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormSubTab('basic')}
                      className={`pb-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                        formSubTab === 'basic' ? 'border-primary-500 text-primary-500' : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      1. Description & Constraints
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormSubTab('sandbox')}
                      className={`pb-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                        formSubTab === 'sandbox' ? 'border-primary-500 text-primary-500' : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      2. Starter & Runner Codes (Sandbox)
                    </button>
                  </div>

                  {formSubTab === 'basic' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Problem Description *</label>
                        <textarea
                          value={form.description}
                          onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                          rows={5}
                          className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-semibold text-sm focus:outline-none resize-none"
                          placeholder="Markdown supported description of the problem, input formats, output formats..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Constraints */}
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Constraints</label>
                          <div className="flex gap-2">
                            <input
                              value={newConstraint}
                              onChange={e => setNewConstraint(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (newConstraint.trim()) {
                                    setForm(p => ({ ...p, constraints: [...p.constraints, newConstraint.trim()] }));
                                    setNewConstraint('');
                                  }
                                }
                              }}
                              placeholder="Add constraint (e.g. n <= 10^5)..."
                              className="flex-1 px-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-semibold focus:outline-none"
                            />
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {form.constraints.map((c, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-500 text-[10px] font-extrabold flex items-center gap-1 border border-amber-500/10">
                                {c}
                                <button type="button" onClick={() => setForm(p => ({ ...p, constraints: p.constraints.filter((_, idx) => idx !== i) }))} className="hover:text-rose-500">
                                  <X size={10} />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Predefined test cases for visual UI display */}
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Predefined Test Cases (Visual Showcase)</label>
                          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                            {form.testCases.map((tc, idx) => (
                              <div key={idx} className="flex gap-2 items-center">
                                <input
                                  value={tc.input}
                                  onChange={e => setForm(p => {
                                    const next = [...p.testCases];
                                    next[idx].input = e.target.value;
                                    return { ...p, testCases: next };
                                  })}
                                  placeholder="Input: nums=[2,7], target=9"
                                  className="flex-1 px-3 py-1.5 text-[11px] rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-semibold focus:outline-none font-mono"
                                />
                                <input
                                  value={tc.expected}
                                  onChange={e => setForm(p => {
                                    const next = [...p.testCases];
                                    next[idx].expected = e.target.value;
                                    return { ...p, testCases: next };
                                  })}
                                  placeholder="Output: [0, 1]"
                                  className="w-1/3 px-3 py-1.5 text-[11px] rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-semibold focus:outline-none font-mono"
                                />
                                <button
                                  type="button"
                                  onClick={() => setForm(p => {
                                    const next = p.testCases.filter((_, i) => i !== idx);
                                    return { ...p, testCases: next.length === 0 ? [{ input: '', expected: '' }] : next };
                                  })}
                                  className="text-slate-400 hover:text-rose-500 p-1"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => setForm(p => ({ ...p, testCases: [...p.testCases, { input: '', expected: '' }] }))}
                              className="text-[10px] font-bold uppercase text-primary-500 flex items-center gap-0.5 hover:text-primary-600 mt-1"
                            >
                              <Plus size={10} /> Add Visual Case
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {formSubTab === 'sandbox' && (
                    <div className="space-y-4">
                      {/* Language tabs */}
                      <div className="flex gap-1 border-b border-slate-100 dark:border-slate-800 pb-1">
                        {['javascript', 'python', 'cpp', 'java'].map(lang => (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => setActiveLangTab(lang)}
                            className={`px-3 py-1 text-[11px] font-extrabold uppercase rounded-t-lg transition-all ${
                              activeLangTab === lang
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white border-t border-x border-slate-200 dark:border-slate-800'
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            {lang === 'javascript' ? 'JavaScript' : lang === 'python' ? 'Python 3' : lang === 'cpp' ? 'C++' : 'Java 17'}
                          </button>
                        ))}
                      </div>

                      {/* Code Editors */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 flex justify-between items-center">
                            <span>Starter Code template</span>
                            <span className="text-[9px] italic text-slate-500 font-medium">Shown to candidate</span>
                          </label>
                          <textarea
                            value={form.starterCode[activeLangTab] || ''}
                            onChange={e => setForm(p => {
                              const nextCode = { ...p.starterCode };
                              nextCode[activeLangTab] = e.target.value;
                              return { ...p, starterCode: nextCode };
                            })}
                            rows={9}
                            className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 font-mono text-[11px] leading-relaxed focus:outline-none resize-none"
                            placeholder={
                              activeLangTab === 'javascript' ? 'function solve() {\n  // Write logic here\n}' :
                              activeLangTab === 'python' ? 'def solve():\n    # Write logic here\n    pass' :
                              'class Solution {\npublic:\n    int solve() {}\n};'
                            }
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 flex justify-between items-center">
                            <span>Test Suite Assertions Runner</span>
                            <span className="text-[9px] italic text-slate-500 font-medium">
                              {activeLangTab === 'cpp' || activeLangTab === 'java' ? 'Must contain //{{CANDIDATE_CODE}}' : 'Appended after candidate code'}
                            </span>
                          </label>
                          <textarea
                            value={form.testCode[activeLangTab] || ''}
                            onChange={e => setForm(p => {
                              const nextCode = { ...p.testCode };
                              nextCode[activeLangTab] = e.target.value;
                              return { ...p, testCode: nextCode };
                            })}
                            rows={9}
                            className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-sky-400 font-mono text-[11px] leading-relaxed focus:outline-none resize-none"
                            placeholder={
                              activeLangTab === 'javascript' ? '// Assert result and print TEST_CASE_X_RESULT: PASS or FAIL' :
                              activeLangTab === 'python' ? '# Assert results and print TEST_CASE_X_RESULT: PASS' :
                              '// Use //{{CANDIDATE_CODE}}'
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 disabled:opacity-60"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              {saving ? 'Registering...' : 'Save Question'}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                resetForm();
              }}
              className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* FILTER CONTROLS */}
      <div className="glass-premium rounded-3xl p-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search title/prompt..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-7 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-500 font-semibold text-slate-700 dark:text-slate-200 w-56 animate-all"
            />
          </div>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-350 focus:outline-none"
          >
            <option value="all">All Modalities</option>
            <option value="interview">Interview Prompt (Qualitative)</option>
            <option value="coding">Coding Challenge (Sandbox)</option>
          </select>

          <select
            value={domainFilter}
            onChange={e => setDomainFilter(e.target.value)}
            className="px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-350 focus:outline-none"
          >
            <option value="all">All Domains</option>
            <option value="Frontend">Frontend Development</option>
            <option value="Backend">Backend Development</option>
            <option value="SystemDesign">System Design</option>
            <option value="DSA">Data Structures & Algos</option>
            <option value="AIML">AI / ML</option>
            <option value="HR">Human Resources</option>
            <option value="Aptitude">Aptitude & Logical</option>
          </select>
        </div>

        <button
          onClick={fetchQuestions}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          title="Sync question roster"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-primary-500' : ''} />
        </button>
      </div>

      {/* QUESTION ROSTER TABLE */}
      <div className="glass-premium rounded-3xl p-6 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={32} className="animate-spin text-primary-500" /></div>
        ) : filteredQuestions.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-semibold flex flex-col items-center gap-2">
            <AlertCircle size={32} className="opacity-30" />
            No questions created in the repository yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase font-extrabold tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="pb-3">Title / Core Concept</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Domain</th>
                  <th className="pb-3">Complexity</th>
                  <th className="pb-3">Visibility</th>
                  <th className="pb-3 text-right">Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredQuestions.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 max-w-sm">
                      <div className="font-bold text-slate-800 dark:text-white text-sm">{q.title}</div>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{q.description}</p>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase ${
                        q.type === 'coding' ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500' : 'bg-amber-50 dark:bg-amber-950/20 text-amber-500'
                      }`}>
                        {q.type}
                      </span>
                    </td>
                    <td className="py-4 text-xs font-bold text-slate-600 dark:text-slate-300">
                      {q.domain}
                    </td>
                    <td className="py-4">
                      <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase ${
                        q.difficulty === 'Easy' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500' :
                        q.difficulty === 'Medium' ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-500' :
                        'bg-rose-50 dark:bg-rose-950/20 text-rose-500'
                      }`}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="py-4">
                      <button
                        onClick={() => handleToggleActive(q)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase border transition-all ${
                          q.isActive
                            ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-950/30 text-emerald-600 hover:bg-rose-50 hover:border-rose-100 dark:hover:bg-rose-950/20 dark:hover:border-rose-950/30 hover:text-rose-600'
                            : 'bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700/50 text-slate-500 hover:bg-emerald-50 hover:border-emerald-100 dark:hover:bg-emerald-950/20 dark:hover:border-emerald-950/30 hover:text-emerald-600'
                        }`}
                        title={q.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {q.isActive ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleEdit(q)}
                          className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-white transition-all"
                          title="Modify details"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(q.id)}
                          disabled={deletingId === q.id}
                          className="p-1.5 rounded-xl border border-rose-100 dark:border-rose-950/30 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all disabled:opacity-50"
                          title="Purge permanently"
                        >
                          {deletingId === q.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        </button>
                      </div>
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
}

// ─── 7. BANNER & BROADCAST PANEL ─────────────────────────────────────────────
function BroadcastPanel({ token }) {
  const [banner, setBanner] = useState({ enabled: false, message: '', color: 'indigo', link: '' });
  const [bannerLoading, setBannerLoading] = useState(true);
  const [bannerSaving, setBannerSaving] = useState(false);
  const [bannerSaved, setBannerSaved] = useState(false);
  const [subject, setSubject] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [targetRole, setTargetRole] = useState('all');
  const [sending, setSending] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState(null);
  const [broadcastError, setBroadcastError] = useState('');

  const colorOptions = [
    { value: 'indigo', label: 'Indigo', cls: 'bg-indigo-500' },
    { value: 'emerald', label: 'Emerald', cls: 'bg-emerald-500' },
    { value: 'amber', label: 'Amber', cls: 'bg-amber-500' },
    { value: 'rose', label: 'Rose', cls: 'bg-rose-500' },
    { value: 'slate', label: 'Slate', cls: 'bg-slate-600' },
    { value: 'orange', label: 'Orange', cls: 'bg-orange-500' }
  ];

  const previewBg = {
    indigo: 'from-indigo-600 to-violet-600',
    emerald: 'from-emerald-600 to-teal-600',
    amber: 'from-amber-500 to-orange-500',
    rose: 'from-rose-600 to-pink-600',
    slate: 'from-slate-700 to-slate-800',
    orange: 'from-orange-500 to-amber-600'
  };

  useEffect(() => {
    fetch('/api/admin/banner', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setBanner(d); })
      .finally(() => setBannerLoading(false));
  }, []);

  const handleBannerSave = async () => {
    setBannerSaving(true);
    setBannerSaved(false);
    try {
      const r = await fetch('/api/admin/banner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(banner)
      });
      if (r.ok) { setBannerSaved(true); setTimeout(() => setBannerSaved(false), 3000); }
    } finally { setBannerSaving(false); }
  };

  const handleBroadcast = async () => {
    if (!subject.trim() || !broadcastMsg.trim()) {
      setBroadcastError('Subject and message are both required.');
      return;
    }
    setSending(true);
    setBroadcastResult(null);
    setBroadcastError('');
    try {
      const r = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ subject, message: broadcastMsg, role: targetRole })
      });
      const d = await r.json();
      if (r.ok) { setBroadcastResult(d.message); setSubject(''); setBroadcastMsg(''); }
      else { setBroadcastError(d.message || 'Broadcast failed.'); }
    } catch (err) { setBroadcastError('Network error. Please try again.'); }
    finally { setSending(false); }
  };

  if (bannerLoading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 size={32} className="animate-spin text-primary-500" />
    </div>
  );

  return (
    <div className="space-y-6">

      {/* ─── Banner Customizer Card ─── */}
      <div className="glass-premium rounded-3xl p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-primary-500/10 text-primary-500 flex items-center justify-center">
            <Megaphone size={22} />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-800 dark:text-white">Announcement Banner</h3>
            <p className="text-xs text-slate-400 font-medium">Configure a global banner shown to all logged-in users on every page.</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className={`text-xs font-extrabold uppercase ${banner.enabled ? 'text-emerald-500' : 'text-slate-400'}`}>
              {banner.enabled ? '● Live' : '○ Off'}
            </span>
            <button
              onClick={() => setBanner(b => ({ ...b, enabled: !b.enabled }))}
              className={`relative w-12 h-6 rounded-full transition-all duration-300 ${banner.enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${banner.enabled ? 'translate-x-6' : 'translate-x-0'}`}></span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Announcement Message</label>
              <textarea
                value={banner.message}
                onChange={e => setBanner(b => ({ ...b, message: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-semibold text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
                placeholder="🚀 New AI mock features are now live! Click to explore..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Action Link (optional)</label>
              <input
                type="url"
                value={banner.link}
                onChange={e => setBanner(b => ({ ...b, link: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-semibold text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="https://prepai.com/new-features"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Banner Color Theme</label>
              <div className="flex gap-2 flex-wrap">
                {colorOptions.map(c => (
                  <button
                    key={c.value}
                    onClick={() => setBanner(b => ({ ...b, color: c.value }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                      banner.color === c.value
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/20'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-400'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${c.cls}`}></span>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Live Preview</label>
            <div className={`rounded-2xl overflow-hidden shadow-lg bg-gradient-to-r ${previewBg[banner.color] || previewBg.indigo}`}>
              <div className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                    <Megaphone size={12} className="text-white" />
                  </div>
                  <p className="text-white text-xs font-semibold">
                    {banner.message || 'Your announcement message will appear here…'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {banner.link && (
                    <span className="px-2.5 py-1 rounded-lg bg-white text-[10px] font-bold uppercase text-slate-700">
                      Learn More
                    </span>
                  )}
                  <span className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center">
                    <X size={10} className="text-white" />
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-2 italic">Live preview as seen by all users.</p>
            <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-dark-900/50 border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>Banner status</span>
                <span className={`font-bold ${banner.enabled ? 'text-emerald-500' : 'text-slate-400'}`}>{banner.enabled ? 'Showing globally' : 'Hidden'}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>Color theme</span>
                <span className="font-bold text-slate-700 dark:text-slate-200 capitalize">{banner.color}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>Has action link</span>
                <span className={`font-bold ${banner.link ? 'text-primary-500' : 'text-slate-400'}`}>{banner.link ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handleBannerSave}
            disabled={bannerSaving}
            className="px-8 py-3 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm uppercase tracking-wider transition-all disabled:opacity-60 flex items-center gap-2 shadow-md shadow-primary-500/20"
          >
            {bannerSaving ? <Loader2 size={16} className="animate-spin" /> : bannerSaved ? <Check size={16} /> : <Save size={16} />}
            {bannerSaving ? 'Saving...' : bannerSaved ? '✓ Saved!' : `Apply — Banner ${banner.enabled ? 'ON' : 'OFF'}`}
          </button>
          {bannerSaved && (
            <span className="text-xs text-emerald-500 font-bold">
              ✓ Changes applied. Banner is now {banner.enabled ? 'visible to all users.' : 'hidden.'}
            </span>
          )}
        </div>
      </div>

      {/* ─── Promotional Email Broadcaster ─── */}
      <div className="glass-premium rounded-3xl p-6 space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <Send size={20} />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-800 dark:text-white">Promotional Email Broadcaster</h3>
            <p className="text-xs text-slate-400 font-medium">Dispatch rich HTML email notifications to all or selected user segments in one click.</p>
          </div>
        </div>

        {broadcastResult && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 size={16} /> {broadcastResult}
          </div>
        )}
        {broadcastError && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-950/30 text-rose-600 dark:text-rose-400 text-sm font-semibold flex items-center gap-2">
            <AlertTriangle size={16} /> {broadcastError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={e => { setSubject(e.target.value); setBroadcastError(''); }}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-semibold text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="📢 Important Update from PrepAI!"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Target Audience</label>
            <select
              value={targetRole}
              onChange={e => setTargetRole(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-800 font-bold text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="all">All Users (Candidates + Recruiters)</option>
              <option value="candidate">Candidates Only</option>
              <option value="recruiter">Recruiters Only</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Message Body *</label>
          <textarea
            value={broadcastMsg}
            onChange={e => { setBroadcastMsg(e.target.value); setBroadcastError(''); }}
            rows={8}
            className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-semibold text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
            placeholder={"Dear Candidate,\n\nWe are thrilled to announce new AI evaluation features...\n\nBest regards,\nThe PrepAI Team"}
          />
          <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Supports HTML. Line breaks are preserved. Each email is automatically personalized with the recipient's name.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handleBroadcast}
            disabled={sending || !subject.trim() || !broadcastMsg.trim()}
            className="px-8 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-primary-600 hover:from-indigo-700 hover:to-primary-700 text-white font-bold text-sm uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-primary-500/20"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {sending ? 'Dispatching Emails...' : 'Send Broadcast Email'}
          </button>
          <span className="text-xs text-slate-400 font-medium">Emails are dispatched in parallel to all matching registered users via SMTP.</span>
        </div>
      </div>
    </div>
  );
}
