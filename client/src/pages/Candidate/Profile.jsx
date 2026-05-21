import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { 
  User, Mail, Shield, Award, BookOpen, Cpu, Briefcase, Plus, Trash2, 
  Save, Loader2, CheckCircle2, AlertCircle, Calendar, Hash, Globe, Github
} from 'lucide-react';

export default function CandidateProfile() {
  const { user: authUser, updateProfile } = useAuth();
  
  // Profile state matching the user model
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    username: '',
    education: [],
    skills: [],
    certifications: [],
    projects: []
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  
  // Form input fields for creating new items
  const [newSkill, setNewSkill] = useState('');
  
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setProfile({
          name: data.name || '',
          email: data.email || '',
          username: data.username || '',
          education: data.education || [],
          skills: data.skills || [],
          certifications: data.certifications || [],
          projects: data.projects || []
        });
      } else {
        showFeedback('error', 'Failed to retrieve profile details.');
      }
    } catch (err) {
      showFeedback('error', 'Network error fetching profile details.');
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profile)
      });
      
      const data = await response.json();
      if (response.ok) {
        showFeedback('success', 'Your candidate profile has been updated!');
        if (updateProfile) {
          updateProfile(data.user);
        }
      } else {
        showFeedback('error', data.message || 'Failed to update profile details.');
      }
    } catch (err) {
      showFeedback('error', 'Network error saving profile changes.');
    } finally {
      setSaving(false);
    }
  };

  // Education Helpers
  const addEducation = () => {
    setProfile(prev => ({
      ...prev,
      education: [...prev.education, { institution: '', degree: '', fieldOfStudy: '', startYear: '', endYear: '' }]
    }));
  };

  const updateEducation = (index, field, value) => {
    const updated = [...profile.education];
    updated[index][field] = value;
    setProfile(prev => ({ ...prev, education: updated }));
  };

  const removeEducation = (index) => {
    setProfile(prev => ({
      ...prev,
      education: prev.education.filter((_, idx) => idx !== index)
    }));
  };

  // Skills Helpers
  const handleAddSkill = (e) => {
    e.preventDefault();
    const clean = newSkill.trim();
    if (!clean) return;
    if (profile.skills.includes(clean)) {
      setNewSkill('');
      return;
    }
    setProfile(prev => ({
      ...prev,
      skills: [...prev.skills, clean]
    }));
    setNewSkill('');
  };

  const removeSkill = (skill) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  // Certifications Helpers
  const addCertification = () => {
    setProfile(prev => ({
      ...prev,
      certifications: [...prev.certifications, { name: '', issuer: '', year: '', url: '' }]
    }));
  };

  const updateCertification = (index, field, value) => {
    const updated = [...profile.certifications];
    updated[index][field] = value;
    setProfile(prev => ({ ...prev, certifications: updated }));
  };

  const removeCertification = (index) => {
    setProfile(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, idx) => idx !== index)
    }));
  };

  // Projects Helpers
  const addProject = () => {
    setProfile(prev => ({
      ...prev,
      projects: [...prev.projects, { title: '', description: '', techStack: '', url: '', github: '' }]
    }));
  };

  const updateProject = (index, field, value) => {
    const updated = [...profile.projects];
    updated[index][field] = value;
    setProfile(prev => ({ ...prev, projects: updated }));
  };

  const removeProject = (index) => {
    setProfile(prev => ({
      ...prev,
      projects: prev.projects.filter((_, idx) => idx !== index)
    }));
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 size={40} className="animate-spin text-primary-500" />
        <p className="text-slate-400 mt-4 font-bold text-sm">Retrieving your candidate profile...</p>
      </div>
    );
  }

  const initials = profile.name ? profile.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'C';

  return (
    <div className="space-y-6">
      <Header title="My Professional Profile" />

      {/* Floating Status Notification */}
      {message && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl animate-fade-in ${
          message.type === 'success' 
            ? 'bg-emerald-500 text-white shadow-emerald-500/10' 
            : 'bg-rose-500 text-white shadow-rose-500/10'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="font-semibold text-sm">{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-6">
        
        {/* SECTION 1: HEADER USER CARD */}
        <div className="glass-premium rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-tr from-primary-500/10 to-indigo-500/10 rounded-full blur-3xl -z-10"></div>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-primary-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-3xl shadow-xl shadow-primary-500/20">
              {initials}
            </div>
            
            <div className="flex-1 space-y-4 w-full text-center md:text-left">
              <div>
                <h3 className="font-extrabold text-2xl text-slate-800 dark:text-white flex flex-col md:flex-row md:items-center gap-2">
                  {profile.name}
                  <span className="inline-flex self-center md:self-auto items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary-500/10 text-primary-500 uppercase border border-primary-500/20">
                    <Shield size={12} /> {authUser?.role || 'Candidate'}
                  </span>
                  {authUser?.plan?.name && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 uppercase border border-emerald-500/20 ml-2">
                      <Zap size={12} /> {authUser.plan.name}
                    </span>
                  )}
                </h3>
                <p className="text-slate-400 text-sm font-semibold flex items-center justify-center md:justify-start gap-1.5 mt-1">
                  <Mail size={14} /> {profile.email}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    Full Display Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      required
                      placeholder="e.g. John Doe"
                      className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-sm font-semibold outline-none focus:border-primary-500 transition-all dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    Unique Username
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-3.5 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      value={profile.username}
                      onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                      placeholder="e.g. johndoe_99"
                      className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-sm font-semibold outline-none focus:border-primary-500 transition-all dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT SIDEBAR: SKILLS PANEL */}
          <div className="space-y-6 lg:col-span-1">
            <div className="glass-premium rounded-3xl p-6 space-y-6">
              <h3 className="font-extrabold text-base text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Cpu size={18} className="text-primary-500" />
                Technical Skills
              </h3>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Add skill (e.g. React)"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSkill(e)}
                    className="flex-1 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-semibold outline-none focus:border-primary-500 transition-all dark:text-white"
                  />
                  <button 
                    type="button"
                    onClick={handleAddSkill}
                    className="p-3 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl hover:scale-102 active:scale-98 transition-all flex items-center justify-center"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {profile.skills.length === 0 ? (
                    <div className="text-center py-6 w-full text-slate-400 text-xs font-semibold">
                      No skills added yet. Insert core technologies.
                    </div>
                  ) : (
                    profile.skills.map((skill, index) => (
                      <span 
                        key={index} 
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 group"
                      >
                        {skill}
                        <button 
                          type="button" 
                          onClick={() => removeSkill(skill)}
                          className="hover:text-rose-500 font-extrabold text-sm ml-1 select-none transition-colors"
                        >
                          &times;
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANELS: EDUCATION, CERTIFICATIONS, PROJECTS */}
          <div className="space-y-6 lg:col-span-2">
            
            {/* SECTION 2: EDUCATIONAL BACKGROUND */}
            <div className="glass-premium rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-extrabold text-base text-slate-800 dark:text-white flex items-center gap-2">
                  <BookOpen size={18} className="text-primary-500" />
                  Education History
                </h3>
                <button 
                  type="button"
                  onClick={addEducation}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-primary-500/15 text-primary-500 hover:bg-primary-500/20 transition-all active:scale-98"
                >
                  <Plus size={14} /> Add Education
                </button>
              </div>

              <div className="space-y-4">
                {profile.education.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm font-semibold">
                    No educational details added yet. Let recruiters know your background.
                  </div>
                ) : (
                  profile.education.map((edu, index) => (
                    <div key={index} className="p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 space-y-4 relative group">
                      <button 
                        type="button"
                        onClick={() => removeEducation(index)}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Institution / School / College</label>
                          <input 
                            type="text" 
                            value={edu.institution}
                            onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                            required
                            placeholder="e.g. Indian Institute of Technology"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-primary-500 transition-all dark:text-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Degree / Qualification</label>
                          <input 
                            type="text" 
                            value={edu.degree}
                            onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                            required
                            placeholder="e.g. Bachelor of Technology"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-primary-500 transition-all dark:text-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Field of Study</label>
                          <input 
                            type="text" 
                            value={edu.fieldOfStudy}
                            onChange={(e) => updateEducation(index, 'fieldOfStudy', e.target.value)}
                            placeholder="e.g. Computer Science & Engineering"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-primary-500 transition-all dark:text-white"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Start Year</label>
                            <input 
                              type="number" 
                              value={edu.startYear}
                              onChange={(e) => updateEducation(index, 'startYear', e.target.value)}
                              placeholder="e.g. 2022"
                              className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-primary-500 transition-all dark:text-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">End Year (or Expected)</label>
                            <input 
                              type="number" 
                              value={edu.endYear}
                              onChange={(e) => updateEducation(index, 'endYear', e.target.value)}
                              placeholder="e.g. 2026"
                              className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-primary-500 transition-all dark:text-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* SECTION 3: CERTIFICATIONS VAULT */}
            <div className="glass-premium rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-extrabold text-base text-slate-800 dark:text-white flex items-center gap-2">
                  <Award size={18} className="text-primary-500" />
                  Certifications
                </h3>
                <button 
                  type="button"
                  onClick={addCertification}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-primary-500/15 text-primary-500 hover:bg-primary-500/20 transition-all active:scale-98"
                >
                  <Plus size={14} /> Add Certification
                </button>
              </div>

              <div className="space-y-4">
                {profile.certifications.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm font-semibold">
                    No certifications added yet. Showcase your credentials.
                  </div>
                ) : (
                  profile.certifications.map((cert, index) => (
                    <div key={index} className="p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 space-y-4 relative group">
                      <button 
                        type="button"
                        onClick={() => removeCertification(index)}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Certification Name</label>
                          <input 
                            type="text" 
                            value={cert.name}
                            onChange={(e) => updateCertification(index, 'name', e.target.value)}
                            required
                            placeholder="e.g. AWS Certified Solutions Architect"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-primary-500 transition-all dark:text-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Issuing Organization</label>
                          <input 
                            type="text" 
                            value={cert.issuer}
                            onChange={(e) => updateCertification(index, 'issuer', e.target.value)}
                            required
                            placeholder="e.g. Amazon Web Services"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-primary-500 transition-all dark:text-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Verification Link (URL)</label>
                          <div className="relative">
                            <Globe className="absolute left-3 top-3 text-slate-400" size={14} />
                            <input 
                              type="url" 
                              value={cert.url}
                              onChange={(e) => updateCertification(index, 'url', e.target.value)}
                              placeholder="e.g. https://aws.amazon.com/verify/..."
                              className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold outline-none focus:border-primary-500 transition-all dark:text-white"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Year of Issue</label>
                          <input 
                            type="number" 
                            value={cert.year}
                            onChange={(e) => updateCertification(index, 'year', e.target.value)}
                            placeholder="e.g. 2025"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-primary-500 transition-all dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* SECTION 4: PROJECTS SHOWCASE */}
            <div className="glass-premium rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-extrabold text-base text-slate-800 dark:text-white flex items-center gap-2">
                  <Briefcase size={18} className="text-primary-500" />
                  Projects Showcase
                </h3>
                <button 
                  type="button"
                  onClick={addProject}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-primary-500/15 text-primary-500 hover:bg-primary-500/20 transition-all active:scale-98"
                >
                  <Plus size={14} /> Add Project
                </button>
              </div>

              <div className="space-y-4">
                {profile.projects.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm font-semibold">
                    No projects added yet. Share your engineering accomplishments.
                  </div>
                ) : (
                  profile.projects.map((proj, index) => (
                    <div key={index} className="p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 space-y-4 relative group">
                      <button 
                        type="button"
                        onClick={() => removeProject(index)}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>

                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Project Title</label>
                            <input 
                              type="text" 
                              value={proj.title}
                              onChange={(e) => updateProject(index, 'title', e.target.value)}
                              required
                              placeholder="e.g. prepAI Platform"
                              className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-primary-500 transition-all dark:text-white"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Tech Stack (comma-separated list)</label>
                            <input 
                              type="text" 
                              value={proj.techStack}
                              onChange={(e) => updateProject(index, 'techStack', e.target.value)}
                              placeholder="e.g. React, Node.js, SQLite, Gemini API"
                              className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-primary-500 transition-all dark:text-white"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Project Description</label>
                          <textarea 
                            value={proj.description}
                            onChange={(e) => updateProject(index, 'description', e.target.value)}
                            required
                            rows="2"
                            placeholder="Provide a brief summary of the architectural scope or key features..."
                            className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-primary-500 transition-all dark:text-white resize-none"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">GitHub URL</label>
                            <div className="relative">
                              <Github className="absolute left-3 top-3 text-slate-400" size={14} />
                              <input 
                                type="url" 
                                value={proj.github}
                                onChange={(e) => updateProject(index, 'github', e.target.value)}
                                placeholder="e.g. https://github.com/username/project"
                                className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold outline-none focus:border-primary-500 transition-all dark:text-white"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Live Demo URL</label>
                            <div className="relative">
                              <Globe className="absolute left-3 top-3 text-slate-400" size={14} />
                              <input 
                                type="url" 
                                value={proj.url}
                                onChange={(e) => updateProject(index, 'url', e.target.value)}
                                placeholder="e.g. https://myproject-demo.com"
                                className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold outline-none focus:border-primary-500 transition-all dark:text-white"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* SAVE BUTTON CONTAINER */}
            <div className="flex justify-end pt-4">
              <button 
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary-500/20 hover:scale-102 active:scale-98 disabled:opacity-50 transition-all"
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Profile Details
                  </>
                )}
              </button>
            </div>
            
          </div>
        </div>
      </form>
    </div>
  );
}
