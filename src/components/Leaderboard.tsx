import React, { useState, useMemo } from 'react';
import { Trophy, Calendar, Medal, Award, Flame, User, Rocket, Target, SortDesc } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { SensoryEvaluation, UserProfile, Brand } from '../types';
import { PanelistHeatmap } from './PanelistHeatmap';

interface LeaderboardProps {
  evaluations: SensoryEvaluation[];
  users: UserProfile[];
  brands: Brand[];
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ evaluations, users, brands }) => {
  const [timeframe, setTimeframe] = useState<'30d' | '90d' | 'all'>('all');
  const [sortBy, setSortBy] = useState<'count' | 'defects' | 'streak'>('count');
  
  const filteredEvaluations = useMemo(() => {
    const now = new Date().getTime();
    if (timeframe === '30d') {
      return evaluations.filter(e => now - new Date(e.date).getTime() <= 30 * 24 * 60 * 60 * 1000);
    }
    if (timeframe === '90d') {
      return evaluations.filter(e => now - new Date(e.date).getTime() <= 90 * 24 * 60 * 60 * 1000);
    }
    return evaluations;
  }, [evaluations, timeframe]);

  // Aggregate stats per user
  const leaderboardData = useMemo(() => {
    const userStats: Record<string, { email: string, name: string, count: number, defectsSpotted: number, streak: number, avgHedonic: number }> = {};
    
    users.forEach(u => {
      userStats[u.email] = {
        email: u.email,
        name: u.name,
        count: 0,
        defectsSpotted: 0,
        streak: Math.floor(Math.random() * 15), // Mock streak for gamification
        avgHedonic: 0
      };
    });

    const hedonicSums: Record<string, number> = {};

    filteredEvaluations.forEach(ev => {
      if (!userStats[ev.userEmail]) {
        userStats[ev.userEmail] = {
          email: ev.userEmail,
          name: ev.userName || ev.userEmail.split('@')[0],
          count: 0,
          defectsSpotted: 0,
          streak: 1,
          avgHedonic: 0
        };
      }
      userStats[ev.userEmail].count += 1;
      
      let hasDefect = false;
      if (ev.tttRating === 'no') hasDefect = true;
      if (ev.tttMetrics && Object.values(ev.tttMetrics).some(v => v === 'no')) hasDefect = true;
      if (hasDefect) userStats[ev.userEmail].defectsSpotted += 1;

      if (ev.hedonicValue) {
        hedonicSums[ev.userEmail] = (hedonicSums[ev.userEmail] || 0) + ev.hedonicValue;
      }
    });

    return Object.values(userStats)
      .map(u => {
        return {
          ...u,
          avgHedonic: u.count > 0 && hedonicSums[u.email] ? parseFloat((hedonicSums[u.email] / u.count).toFixed(2)) : 0
        };
      })
      .filter(u => u.count > 0)
      .sort((a, b) => {
        if (sortBy === 'count') return b.count - a.count;
        if (sortBy === 'defects') return b.defectsSpotted - a.defectsSpotted;
        if (sortBy === 'streak') return b.streak - a.streak;
        return 0;
      });
  }, [filteredEvaluations, users, sortBy]);

  const activityData = useMemo(() => {
    const grouped: Record<string, number> = {};
    const sorted = [...filteredEvaluations].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    sorted.forEach(e => {
      const d = e.date.substring(5); // MM-DD
      grouped[d] = (grouped[d] || 0) + 1;
    });
    return Object.entries(grouped).map(([date, count]) => ({ date, count })).slice(-15);
  }, [filteredEvaluations]);

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div className="bg-slate-950 p-6 md:p-8 rounded-3xl border border-slate-900 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-100 flex items-center gap-3">
            <Trophy className="h-8 w-8 text-amber-400" />
            Panelist League
          </h2>
          <p className="text-slate-400 text-sm mt-2">Nerd heaven for sensory data. Track performance, reliability, and precision.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800 self-start md:self-auto">
            {[
              { id: 'count', label: 'Total' },
              { id: 'defects', label: 'Accuracy' },
              { id: 'streak', label: 'Streak' }
            ].map(s => (
              <button
                key={s.id}
                onClick={() => setSortBy(s.id as any)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono tracking-wider transition-colors flex items-center gap-1 ${
                  sortBy === s.id ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <SortDesc className="h-3 w-3" />
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800 self-start md:self-auto">
            {[
              { id: '30d', label: '30D' },
              { id: '90d', label: '90D' },
              { id: 'all', label: 'ALL' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTimeframe(t.id as any)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono tracking-wider transition-colors ${
                  timeframe === t.id ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {leaderboardData.length === 0 ? (
            <div className="p-8 border-2 border-dashed border-slate-800 rounded-3xl text-center text-slate-500 font-mono">
              [ NO DATA IN TIMEFRAME ]
            </div>
          ) : (
            leaderboardData.map((user, idx) => {
              const isTop3 = idx < 3;
              const maxVal = leaderboardData[0]?.[sortBy] || 1;
              const percent = Math.min(100, Math.round((user[sortBy] / maxVal) * 100));

              return (
                <div 
                  key={user.email} 
                  className={`relative overflow-hidden p-4 sm:p-6 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    idx === 0 ? 'bg-gradient-to-r from-amber-500/10 to-transparent border-amber-500/30' : 
                    idx === 1 ? 'bg-gradient-to-r from-slate-300/10 to-transparent border-slate-300/30' :
                    idx === 2 ? 'bg-gradient-to-r from-amber-800/10 to-transparent border-amber-700/30' :
                    'bg-slate-950 border-slate-900 hover:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto relative z-10">
                    <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-black text-sm border-2 ${
                      idx === 0 ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)]' :
                      idx === 1 ? 'bg-slate-300 text-slate-900 border-white shadow-[0_0_15px_rgba(203,213,225,0.4)]' :
                      idx === 2 ? 'bg-amber-700 text-slate-100 border-amber-500 shadow-[0_0_15px_rgba(180,83,9,0.5)]' :
                      'bg-slate-900 text-slate-500 border-slate-800'
                    }`}>
                      #{idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-base font-bold truncate ${isTop3 ? 'text-slate-100' : 'text-slate-300'}`}>
                        {user.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 opacity-90">
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 bg-slate-900/50 px-2 py-0.5 rounded-full">
                          <Target className="h-3 w-3 text-cyan-400" />
                          {user.count} Evals
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 bg-slate-900/50 px-2 py-0.5 rounded-full">
                          <Rocket className="h-3 w-3 text-rose-400" />
                          {user.defectsSpotted} Flags
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 bg-slate-900/50 px-2 py-0.5 rounded-full">
                          <Flame className={`h-3 w-3 ${user.streak > 5 ? 'text-orange-500' : 'text-slate-500'}`} />
                          {user.streak} Streak
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full sm:w-48 xl:w-64 relative z-10 shrink-0">
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-[9px] text-slate-500 uppercase font-mono tracking-wider">
                        {sortBy === 'count' ? 'Engagement' : sortBy === 'defects' ? 'Precision' : 'Consistency'}
                      </span>
                      <span className={`text-xl font-black font-mono leading-none ${idx === 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                        {user[sortBy]}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-slate-300' : idx === 2 ? 'bg-amber-600' : 'bg-emerald-500'
                        }`} 
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Global Stats column */}
        <div className="space-y-6">
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-900 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5">
               <Trophy className="w-32 h-32 text-emerald-500" />
             </div>
             <h3 className="text-sm font-bold text-slate-200 mb-6 flex items-center gap-2">
               <Award className="w-4 h-4 text-emerald-400" />
               Global Metrics
             </h3>

             <div className="grid grid-cols-2 gap-4">
               <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800 text-center">
                 <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-1 mt-1">Tests Evaluated</p>
                 <p className="text-3xl font-black font-mono text-slate-200">{filteredEvaluations.length}</p>
               </div>
               <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800 text-center">
                 <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-1 mt-1">Active Panelists</p>
                 <p className="text-3xl font-black font-mono text-cyan-400">{leaderboardData.length}</p>
               </div>
             </div>

             <div className="mt-6">
               <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest mb-3">Panel Pulse</p>
               <div className="h-32 w-full">
                  {activityData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={activityData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <XAxis dataKey="date" stroke="#334155" fontSize={8} tickLine={false} axisLine={false} />
                        <RechartsTooltip 
                          cursor={{fill: '#0f172a'}}
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', fontSize: '10px' }}
                          formatter={(val: number) => [val, 'Tests']}
                        />
                        <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]}>
                          {
                            activityData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index === activityData.length - 1 ? '#34d399' : '#047857'} />
                            ))
                          }
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-600 font-mono">No data points</div>
                  )}
               </div>
             </div>
          </div>
        </div>
      </div>
      
      {/* Panelist Heatmap Grid */}
      <div className="mt-8">
        <PanelistHeatmap evaluations={filteredEvaluations} brands={brands} users={users} />
      </div>
    </div>
  );
};

