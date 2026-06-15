import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

interface Props {
  realBrand: string;
  sampleNumber: string;
  tttAverage: number;
  onSubmitEval: (score: number) => void;
}

export const BlindReveal: React.FC<Props> = ({ realBrand, sampleNumber, tttAverage, onSubmitEval }) => {
  const [score, setScore] = useState<number>(5);
  const [revealed, setRevealed] = useState(false);

  const handleSubmit = () => {
    onSubmitEval(score);
    setRevealed(true);
    
    if (score >= 7) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#10b981', '#3b82f6'] // cyan, emerald, blue
      });
    }
  };

  return (
    <div className="max-w-md mx-auto relative overflow-hidden bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl p-8">
      {/* Subtle sensory glow in the background */}
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-cyan-900/30 rounded-full blur-3xl pointer-events-none" />
      
      <AnimatePresence mode="wait">
        {!revealed ? (
          <motion.div 
            key="form"
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col relative z-10"
          >
            <div className="mb-8 text-center">
              <span className="inline-block px-3 py-1 bg-slate-900 border border-slate-700 rounded-full text-xs font-mono text-slate-400 mb-4">
                Blind Tasting
              </span>
              <h2 className="text-3xl font-extrabold text-slate-100">
                Sample <span className="text-cyan-400">{sampleNumber}</span>
              </h2>
              <p className="text-slate-400 mt-2 text-sm">
                Rate this sample on a 1-9 hedonic scale before the identity is revealed.
              </p>
            </div>
            
            <div className="space-y-6">
              <div className="flex flex-col items-center">
                <div className="text-6xl font-black text-cyan-400 mb-4 font-mono tracking-tighter">
                  {score}
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="9" 
                  step="0.1"
                  value={score} 
                  onChange={(e) => setScore(Number(e.target.value))} 
                  className="w-full accent-cyan-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
                />
                <div className="flex justify-between w-full mt-2 text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                  <span>Dislike</span>
                  <span>Neutral</span>
                  <span>Like</span>
                </div>
              </div>
              
              <button 
                onClick={handleSubmit}
                className="w-full py-4 mt-4 bg-slate-100 text-slate-900 hover:bg-white font-extrabold rounded-xl shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Submit &amp; Reveal
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="reveal"
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ staggerChildren: 0.15, duration: 0.4 }}
            className="flex flex-col items-center text-center relative z-10"
          >
            <motion.div 
              initial={{ opacity: 0, y: -20 }} 
              animate={{ opacity: 1, y: 0 }}
              className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full mb-6 font-mono"
            >
              IDENTITY REVEALED
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, scale: 0.8 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="text-4xl font-extrabold text-slate-100 mb-8"
            >
              {realBrand}
            </motion.h1>
            
            <div className="w-full grid grid-cols-2 gap-4">
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col"
              >
                <span className="text-[10px] text-slate-500 font-mono uppercase">Your Score</span>
                <span className="text-3xl font-black text-cyan-400 mt-1 font-mono">{score}</span>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col"
              >
                <span className="text-[10px] text-slate-500 font-mono uppercase">TTT Baseline</span>
                <span className="text-3xl font-black text-slate-300 mt-1 font-mono">{tttAverage}</span>
              </motion.div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-6"
            >
              <p className="text-xs text-slate-400">
                {Math.abs(score - tttAverage) < 1 
                  ? "Your rating aligns closely with the expected baseline." 
                  : "Interesting! Your perception differed from the historical baseline."}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
