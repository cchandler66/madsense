import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, CheckCircle, RefreshCcw } from 'lucide-react';

interface Props {
  panelistName: string;
  correlationScore: number;
  onCalibrationComplete: () => void;
}

export const PanelistRetraining: React.FC<Props> = ({ panelistName, correlationScore, onCalibrationComplete }) => {
  const [currentSpike, setCurrentSpike] = useState(0);
  const [shake, setShake] = useState(false);

  const spikes = [
    { compound: "Diacetyl", options: ["Green Apple", "Butter/Movie Popcorn", "Cardboard"], answer: "Butter/Movie Popcorn" },
    { compound: "Acetaldehyde", options: ["Green Apple", "Skunky", "Metallic"], answer: "Green Apple" },
    { compound: "Trans-2-Nonenal", options: ["Banana", "Cloves", "Cardboard/Papery"], answer: "Cardboard/Papery" }
  ];

  const handleAnswer = (selected: string) => {
    if (selected === spikes[currentSpike].answer) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#10b981', '#fbbf24']
      });

      if (currentSpike === spikes.length - 1) {
        setTimeout(onCalibrationComplete, 1500);
      } else {
        setTimeout(() => setCurrentSpike(prev => prev + 1), 600);
      }
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  if (correlationScore >= 0.7) return null;

  return (
    <div className="bg-slate-900 border border-amber-900/50 rounded-2xl overflow-hidden shadow-2xl max-w-xl mx-auto my-8">
      <div className="bg-amber-500/10 p-6 border-b border-amber-900/50 flex items-start gap-4">
        <div className="p-3 bg-amber-500/20 rounded-full">
          <AlertTriangle className="h-6 w-6 text-amber-500" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Calibration Required
          </h3>
          <p className="text-slate-400 mt-1 text-sm">
            {panelistName}, your recent agreement score has dropped below the 0.7 threshold. Please complete the physical flavor spike validation to recalibrate.
          </p>
        </div>
      </div>
      
      <div className="p-8">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentSpike}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0, x: shake ? [-10, 10, -10, 10, 0] : 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: shake ? 0.4 : 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-bold text-slate-200 text-lg">
                Taste Spike Sample #{currentSpike + 1}
              </h4>
              <span className="bg-slate-800 text-slate-400 text-xs font-mono px-3 py-1 rounded-full">
                {currentSpike + 1} OF {spikes.length}
              </span>
            </div>
            
            <p className="text-slate-400 mb-6">What is the primary compound?</p>
            
            <div className="flex flex-col gap-3">
              {spikes[currentSpike].options.map(opt => (
                <button 
                  key={opt} 
                  onClick={() => handleAnswer(opt)}
                  className="bg-slate-950 border border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-500/10 text-slate-300 py-4 px-6 rounded-xl text-left font-medium transition-colors"
                >
                  {opt}
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
