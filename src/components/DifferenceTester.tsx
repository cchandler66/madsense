import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  batchCode: string;
  onComplete: (selectedOddSample: string, timeTakenMs: number) => void;
  onCancel?: () => void;
}

export const DifferenceTester: React.FC<Props> = ({ batchCode, onComplete, onCancel }) => {
  const [step, setStep] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const steps = ['Intro', 'Sample A', 'Sample B', 'Sample C', 'Selection'];

  const handleStart = () => {
    setStartTime(Date.now());
    setStep(1);
  };

  const handleSelect = (sample: string) => {
    const timeTaken = Date.now() - startTime;
    onComplete(sample, timeTaken);
  };

  return (
    <div className="max-w-xl mx-auto p-8 bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl text-center relative overflow-hidden">
      
      {/* Decorative background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-radial from-cyan-900/20 to-transparent pointer-events-none" />

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div 
            key="intro" 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex flex-col items-center gap-6 relative z-10"
          >
            <div className="p-4 bg-cyan-500/10 rounded-full border border-cyan-500/20 mb-2">
               <svg className="w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-100">Triangle Test</h2>
            <div className="inline-block px-3 py-1 bg-slate-900 rounded-full border border-slate-800 text-slate-300 font-mono text-sm">
              Batch: <span className="text-cyan-400">{batchCode}</span>
            </div>
            
            <p className="text-slate-400 max-w-sm mt-2">
              Two samples are identical. One is different. Evaluate left to right.
            </p>
            
            <div className="flex gap-3 w-full mt-4">
              {onCancel && (
                <button 
                  onClick={onCancel} 
                  className="flex-1 bg-slate-900 text-slate-300 px-6 py-4 rounded-xl font-bold border border-slate-800 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
              )}
              <button 
                onClick={handleStart} 
                className="flex-1 bg-cyan-600 text-white px-6 py-4 rounded-xl font-bold shadow-lg shadow-cyan-900/50 hover:bg-cyan-500 transition-colors"
              >
                Start Tasting
              </button>
            </div>
          </motion.div>
        )}

        {[1, 2, 3].includes(step) && (
          <motion.div 
            key={`sample-${step}`} 
            initial={{ opacity: 0, x: 50 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -50 }}
            className="flex flex-col items-center gap-6 relative z-10 py-4"
          >
            <div className="text-cyan-500 font-mono text-sm font-bold tracking-widest uppercase mb-2">
              Step {step} of 3
            </div>
            <h2 className="text-5xl font-extrabold text-slate-100 mb-2">Sample {steps[step].split(' ')[1]}</h2>
            <p className="text-slate-400 mb-8 border-t border-b border-slate-800/50 py-4">
              Cleanse your palate with water before proceeding.
            </p>
            <button 
              onClick={() => setStep(step + 1)} 
              className="w-full bg-slate-100 text-slate-900 px-6 py-4 rounded-xl font-extrabold hover:bg-white transition-colors"
            >
              Next Sample
            </button>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div 
            key="selection" 
            initial={{ opacity: 0, y: 50 }} 
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-8 relative z-10 py-4"
          >
            <h2 className="text-2xl font-bold text-slate-100">Which sample was the odd one out?</h2>
            
            <div className="flex justify-center gap-4 w-full">
              {['A', 'B', 'C'].map(char => (
                <motion.button
                  key={char} 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelect(char)}
                  className="flex-1 bg-slate-900 hover:bg-cyan-500/10 text-slate-300 hover:text-cyan-400 font-extrabold text-4xl py-12 rounded-2xl border-2 border-slate-800 hover:border-cyan-500/50 transition-colors shadow-xl"
                >
                  {char}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
