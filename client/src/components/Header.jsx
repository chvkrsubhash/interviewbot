import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Flame, Bell, Sun, Moon, Sparkles } from 'lucide-react';

export default function Header({ title }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="glass-premium rounded-3xl px-8 py-4 flex justify-between items-center z-30 transition-all duration-300">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          {title} <Sparkles size={16} className="text-primary-500 animate-pulse-slow" />
        </h1>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Welcome back to your personalized workspace</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Streak Counter */}
        {user && user.role === 'candidate' && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 font-bold text-sm shadow-sm border border-orange-100 dark:border-orange-950/40 animate-float">
            <Flame size={16} fill="currentColor" />
            <span>{user.streak || 0} Day Streak</span>
          </div>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all active:scale-95"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Mock Notification Bell */}
        <div className="relative">
          <button className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all active:scale-95">
            <Bell size={16} />
          </button>
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary-500 animate-ping"></span>
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary-500"></span>
        </div>
      </div>
    </header>
  );
}
