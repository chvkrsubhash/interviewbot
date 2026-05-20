import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Video, Code2, Trophy, Users, FolderKanban,
  FileSpreadsheet, LogOut, ShieldCheck, CalendarCheck,
  BadgeIndianRupee, CreditCard, Wrench, IndianRupee, Settings, Zap, User
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getLinks = () => {
    switch (user.role) {
      case 'admin':
        return [
          { to: '/admin', name: 'Overview', icon: <LayoutDashboard size={18} /> },
          { to: '/admin/income', name: 'Income & Revenue', icon: <IndianRupee size={18} /> },
          { to: '/admin/plans', name: 'Manage Plans', icon: <Zap size={18} /> },
          { to: '/admin/questions', name: 'Manage Questions', icon: <FileSpreadsheet size={18} /> },
          { to: '/admin/users', name: 'Manage Users', icon: <Users size={18} /> },
          { to: '/admin/maintenance', name: 'Maintenance Mode', icon: <Wrench size={18} /> },
          { to: '/admin/templates', name: 'Templates', icon: <FolderKanban size={18} /> },
        ];
      case 'recruiter':
        return [
          { to: '/recruiter', name: 'Recruitment Hub', icon: <LayoutDashboard size={18} /> },
          { to: '/recruiter/reports', name: 'Evaluations', icon: <FileSpreadsheet size={18} /> },
          { to: '/recruiter/schedule', name: 'Scheduling', icon: <CalendarCheck size={18} /> },
        ];
      default: // candidate
        return [
          { to: '/candidate', name: 'Home Panel', icon: <LayoutDashboard size={18} /> },
          { to: '/candidate/setup', name: 'New Interview', icon: <Video size={18} /> },
          { to: '/candidate/coding', name: 'Coding Editor', icon: <Code2 size={18} /> },
          { to: '/candidate/leaderboard', name: 'Leaderboard', icon: <Trophy size={18} /> },
          { to: '/candidate/plans', name: 'Upgrade Plan', icon: <CreditCard size={18} /> },
          { to: '/candidate/profile', name: 'My Profile', icon: <User size={18} /> },
        ];
    }
  };

  const links = getLinks();

  return (
    <aside className="fixed left-4 top-24 bottom-4 w-64 glass-premium rounded-3xl p-6 flex flex-col justify-between z-40 transition-all duration-300">
      <div className="flex flex-col gap-8">
        {/* User Card */}
        <div className="flex items-center gap-3 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-primary-500/10 uppercase">
            {user.name ? user.name[0] : 'U'}
          </div>
          <div className="overflow-hidden">
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{user.name}</h4>
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-primary-500 flex items-center gap-1">
              {user.role === 'admin' && <ShieldCheck size={10} />}
              {user.role}
            </span>
          </div>
        </div>

        {/* Links Navigation */}
        <nav className="flex flex-col gap-1.5">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/candidate' || link.to === '/recruiter' || link.to === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3.5 rounded-2xl font-semibold text-sm transition-all active:scale-98 ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-md shadow-primary-500/15'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-100'
                }`
              }
            >
              {link.icon}
              {link.name}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-3.5 rounded-2xl font-semibold text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 active:scale-98 transition-all"
      >
        <LogOut size={18} />
        Log Out
      </button>
    </aside>
  );
}
