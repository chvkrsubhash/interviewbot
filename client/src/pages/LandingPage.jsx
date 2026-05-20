import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import {
  Video, Code2, ShieldAlert, Award, FileSpreadsheet,
  ArrowRight, Sparkles, Star, ChevronDown, Check, Mail, MessageSquare, MapPin
} from 'lucide-react';

const faqList = [
  { q: "How does the AI grade my answers?", a: "Our AI evaluates your verbal responses using semantic speech models. It analyses keyword accuracy (technical competency), vocabulary, speech fluency (communication score), and tone stability (confidence level)." },
  { q: "Is the cheat detection strictly monitored?", a: "Yes. PrepAI monitors window focus and viewport blur events during the live mock rounds. Switching browser tabs, minimizing the screen, or opening external consoles logs warnings immediately on the evaluation audit." },
  { q: "Can recruiters use this to pre-screen candidates?", a: "Absolutely. Recruiters can configure customized template interview nodes, generate invite-only invite tokens, and inspect detailed visual applicant scorecards side-by-side." }
];

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState(null);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMsg, setContactMsg] = useState('');

  const handleContactSubmit = (e) => {
    e.preventDefault();
    alert(`Success: Message dispatched! PrepAI support will email you shortly.`);
    setContactName('');
    setContactEmail('');
    setContactMsg('');
  };

  return (
    <div className="space-y-24 pb-20 select-none bg-cyber-grid">
      <Navbar />

      {/* Hero Section */}
      <section className="px-6 max-w-7xl mx-auto text-center space-y-8 relative pt-12">
        {/* Background glowing decorations */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full glow-spot-primary -z-10 animate-pulse-slow"></div>
        <div className="absolute top-20 left-1/3 w-96 h-96 rounded-full glow-spot-indigo -z-10 animate-float"></div>

        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-500 text-xs font-bold uppercase tracking-wider animate-float">
          <Sparkles size={14} className="animate-spin" /> Next-Generation AI Mock Assessments
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight text-slate-900 dark:text-white">
          Crack Your Dream Job with{' '}
          <span className="bg-gradient-to-r from-primary-500 via-indigo-500 to-primary-600 bg-clip-text text-transparent">
            AI Mock Interviews
          </span>
        </h1>

        <p className="text-base md:text-lg text-slate-400 dark:text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
          Simulate highly realistic tech and behavioral rounds with webcam feedback, real-time transcription, live Monaco editor algorithms, and deep analytics.
        </p>

        <div className="flex flex-wrap justify-center items-center gap-4">
          <Link
            to="/signup"
            className="px-8 py-4 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-2xl font-bold text-sm hover:shadow-lg hover:shadow-primary-500/25 transition-all active:scale-[0.99] flex items-center gap-2 btn-shiny"
          >
            Get Started Free <ArrowRight size={16} />
          </Link>
          <a
            href="#features"
            className="px-6 py-4 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors"
          >
            Learn More
          </a>
        </div>

        {/* Floating Mockup widget */}
        <div className="pt-12 max-w-4xl mx-auto animate-float">
          <div className="rounded-3xl border border-slate-200/50 dark:border-slate-800 bg-white/70 dark:bg-dark-900/60 p-4 shadow-2xl backdrop-blur-xl relative">
            <div className="w-full h-[320px] rounded-2xl bg-slate-900 dark:bg-black/85 flex flex-col justify-between p-6 relative overflow-hidden">
              <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                <span>Interviewer Session</span>
                <span className="text-primary-500 animate-ping">● speaking</span>
              </div>
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-primary-500/10">
                  <BrainCircuit size={42} className="animate-pulse" />
                </div>
                <div className="text-center space-y-1">
                  <h4 className="text-white font-bold">Interviewer AI</h4>
                  <p className="text-[10px] text-slate-400 font-semibold italic">"Tell me about a time you solved an architectural deadlock in production..."</p>
                </div>
              </div>
              <div className="w-full h-8 rounded bg-slate-800/40 border border-slate-700/30 flex items-center px-3 text-[10px] text-primary-400 font-mono italic">
                🎤 Listening: "We designed a lock timeout queue with fallback alerts..."
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Corporate Showcase */}
      <section className="px-6 max-w-7xl mx-auto space-y-8 text-center border-t border-slate-100 dark:border-slate-900 pt-16">
        <h4 className="text-xs uppercase font-extrabold tracking-widest text-slate-400 dark:text-slate-500">
          Tailored Rounds Matching Big Tech Workflows
        </h4>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all">
          <span className="font-extrabold text-lg text-slate-800 dark:text-white">GOOGLE</span>
          <span className="font-extrabold text-lg text-slate-800 dark:text-white">AMAZON</span>
          <span className="font-extrabold text-lg text-slate-800 dark:text-white">MICROSOFT</span>
          <span className="font-extrabold text-lg text-slate-800 dark:text-white">TCS</span>
          <span className="font-extrabold text-lg text-slate-800 dark:text-white">INFOSYS</span>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Unleash Advanced Assessment Tools
          </h2>
          <p className="text-sm text-slate-400 dark:text-slate-500 font-semibold max-w-md mx-auto">
            Everything you need from live code compile checks to speech articulation algorithms.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-premium-interactive rounded-3xl p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-500/10 text-primary-500 flex items-center justify-center">
              <Video size={24} />
            </div>
            <h4 className="font-bold text-lg text-slate-800 dark:text-white">Live Camera Simulation</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed font-semibold">
              Evaluate visual response signals, webcam streams, and voice waveforms under high-fidelity scenarios.
            </p>
          </div>

          <div className="glass-premium-interactive rounded-3xl p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Code2 size={24} />
            </div>
            <h4 className="font-bold text-lg text-slate-800 dark:text-white">Monaco Code Runner</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed font-semibold">
              Live Monaco algorithm console with custom test suites supporting multi-language syntax configurations.
            </p>
          </div>

          <div className="glass-premium-interactive rounded-3xl p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <ShieldAlert size={24} />
            </div>
            <h4 className="font-bold text-lg text-slate-800 dark:text-white">Tab Defocus Security</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed font-semibold">
              Tracks cheating patterns, tab shifts, and viewport actions to guarantee test security indices.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Matrix */}
      <section id="pricing" className="px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Transparent Pricing tiers
          </h2>
          <p className="text-sm text-slate-400 dark:text-slate-500 font-semibold max-w-md mx-auto">
            Choose the subscription tier customized for your evaluation objectives.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Candidate Tier */}
          <div className="glass-premium-interactive rounded-3xl p-8 flex flex-col justify-between border-2 border-transparent">
            <div className="space-y-6">
              <div>
                <span className="text-[10px] uppercase font-bold text-primary-500 tracking-wider">Candidate Plan</span>
                <h4 className="font-extrabold text-2xl text-slate-800 dark:text-white mt-1">Free Trial</h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1">Perfect for individual developers preparing for mocks.</p>
              </div>

              <div className="flex items-baseline gap-1 text-slate-800 dark:text-white">
                <span className="font-extrabold text-4xl">$0</span>
                <span className="text-xs font-semibold text-slate-400 uppercase">/ Month</span>
              </div>

              <ul className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-6 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-500" /> Unlimited Tech Mocks</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-500" /> Monaco Editor Algorithms</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-500" /> Basic Streak analytics</li>
              </ul>
            </div>

            <Link
              to="/signup"
              className="mt-8 w-full py-3.5 bg-slate-800 dark:bg-white text-white dark:text-slate-900 text-center rounded-2xl font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all active:scale-[0.99] btn-shiny"
            >
              Get Started
            </Link>
          </div>

          {/* Enterprise Recruiter Tier */}
          <div className="glass-premium-interactive rounded-3xl p-8 flex flex-col justify-between border-2 border-primary-500/50 shadow-xl shadow-primary-500/5 relative overflow-hidden">
            <div className="absolute top-4 right-4 px-2.5 py-0.5 rounded-lg bg-primary-500 text-white font-extrabold text-[9px] uppercase tracking-wider">POPULAR</div>
            
            <div className="space-y-6">
              <div>
                <span className="text-[10px] uppercase font-bold text-primary-500 tracking-wider">Recruiter Enterprise</span>
                <h4 className="font-extrabold text-2xl text-slate-800 dark:text-white mt-1">Agency Hub</h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1">Designed for HR specialists and recruiters pre-screening candidates.</p>
              </div>

              <div className="flex items-baseline gap-1 text-slate-800 dark:text-white">
                <span className="font-extrabold text-4xl">$149</span>
                <span className="text-xs font-semibold text-slate-400 uppercase">/ Month</span>
              </div>

              <ul className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-6 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-500" /> Invite-only Link generation</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-500" /> Detailed Candidate PDF Exports</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-500" /> Custom Interview Templates config</li>
              </ul>
            </div>

            <Link
              to="/signup"
              className="mt-8 w-full py-3.5 bg-primary-500 text-white text-center rounded-2xl font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all shadow-md shadow-primary-500/20 active:scale-[0.99] btn-shiny"
            >
              Unlock Enterprise
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="px-6 max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqList.map((faq, index) => (
            <div key={index} className="glass-premium-interactive rounded-2xl overflow-hidden">
              <button
                onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                className="w-full px-6 py-5 flex justify-between items-center text-left"
              >
                <span className="font-bold text-sm text-slate-800 dark:text-white">{faq.q}</span>
                <ChevronDown
                  size={16}
                  className={`text-slate-400 transition-transform ${activeFaq === index ? 'rotate-180' : ''}`}
                />
              </button>
              
              {activeFaq === index && (
                <div className="px-6 pb-5 text-xs text-slate-400 dark:text-slate-500 font-semibold leading-relaxed border-t border-slate-100/50 dark:border-slate-800/40 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="px-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-slate-100 dark:border-slate-900 pt-16">
        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Get in Touch</h2>
            <p className="text-sm text-slate-400 dark:text-slate-500 font-semibold max-w-sm leading-relaxed">
              Have customized screening specifications or questions? Submit a message and our support engineers will align with you.
            </p>
          </div>

          <div className="space-y-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-primary-500" />
              <span>contact@prepai.com</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-indigo-500" />
              <span>+1 (555) 284-9000</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-orange-500" />
              <span>San Francisco, CA</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleContactSubmit} className="glass-premium rounded-3xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Name</label>
              <input
                type="text"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Name"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 dark:bg-dark-900/50 dark:border-slate-800/80 rounded-2xl text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500 font-semibold text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Email</label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 dark:bg-dark-900/50 dark:border-slate-800/80 rounded-2xl text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500 font-semibold text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Message</label>
            <textarea
              required
              rows={4}
              value={contactMsg}
              onChange={(e) => setContactMsg(e.target.value)}
              placeholder="Tell us what you need..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 dark:bg-dark-900/50 dark:border-slate-800/80 rounded-2xl text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500 font-semibold text-xs resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.99] btn-shiny"
          >
            Submit message
          </button>
        </form>
      </section>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-900 pt-8 max-w-7xl mx-auto px-6 font-semibold">
        © 2026 PrepAI Inc. All rights reserved. Premium mock environment for recruiters and applicants.
      </footer>
    </div>
  );
}

// Fallback matching BrainCircuit
function BrainCircuit({ className, size }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size || 24}
      height={size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2v8" />
      <path d="M12 14v8" />
      <path d="M22 12H14" />
      <path d="M10 12H2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M16.5 7.5l-4.5 4.5" />
      <path d="M7.5 16.5l4.5-4.5" />
      <path d="M7.5 7.5l4.5 4.5" />
      <path d="M16.5 16.5l-4.5-4.5" />
    </svg>
  );
}
