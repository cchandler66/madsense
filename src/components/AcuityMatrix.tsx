import React, { useMemo } from 'react';
import { PanelistAcuity, calculatePanelistAcuity, SpikeTestRecord } from '../lib/acuityStats';

interface Props {
  spikeRecords: SpikeTestRecord[];
  trackedCompounds: string[]; // e.g., ['Diacetyl', 'DMS', 'Acetaldehyde', 'Trans-2-Nonenal', 'Infection']
}

export const AcuityMatrix: React.FC<Props> = ({ spikeRecords, trackedCompounds }) => {
  const acuityData = useMemo(() => calculatePanelistAcuity(spikeRecords), [spikeRecords]);

  // Sort panelists by overall accuracy (highest to lowest)
  const sortedPanelists = [...acuityData].sort((a, b) => b.overallAccuracy - a.overallAccuracy);

  const getCellColor = (hits: number, tests: number) => {
    if (tests === 0) return 'bg-slate-900 text-slate-600'; // No data
    const rate = hits / tests;
    if (rate >= 0.8) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (rate >= 0.5) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
  };

  return (
    <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 shadow-2xl overflow-x-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-100">Panelist Validation Matrix</h2>
        <p className="text-sm text-slate-400">Empirical accuracy against known chemical spike tests.</p>
      </div>

      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr>
            <th className="p-3 border-b border-slate-800 text-xs font-mono text-slate-500 uppercase">Panelist</th>
            <th className="p-3 border-b border-slate-800 text-xs font-mono text-slate-500 uppercase text-center">Overall</th>
            {trackedCompounds.map(c => (
              <th key={c} className="p-3 border-b border-slate-800 text-xs font-mono text-slate-500 uppercase text-center">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedPanelists.map((panelist) => (
            <tr key={panelist.panelistId} className="border-b border-slate-800/50 hover:bg-slate-900/30 transition-colors">
              <td className="p-3 font-bold text-slate-300">{panelist.panelistId}</td>
              <td className="p-3 text-center">
                <span className="text-xs font-mono font-bold">{panelist.overallAccuracy.toFixed(1)}%</span>
                <div className="text-[9px] text-slate-500">n={panelist.totalTests}</div>
              </td>
              
              {trackedCompounds.map(compound => {
                const stats = panelist.sensitivityMap[compound] || { hits: 0, tests: 0, confusions: {} };
                
                // Find their most common wrong guess if they miss this compound often
                const topConfusion = Object.entries(stats.confusions)
                  .sort((a, b) => b[1] - a[1])[0];

                return (
                  <td key={compound} className="p-2">
                    <div className={`p-2 rounded-lg border text-center flex flex-col justify-center h-16 ${getCellColor(stats.hits, stats.tests)}`}>
                      {stats.tests === 0 ? (
                        <span className="text-xs">-</span>
                      ) : (
                        <>
                          <span className="text-sm font-bold font-mono">
                            {Math.round((stats.hits / stats.tests) * 100)}%
                          </span>
                          {topConfusion && (
                            <span className="text-[9px] leading-tight mt-1 opacity-80" title={`Often confused with ${topConfusion[0]}`}>
                              Confuses w/ {topConfusion[0]}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
