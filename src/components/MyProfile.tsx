import React, { useMemo } from 'react';
import { UserProfile, SensoryEvaluation, Batch } from '../types';
import { Award, Target, Brain, Beaker, CheckCircle, Crosshair } from 'lucide-react';

interface MyProfileProps {
  userEmail: string;
  userName: string;
  users: UserProfile[];
  evaluations: SensoryEvaluation[];
}

export const MyProfile: React.FC<MyProfileProps> = ({ userEmail, userName, users, evaluations }) => {
  const user = useMemo(() => users.find(u => u.email === userEmail), [users, userEmail]);

  const userEvals = useMemo(() => {
    return evaluations.filter(e => e.userEmail === userEmail);
  }, [evaluations, userEmail]);

  const profileStats = useMemo(() => {
    const totalEvals = userEvals.length;
    let trueToTargetCount = 0;
    
    // TTT detection rate
    const tttRatings = userEvals.filter(e => e.tttRating !== null);
    const defectsSpotted = tttRatings.filter(e => e.tttRating === 'no').length;
    const approvalRate = tttRatings.length > 0 
      ? Math.round((tttRatings.filter(e => e.tttRating === 'yes').length / tttRatings.length) * 100)
      : 0;
      
    // Average Hedonic Score given
    const hEvals = userEvals.filter(e => e.hedonicValue !== null && e.hedonicValue !== undefined);
    const avgHedonic = hEvals.length > 0
      ? (hEvals.reduce((sum, e) => sum + (e.hedonicValue || 0), 0) / hEvals.length).toFixed(1)
      : 'N/A';

    return {
      totalEvals,
      defectsSpotted,
      approvalRate,
      avgHedonic
    };
  }, [userEvals]);

  return (
    <div className="space-y-6" id="my_profile_view">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 bg-slate-900/60 rounded-3xl border border-slate-900 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center text-xl font-bold font-mono">
            {user?.avatarInitials || userName.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold font-sans tracking-tight text-white mb-1">
              Field Profile: {userName}
            </h1>
            <p className="text-slate-400 text-xs font-mono">{userEmail} • Level {user?.trainingLevel || 'Standard'} Taster</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { title: "Total Tests Analyzed", val: profileStats.totalEvals, icon: Beaker },
          { title: "Defects Spotted", val: profileStats.defectsSpotted, icon: Target },
          { title: "Approval Ratio", val: `${profileStats.approvalRate}%`, icon: CheckCircle },
          { title: "Avg Rating Given", val: profileStats.avgHedonic, icon: Brain }
        ].map((s, idx) => (
          <div key={idx} className="p-5 bg-slate-950 rounded-2xl border border-slate-900/60 flex flex-col justify-between items-start h-full">
            <div className="flex justify-between w-full items-start">
              <span className="text-slate-400 text-[10px] uppercase font-mono tracking-wider">{s.title}</span>
              <s.icon className="h-4 w-4 text-emerald-400/80" />
            </div>
            <span className="text-3xl font-extrabold text-slate-100 font-mono mt-3">{s.val}</span>
          </div>
        ))}
      </div>

      <div className="bg-slate-950 rounded-3xl border border-slate-900/60 p-6 overflow-hidden">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-4 font-mono uppercase tracking-wider">
          <Crosshair className="h-4 w-4 text-emerald-400" />
          Recent Sensory Log
        </h3>
        
        {userEvals.length > 0 ? (
          <div className="space-y-3">
            {userEvals.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10).map((e, idx) => (
              <div key={idx} className="flex flex-col md:flex-row items-start md:items-center justify-between p-3 bg-slate-900/40 border border-slate-900/60 rounded-xl gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-200">{e.brandName}</span>
                  <p className="text-[10px] text-slate-500 font-mono">Batch: {e.batchCode} • {e.date}</p>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase block">Hedonic</span>
                    <span className="text-sm font-bold font-mono text-amber-400">{e.hedonicValue}/9</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase block">TTT</span>
                    <span className={`text-sm font-bold font-mono ${e.tttRating === 'yes' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {e.tttRating === 'yes' ? 'Pass' : 'Defect'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 font-mono py-8 text-center border border-dashed border-slate-900 rounded-xl bg-slate-900/20">No evaluations submitted yet.</p>
        )}
      </div>
    </div>
  );
};
