import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { X, Megaphone, ShieldAlert, ArrowRight } from 'lucide-react';

// Color scheme mapping for banner color property
const colorSchemes = {
  indigo: {
    bg: 'bg-gradient-to-r from-indigo-600 to-violet-600',
    text: 'text-white',
    dismiss: 'bg-white/20 hover:bg-white/30 text-white',
    link: 'bg-white text-indigo-700 hover:bg-indigo-50',
    icon: 'text-indigo-200'
  },
  emerald: {
    bg: 'bg-gradient-to-r from-emerald-600 to-teal-600',
    text: 'text-white',
    dismiss: 'bg-white/20 hover:bg-white/30 text-white',
    link: 'bg-white text-emerald-700 hover:bg-emerald-50',
    icon: 'text-emerald-200'
  },
  amber: {
    bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
    text: 'text-white',
    dismiss: 'bg-white/20 hover:bg-white/30 text-white',
    link: 'bg-white text-amber-700 hover:bg-amber-50',
    icon: 'text-amber-200'
  },
  rose: {
    bg: 'bg-gradient-to-r from-rose-600 to-pink-600',
    text: 'text-white',
    dismiss: 'bg-white/20 hover:bg-white/30 text-white',
    link: 'bg-white text-rose-700 hover:bg-rose-50',
    icon: 'text-rose-200'
  },
  slate: {
    bg: 'bg-gradient-to-r from-slate-700 to-slate-800',
    text: 'text-white',
    dismiss: 'bg-white/10 hover:bg-white/20 text-white',
    link: 'bg-white text-slate-700 hover:bg-slate-50',
    icon: 'text-slate-400'
  },
  orange: {
    bg: 'bg-gradient-to-r from-orange-500 to-amber-600',
    text: 'text-white',
    dismiss: 'bg-white/20 hover:bg-white/30 text-white',
    link: 'bg-white text-orange-700 hover:bg-orange-50',
    icon: 'text-orange-200'
  }
};

export default function GlobalAnnouncementBanner() {
  const { user } = useAuth();
  const [banner, setBanner] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [verifyDismissed, setVerifyDismissed] = useState(false);

  useEffect(() => {
    // Fetch active system announcement banner
    fetch('/api/admin/banner')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setBanner(d); })
      .catch(() => {});
  }, []);

  const isUnverified = user && !user.isVerified && user.role !== 'admin';
  const showVerifyBanner = isUnverified && !verifyDismissed;
  const showAnnouncementBanner = banner?.enabled && !dismissed;

  if (!showVerifyBanner && !showAnnouncementBanner) return null;

  // Verification warning takes priority
  if (showVerifyBanner) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 animate-in slide-in-from-top duration-300">
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 px-4 py-2.5 flex items-center justify-between gap-4 shadow-lg shadow-amber-500/20">
          <div className="flex items-center gap-2.5 flex-1">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <ShieldAlert size={14} className="text-white" />
            </div>
            <p className="text-white text-sm font-semibold">
              ⚠️ Your email address is not yet verified. Please verify to unlock all features.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/otp-verification"
              className="px-4 py-1.5 rounded-lg bg-white text-amber-700 font-bold text-xs uppercase tracking-wider hover:bg-amber-50 transition-all flex items-center gap-1.5 shadow-sm"
            >
              Verify Now <ArrowRight size={12} />
            </Link>
            <button
              onClick={() => setVerifyDismissed(true)}
              className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // System Announcement Banner
  const scheme = colorSchemes[banner?.color] || colorSchemes.indigo;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-in slide-in-from-top duration-300">
      <div className={`${scheme.bg} px-4 py-2.5 flex items-center justify-between gap-4 shadow-lg`}>
        <div className="flex items-center gap-2.5 flex-1">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
            <Megaphone size={14} className="text-white" />
          </div>
          <p className={`${scheme.text} text-sm font-semibold leading-tight`}>
            {banner?.message || 'New announcement from PrepAI.'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {banner?.link && (
            <a
              href={banner.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`px-4 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm ${scheme.link}`}
            >
              Learn More <ArrowRight size={12} />
            </a>
          )}
          <button
            onClick={() => setDismissed(true)}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${scheme.dismiss}`}
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
