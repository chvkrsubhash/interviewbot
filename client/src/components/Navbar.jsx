import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Sparkles, Terminal } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleDashboardRedirect = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role === 'admin') navigate('/admin');
    else if (user.role === 'recruiter') navigate('/recruiter');
    else navigate('/candidate');
  };

  return (
    <nav className="sticky top-0 z-50 glass-premium px-6 py-4 flex justify-between items-center transition-all duration-300">
      <Link to="/" className="flex items-center gap-2 group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform">
          <Terminal size={20} />
        </div>
        <div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-slate-900 to-indigo-950 dark:from-white dark:to-primary-200 bg-clip-text text-transparent">
            PrepAI
          </span>
          <span className="text-[10px] block font-bold text-primary-500 tracking-widest uppercase -mt-1">
            Mock Interviews
          </span>
        </div>
      </Link>

      <div className="hidden md:flex items-center gap-8 font-medium">
        <a href="#features" className="text-slate-600 dark:text-slate-300 hover:text-primary-500 dark:hover:text-primary-400 transition-colors">Features</a>
        <a href="#pricing" className="text-slate-600 dark:text-slate-300 hover:text-primary-500 dark:hover:text-primary-400 transition-colors">Pricing</a>
        <a href="#faq" className="text-slate-600 dark:text-slate-300 hover:text-primary-500 dark:hover:text-primary-400 transition-colors">FAQ</a>
        <a href="#contact" className="text-slate-600 dark:text-slate-300 hover:text-primary-500 dark:hover:text-primary-400 transition-colors">Contact</a>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all active:scale-95"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {user ? (
          <div className="flex items-center gap-3">
            <button
              onClick={handleDashboardRedirect}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-primary-500/20 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Sparkles size={15} /> Dashboard
            </button>
            <button
              onClick={logout}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300 text-sm font-semibold transition-all active:scale-95"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-primary-500 dark:hover:text-primary-400 text-sm font-semibold transition-colors"
            >
              Log In
            </Link>
            <Link
              to="/signup"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-primary-500/20 active:scale-95 transition-all"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
