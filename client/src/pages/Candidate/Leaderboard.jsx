import React from 'react';
import Header from '../../components/Header';
import { Trophy, Flame, Target, Star, ShieldAlert, Award, ArrowUp } from 'lucide-react';

const mockRankings = [
  { rank: 1, name: 'Alex Rivera', points: 2840, streak: 18, rating: 92, badge: 'Grandmaster' },
  { rank: 2, name: 'Siddharth Patel', points: 2610, streak: 12, rating: 89, badge: 'Master' },
  { rank: 3, name: 'Chloe Chen', points: 2450, streak: 9, rating: 87, badge: 'Master' },
  { rank: 4, name: 'Marcus Aurelius', points: 2200, streak: 15, rating: 85, badge: 'Expert' },
  { rank: 5, name: 'Jessica Vance', points: 2050, streak: 7, rating: 83, badge: 'Expert' },
  { rank: 6, name: 'Eitan Cohen', points: 1980, streak: 5, rating: 81, badge: 'Professional' },
  { rank: 7, name: 'Fatima Zahra', points: 1820, streak: 4, rating: 79, badge: 'Professional' }
];

export default function Leaderboard() {
  return (
    <div className="space-y-6">
      <Header title="Platform Leaderboard" />

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-premium rounded-3xl p-6 relative overflow-hidden flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
            <Trophy size={24} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Global High Score</span>
            <h4 className="font-extrabold text-xl text-slate-800 dark:text-white">Alex Rivera</h4>
            <span className="text-xs text-primary-500 font-bold uppercase">2,840 Total points</span>
          </div>
        </div>

        <div className="glass-premium rounded-3xl p-6 relative overflow-hidden flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
            <Flame size={24} fill="currentColor" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Longest Streak</span>
            <h4 className="font-extrabold text-xl text-slate-800 dark:text-white">Alex Rivera</h4>
            <span className="text-xs text-orange-500 font-bold uppercase">18 Active Days</span>
          </div>
        </div>

        <div className="glass-premium rounded-3xl p-6 relative overflow-hidden flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <Award size={24} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Next Streak Level</span>
            <h4 className="font-extrabold text-xl text-slate-800 dark:text-white">Master Badge</h4>
            <span className="text-xs text-indigo-500 font-bold uppercase">Unlock at 10 active days</span>
          </div>
        </div>
      </div>

      {/* Global Rankings Table */}
      <div className="glass-premium rounded-3xl p-6">
        <h3 className="font-bold text-base text-slate-800 dark:text-white mb-4">Rankings List</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400">
            <thead className="text-xs uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="pb-3 text-center w-16">Rank</th>
                <th className="pb-3">Candidate</th>
                <th className="pb-3">Badge Tier</th>
                <th className="pb-3">Points</th>
                <th className="pb-3">Streak</th>
                <th className="pb-3 text-right">Avg Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {mockRankings.map((user) => (
                <tr key={user.rank} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="py-4 text-center">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mx-auto ${
                      user.rank === 1
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/25 shadow-sm shadow-amber-500/10'
                        : user.rank === 2
                        ? 'bg-slate-400/10 text-slate-500 border border-slate-400/25'
                        : user.rank === 3
                        ? 'bg-amber-700/10 text-amber-800 border border-amber-700/25'
                        : 'text-slate-400 font-semibold'
                    }`}>
                      {user.rank}
                    </span>
                  </td>
                  <td className="py-4 font-bold text-slate-800 dark:text-white">
                    {user.name}
                  </td>
                  <td className="py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                      user.badge === 'Grandmaster'
                        ? 'bg-rose-500/10 border-rose-500/25 text-rose-500'
                        : user.badge === 'Master'
                        ? 'bg-indigo-500/10 border-indigo-500/25 text-indigo-500'
                        : 'bg-primary-500/10 border-primary-500/25 text-primary-500'
                    }`}>
                      {user.badge}
                    </span>
                  </td>
                  <td className="py-4 font-bold text-slate-700 dark:text-slate-300">
                    {user.points.toLocaleString()} pts
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-1 font-bold text-orange-500 text-sm">
                      <Flame size={14} fill="currentColor" />
                      <span>{user.streak} days</span>
                    </div>
                  </td>
                  <td className="py-4 text-right">
                    <span className="font-extrabold text-sm text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                      {user.rating}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
