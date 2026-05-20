import React, { useState } from 'react';
import Header from '../../components/Header';
import { FolderKanban, Plus, Check, Building2, Trash2, Edit2, AlertCircle } from 'lucide-react';

const initialTemplates = [
  { id: 't1', name: 'Google L4 Frontend Round', domain: 'Frontend', type: 'Technical', company: 'Google', qCount: 4 },
  { id: 't2', name: 'Amazon Web Services SDE-2', domain: 'Backend', type: 'Technical', company: 'Amazon', qCount: 4 },
  { id: 't3', name: 'Accenture Associate Developer', domain: 'DSA', type: 'Coding', company: 'Accenture', qCount: 2 }
];

export default function AdminTemplates() {
  const [templates, setTemplates] = useState(initialTemplates);
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('Frontend');
  const [type, setType] = useState('Technical');
  const [company, setCompany] = useState('Google');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddTemplate = (e) => {
    e.preventDefault();
    if (!name) return;

    const newTemplate = {
      id: 't-' + Date.now(),
      name,
      domain,
      type,
      company,
      qCount: 4
    };

    setTemplates([...templates, newTemplate]);
    setName('');
    setShowAddForm(false);
    alert(`Success: Standard interview template '${name}' registered successfully.`);
  };

  const handleDelete = (id) => {
    if (window.confirm('Confirm delete this interview template?')) {
      setTemplates(templates.filter(t => t.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <Header title="Manage Templates" />

      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 text-slate-400 font-extrabold text-xs uppercase">
          <FolderKanban size={16} />
          <span>Preset Library ({templates.length})</span>
        </div>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="px-3.5 py-1.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1"
        >
          <Plus size={14} /> Add Template
        </button>
      </div>

      {/* Grid of Templates cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {templates.map((temp) => (
          <div key={temp.id} className="glass-premium rounded-3xl p-6 relative overflow-hidden group border border-slate-200/40 dark:border-slate-800/80 flex flex-col justify-between h-[200px]">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-[10px] uppercase flex items-center gap-1">
                  <Building2 size={10} /> {temp.company}
                </span>
                <span className="text-[10px] font-extrabold uppercase text-primary-500 tracking-wider">
                  {temp.type}
                </span>
              </div>
              <h4 className="font-bold text-slate-800 dark:text-white group-hover:text-primary-500 transition-colors">{temp.name}</h4>
              <p className="text-xs text-slate-400 font-medium">Domain: {temp.domain} • Questions: {temp.qCount} items</p>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-850 pt-3">
              <button
                onClick={() => handleDelete(temp.id)}
                className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 active:scale-95 transition-all"
                title="Delete template"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Template Modal Overlay */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-premium rounded-3xl p-8 border border-slate-200/20 shadow-2xl relative">
            <button
              onClick={() => setShowAddForm(false)}
              className="absolute right-4 top-4 font-bold text-sm text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>

            <form onSubmit={handleAddTemplate} className="space-y-4">
              <div className="text-center space-y-2 mb-4">
                <h3 className="font-extrabold text-xl text-slate-800 dark:text-white flex items-center justify-center gap-1.5">
                  <FolderKanban className="text-primary-500" size={20} /> Create Template
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">Define the name and domain for the mock interview.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Template Title</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. AWS Mid Backend Assessment"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 dark:bg-dark-900/50 dark:border-slate-800/80 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-semibold text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Domain</label>
                  <select
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-800 text-slate-750 dark:text-slate-200 font-bold text-xs focus:outline-none"
                  >
                    <option value="Frontend">Frontend</option>
                    <option value="Backend">Backend</option>
                    <option value="AI/ML">AI/ML</option>
                    <option value="DSA">DSA</option>
                    <option value="HR">HR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Company</label>
                  <select
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-800 text-slate-750 dark:text-slate-200 font-bold text-xs focus:outline-none"
                  >
                    <option value="Google">Google</option>
                    <option value="Amazon">Amazon</option>
                    <option value="Microsoft">Microsoft</option>
                    <option value="Accenture">Accenture</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-2xl font-bold transition-all active:scale-[0.99] flex items-center justify-center gap-2"
              >
                Register Template
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
