// Premium Admin User Plans Management UI
import React, { useState, useEffect } from 'react';
import { Loader2, Check, X, ShieldCheck, Users, RefreshCw } from 'lucide-react';

// Helper to format INR values
const fmtINR = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);

export default function UserPlans({ token }) {
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch users (admin endpoint)
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const r = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) setUsers(await r.json());
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch plans for dropdown
  const fetchPlans = async () => {
    setLoadingPlans(true);
    try {
      const r = await fetch('/api/admin/plans', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) setPlans(await r.json());
    } finally {
      setLoadingPlans(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchPlans();
  }, []);

  const handlePlanChange = async (userId, planId) => {
    setUpdatingId(userId);
    setError('');
    setSuccess('');
    try {
      const r = await fetch(`/api/admin/users/${userId}/plan`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planId }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || 'Failed to update plan');
      setSuccess(`Plan updated for ${data.userId}`);
      // Refresh list to show new plan value
      fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="glass-premium rounded-3xl p-6 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-base text-slate-800 dark:text-white">
          User Plan Management
        </h3>
        <button
          onClick={() => {
            fetchUsers();
            fetchPlans();
          }}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          title="Refresh"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 text-xs font-semibold border border-rose-100 dark:border-rose-950/30">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 text-xs font-semibold border border-emerald-100 dark:border-emerald-950/30">
          {success}
        </div>
      )}

      {loadingUsers || loadingPlans ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-primary-500" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase font-extrabold tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="pb-3">User</th>
                <th className="pb-3">Current Plan</th>
                <th className="pb-3">Change To</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="py-3">
                    <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1">
                      {u.name}
                      {u.role === 'admin' && <ShieldCheck size={13} className="text-primary-500" />}
                    </div>
                    <div className="text-[10px] text-slate-400">{u.email}</div>
                  </td>
                  <td className="py-3 font-medium text-slate-800 dark:text-slate-200">
                    {u.plan ? `Plan ID: ${u.plan}` : '—'}
                  </td>
                  <td className="py-3">
                    <select
                      value={u.plan?.id || ''}
                      onChange={(e) => handlePlanChange(u.id, e.target.value)}
                      disabled={updatingId === u.id}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      <option value="" disabled>
                        Select Plan
                      </option>
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} – {fmtINR(p.price / 100)} / {p.billingInterval}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 text-right">
                    {updatingId === u.id ? (
                      <Loader2 size={16} className="animate-spin text-primary-500" />
                    ) : (
                      <span className="text-xs text-slate-400">Ready</span>
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
