import React, { useMemo } from 'react';
import { SensoryEvaluation, Brand, UserProfile } from '../types';

interface Props {
  evaluations: SensoryEvaluation[];
  brands: Brand[];
  users: UserProfile[];
}

export const PanelistHeatmap: React.FC<Props> = ({ evaluations, brands, users }) => {
  const heatmapData = useMemo(() => {
    const brandAverages: Record<string, { sum: number; count: number }> = {};
    
    // 1. Establish the baseline true average for each brand
    evaluations.forEach(ev => {
      if (!brandAverages[ev.brandId]) brandAverages[ev.brandId] = { sum: 0, count: 0 };
      brandAverages[ev.brandId].sum += ev.hedonicValue;
      brandAverages[ev.brandId].count += 1;
    });

    const matrix: Record<string, Record<string, number>> = {};
    
    // 2. Calculate individual panelist deviations
    users.forEach(user => {
      const email = user.email;
      matrix[email] = {};
      brands.forEach(brand => {
        const panelistEvals = evaluations.filter(e => e.userEmail === email && e.brandId === brand.id);
        if (panelistEvals.length === 0) return;
        
        const pSum = panelistEvals.reduce((acc, curr) => acc + curr.hedonicValue, 0);
        const pAvg = pSum / panelistEvals.length;
        const globalAvg = brandAverages[brand.id].sum / brandAverages[brand.id].count;
        
        matrix[email][brand.id] = pAvg - globalAvg; // Positive = Lenient, Negative = Severe
      });
    });

    return matrix;
  }, [evaluations, brands, users]);

  const getColor = (deviation: number) => {
    if (deviation > 1) return 'bg-emerald-500 text-white';
    if (deviation > 0.3) return 'bg-emerald-500/50 text-white';
    if (deviation < -1) return 'bg-rose-500 text-white';
    if (deviation < -0.3) return 'bg-rose-500/50 text-white';
    return 'bg-slate-800 text-slate-300';
  };

  return (
    <div className="bg-slate-950 p-6 rounded-3xl border border-slate-900 shadow-xl overflow-x-auto custom-scrollbar">
      <div className="mb-4">
        <h3 className="text-xl font-extrabold text-slate-100">Panelist Bias Heatmap</h3>
        <p className="text-sm text-slate-400">Deviation from global panel average across brands (Positive = Lenient, Negative = Severe).</p>
      </div>
      <table className="min-w-full text-center border-collapse">
        <thead>
          <tr>
            <th className="p-3 border-b border-slate-800 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Panelist</th>
            {brands.slice(0, 8).map(b => (
              <th key={b.id} className="p-3 border-b border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider max-w-[100px] truncate">
                {b.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {users.slice(0, 15).map(u => {
            const name = u.displayName || u.email.split('@')[0];
            return (
              <tr key={u.email} className="hover:bg-slate-900/50 transition-colors">
                <td className="p-3 text-left text-sm font-medium text-slate-300 truncate max-w-[150px]">{name}</td>
                {brands.slice(0, 8).map(b => (
                  <td key={b.id} className="p-1">
                    {heatmapData[u.email]?.[b.id] !== undefined ? (
                      <div className={`p-2 rounded flex items-center justify-center text-xs font-mono font-bold ${getColor(heatmapData[u.email][b.id])}`}>
                        {heatmapData[u.email][b.id] > 0 ? '+' : ''}{heatmapData[u.email][b.id].toFixed(1)}
                      </div>
                    ) : (
                      <div className="p-2 rounded bg-slate-900/50 text-slate-600 text-xs flex items-center justify-center">
                        -
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
