import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
// import { assessDifferenceTest } from '../utils/sensoryStats';

interface Props {
  correctSample: 'A' | 'B' | 'C';
  nTrials: number;
}

export const DifferenceTestForm: React.FC<Props> = ({ correctSample, nTrials }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [pValue, setPValue] = useState<number | null>(null);

  const handleSelection = (choice: 'A' | 'B' | 'C') => {
    setSelected(choice);
    // Mocking the external assessDifferenceTest import for structural purpose
    const isCorrect = choice === correctSample;
    // In production: setPValue(assessDifferenceTest('triangle', nTrials, isCorrect ? 1 : 0).pValue)
    setPValue(isCorrect ? 0.04 : 0.45); // Mocked response
  };

  return (
    <div className="bg-slate-950 p-8 rounded-3xl border border-slate-900 shadow-2xl flex flex-col items-center gap-8 text-center max-w-2xl mx-auto my-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-900/10 rounded-full blur-3xl" />
      
      <div className="relative z-10 w-full">
        <h2 className="text-3xl font-extrabold text-slate-100 mb-2">Identify the Odd Sample</h2>
        <p className="text-slate-400 text-sm">Two of these samples are identical. Select the one that is different.</p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8 w-full">
          {['A', 'B', 'C'].map((sample) => (
            <motion.button
              key={sample}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelection(sample as 'A' | 'B' | 'C')}
              className={`p-12 rounded-2xl text-4xl font-black shadow-lg transition-colors flex-1 ${
                selected === sample 
                  ? 'bg-cyan-500 text-slate-950 shadow-cyan-500/20 shadow-xl border-2 border-cyan-400' 
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border-2 border-slate-800'
              }`}
            >
              {sample}
            </motion.button>
          ))}
        </div>
        
        <AnimatePresence>
          {pValue !== null && (
            <motion.div 
              initial={{ opacity: 0, y: 10, height: 0 }} 
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              className="mt-8 overflow-hidden w-full"
            >
              <div className={`p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border ${
                pValue < 0.05 
                  ? 'bg-emerald-500/10 border-emerald-500/30' 
                  : 'bg-rose-500/10 border-rose-500/30'
              }`}>
                <div className="text-left">
                  <p className={`font-mono text-xl font-bold ${pValue < 0.05 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {pValue < 0.05 ? 'Significant Difference' : 'No Difference'}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">
                    Based on binomial probability testing
                  </p>
                </div>
                <div className="bg-slate-950 px-4 py-3 rounded-xl border border-slate-800 flex flex-col items-end">
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">P-Value</span>
                  <span className={`text-2xl font-mono font-black ${pValue < 0.05 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {pValue.toFixed(3)}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
