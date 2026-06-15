/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, 
  Wifi, 
  WifiOff, 
  Smartphone, 
  Flame, 
  Dribbble, 
  Sparkles,
  Info,
  HelpCircle,
  FileText,
  Compass
} from 'lucide-react';
import { Brand, SensoryPanel, SensoryEvaluation, OffFlavorEvaluation, OffFlavorItem } from '../types';
import { FlavorWheelReference } from './FlavorWheelReference';

interface ActivePanelProps {
  activePanels: SensoryPanel[];
  brands: Brand[];
  evaluations: SensoryEvaluation[];
  userEmail: string;
  userName: string;
  offFlavors: OffFlavorItem[];
  onLogEvaluation: (evalItem: SensoryEvaluation) => void;
  onNavigateToTab: (tab: string) => void;
}

export const ActivePanel: React.FC<ActivePanelProps> = ({
  activePanels,
  brands,
  evaluations,
  userEmail,
  userName,
  offFlavors,
  onLogEvaluation,
  onNavigateToTab
}) => {
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
  const [selectedBrandIdx, setSelectedBrandIdx] = useState<number>(0);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  // Current states/form inputs
  const [tttMetrics, setTttMetrics] = useState<Record<string, 'yes'|'no'>>({});
  const [tttComments, setTttComments] = useState<string>('');
  const [hedonicValue, setHedonicValue] = useState<number | undefined>(undefined);
  const [hedonicComments, setHedonicComments] = useState<string>('');

  // Descriptive state (DOE Attributes / 0-7 Scale)
  const [doeAttributes, setDoeAttributes] = useState<Record<string, number>>({});

  // Off Flavor Selected States
  const [offFlavorSelections, setOffFlavorSelections] = useState<Record<string, { detected: boolean; severity: 0 | 1 | 2 | 3; notes: string }>>({});
  const [activeOffFlavorInfoIdx, setActiveOffFlavorInfoIdx] = useState<number | null>(null);

  // Haptic state feedback simulation
  const [hapticTrigger, setHapticTrigger] = useState<boolean>(false);

  const activePanel = activePanels.find(p => p.id === selectedPanelId);
  const isTraining = (activePanel?.rubrics || []).includes('training');

  // For training panels, generate dummy station IDs
  const trainingBrandIds = isTraining 
    ? Array.from({ length: activePanel?.trainingStations || 4 }).map((_, i) => `station-${i+1}`)
    : [];
  
  const effectiveBrandIds = isTraining ? trainingBrandIds : (activePanel?.activeBrands || []);
  const activeBrandId = effectiveBrandIds[selectedBrandIdx];

  const activeBrand = isTraining ? {
    id: activeBrandId,
    name: `Training Station ${selectedBrandIdx + 1}`,
    type: 'training',
    created: activePanel?.date || '',
    brandCode: `TRN${selectedBrandIdx + 1}`,
    hasBaseline: true,
    visual: 'Evaluate sample for specified off-flavor.',
    aroma: 'Detect target chemistry.',
    taste: 'Detect target chemistry (if applicable).',
    mouthfeel: 'N/A',
    overallDescription: `Training Session for ${activePanel?.trainingSpikedAttribute || 'unknown compound'}. Some stations are blindly spiked, while others are clean controls.`
  } : brands.find(b => b.id === activeBrandId);

  const getAttributesForType = (type: string | undefined): string[] => {
    switch (type) {
      case 'beer':
        return ['Foam Quantity', 'Hop Aroma (Citrus/Pine)', 'Hop Aroma (Floral/Earthy)', 'Malt Aroma (Bready)', 'Esters (Fruity)', 'Malt Sweetness', 'Bitterness', 'Carbonation', 'Body Weight', 'Astringency'];
      case 'cider':
        return ['Apple Aroma', 'Floral Aroma', 'Sulphur', 'Tartness/Acidity', 'Sweetness', 'Astringency', 'Carbonation', 'Body Weight'];
      case 'pro_seltzer':
        return ['Flavor Intensity', 'Fruity Extract', 'Sweetness', 'Acidity', 'Carbonation', 'Dry Finish'];
      default:
        return ['Overall Intensity', 'Aroma Intensity', 'Sweetness', 'Acidity', 'Carbonation', 'Body'];
    }
  };

  React.useEffect(() => {
    if (activeBrand) {
      const attrs = getAttributesForType(activeBrand.type);
      const initial: Record<string, number> = {};
      attrs.forEach(a => initial[a] = 4); // 4 is standard target baseline
      setDoeAttributes(initial);
      setTttMetrics({});
    }
  }, [activeBrand]);

  // Listen to offline state changes
  React.useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const triggerHapticFeedback = () => {
    // Standard vibration API if accessed in native Android wrapper
    if (window.navigator.vibrate) {
      window.navigator.vibrate(35);
    }
    setHapticTrigger(true);
    setTimeout(() => setHapticTrigger(false), 200);
  };

  const hedonicLabels: Record<number, string> = {
    9: 'Like Extremely',
    8: 'Like Very Much',
    7: 'Like Moderately',
    6: 'Like Slightly',
    5: 'Neither Like Nor Dislike',
    4: 'Dislike Slightly',
    3: 'Dislike Moderately',
    2: 'Dislike Very Much',
    1: 'Dislike Extremely'
  };

  const handleLoggedEvaluation = () => {
    if (!activePanel || !activeBrand) return;
    
    // Valiation: If any TTT metric is 'no', comments are required
    const hasDefect = Object.values(tttMetrics).some(val => val === 'no');
    if (hasDefect && !tttComments.trim()) {
      alert("You have marked a target as defective. Please provide comments explaining the defect before submitting.");
      return;
    }

    // Construct off flavors array
    const offFlavorsToSave: OffFlavorEvaluation[] = offFlavors.map(of => {
      const state = offFlavorSelections[of.name] || { detected: false, severity: 0, notes: '' };
      return {
        name: of.name,
        detected: state.detected,
        severity: state.severity,
        notes: state.notes
      };
    });

    const newEval: SensoryEvaluation = {
      id: `eval-${Date.now()}`,
      testId: `test-${activePanel.id}`,
      panelName: activePanel.name,
      brandId: activeBrand.id,
      brandName: activeBrand.name,
      batchCode: new Date().getFullYear() + '0527', // Dynamic mock batch code matching current year
      flavorMap: activeBrand.type,
      userEmail,
      userName,
      date: new Date().toLocaleDateString('en-US'),
      tttMetrics: {
        visual: tttMetrics.visual || 'yes',
        aroma: tttMetrics.aroma || 'yes',
        taste: tttMetrics.taste || 'yes',
        mouthfeel: tttMetrics.mouthfeel || 'yes',
        overall: tttMetrics.overall || 'yes',
      },
      tttRating: hasDefect ? 'no' : 'yes', // backward compatibility mapping
      tttComments: tttComments || undefined,
      hedonicValue,
      hedonicComments: hedonicComments || undefined,
      doeAttributes: (activePanel.rubrics || []).includes('descriptive') ? doeAttributes : undefined,
      offFlavors: offFlavorsToSave
    };

    onLogEvaluation(newEval);
    triggerHapticFeedback();
    alert(`Sensory report saved securely. ${isOffline ? 'Saved locally [Offline Sync Engaged]' : 'Uploaded to Active Panel'}`);

    if (selectedBrandIdx < (activePanel.activeBrands || []).length - 1) {
      setSelectedBrandIdx(prev => prev + 1);
      // Clean form state for next brand
      setTttMetrics({});
      setHedonicValue(undefined);
      setTttComments('');
      setHedonicComments('');
      setOffFlavorSelections({});
    } else {
      // Completed last assigned brand
      alert('Congratulations! All sensory assignments completed for this daily panel release cycle.');
      onNavigateToTab('dashboard');
    }
  };

  const handleSeverityChange = (offFlavorName: string, level: 0 | 1 | 2 | 3) => {
    triggerHapticFeedback();
    setOffFlavorSelections(prev => {
      const current = prev[offFlavorName] || { detected: false, severity: 0, notes: '' };
      return {
        ...prev,
        [offFlavorName]: {
          ...current,
          detected: level > 0,
          severity: level
        }
      };
    });
  };

  if (activePanels.length === 0) {
    return (
      <div className="bg-slate-950 p-12 rounded-3xl border border-slate-900 flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
        <Smartphone className="h-12 w-12 text-slate-700" />
        <h3 className="text-lg font-bold text-slate-300">No active sensible panel releases pending</h3>
        <p className="text-slate-500 text-sm max-w-sm">Admins can create draft sensory panels in the panel configurations screen for tasters to evaluate.</p>
        <button 
          onClick={() => onNavigateToTab('config')}
          className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-100 rounded-full font-bold font-sans text-xs transition-colors"
        >
          Check Manager Console
        </button>
      </div>
    );
  }

  if (!selectedPanelId) {
    // Determine completed panels recently evaluated by the user
    const userPanelIds = new Set(
      evaluations
        .filter(e => e.userEmail === userEmail)
        .map(e => e.testId.replace('test-', ''))
    );

    return (
      <div className="space-y-6 animate-fade-in" id="field_active_panel">
        <div className="bg-slate-950 p-8 rounded-3xl border border-slate-900 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 rounded-full font-mono px-3 py-1 uppercase tracking-widest leading-none">
              Welcome Panelist
            </span>
            <h2 className="text-3xl font-extrabold text-slate-100 mt-4 flex items-center gap-3">
              Good Tasting, {userName.split(' ')[0]}
            </h2>
            <p className="text-slate-400 text-sm mt-2">Select a panel below to begin your sensory release evaluation.</p>
          </div>
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-center w-full md:w-auto">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-mono mb-1">Lifetime Evals</p>
            <p className="text-3xl font-bold font-mono text-cyan-400">{evaluations.filter(e => e.userEmail === userEmail).length}</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-300 mb-4 px-2 tracking-wide">Available Panels For Evaluation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activePanels.map((p) => {
              const panelRef = p.id;
              const hasTaken = userPanelIds.has(panelRef);
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPanelId(p.id);
                    setSelectedBrandIdx(0);
                  }}
                  className={`p-6 rounded-3xl text-left border transition-all flex flex-col h-full group ${
                    hasTaken 
                      ? 'bg-slate-900/50 border-slate-800 opacity-60 hover:opacity-100' 
                      : 'bg-slate-950 border-slate-800 hover:bg-slate-900 hover:border-cyan-500/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-lg font-bold text-slate-100 font-sans leading-tight group-hover:text-cyan-400 transition-colors">
                      {p.name}
                    </h4>
                    {hasTaken && <Check className="h-5 w-5 text-emerald-500 shrink-0" />}
                  </div>
                  <div className="mt-auto space-y-2">
                    <p className="text-xs text-slate-500 font-mono flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5" />
                      {(p.activeBrands || []).length} Samples
                    </p>
                    <p className="text-xs text-slate-500 font-mono flex items-center gap-2">
                      <Compass className="h-3.5 w-3.5" />
                      {(p.rubrics || []).length} Methods
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // A panel is active, ensure it exists (edge case)
  if (!activePanel) {
    setSelectedPanelId(null);
    return null;
  }

  return (
    <div className="space-y-6" id="field_active_panel">
      {/* Offline Alert Sticky */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20 font-mono text-xs"
          >
            <WifiOff className="h-4 w-4 shrink-0" />
            <span>Offline Sync Mode Engaged. Data will replicate automatically on connection restoral.</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3 mb-2">
        <button 
          onClick={() => setSelectedPanelId(null)} 
          className="text-xs font-bold text-slate-500 hover:text-cyan-400 uppercase tracking-widest font-mono flex items-center gap-1"
        >
          &larr; Back to Panels
        </button>
      </div>

      {/* Taster Setup & active brand indicator */}
      <div className="bg-slate-950 p-6 rounded-3xl border border-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 rounded-full font-mono px-2.5 py-0.5 uppercase tracking-widest leading-none">
            Selected Panel
          </span>
          <h2 className="text-xl font-extrabold text-slate-100 mt-2 flex items-center gap-2">
            {activePanel.name}
          </h2>
          <p className="text-slate-400 text-xs mt-1">Evaluating as {userName}</p>
        </div>

        {/* Panel Selection dropdown removed, using landing screen now */}
      </div>

      {/* Brand evaluation progress tracker */}
      <div className="flex gap-2 items-center overflow-x-auto pb-1 pr-2 custom-scrollbar">
        {effectiveBrandIds.map((bId, idx) => {
          const br = isTraining ? activeBrand : brands.find(brand => brand.id === bId);
          const name = isTraining ? `Station ${idx + 1}` : br?.name;
          const isCurrent = idx === selectedBrandIdx;
          const isDone = idx < selectedBrandIdx;
          return (
            <button
              key={bId}
              onClick={() => {
                triggerHapticFeedback();
                setSelectedBrandIdx(idx);
              }}
              className={`px-4 py-3 rounded-full text-xs font-sans shrink-0 flex items-center gap-1.5 transition-all text-left border ${
                isCurrent 
                  ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 font-bold shadow-md' 
                  : isDone
                  ? 'bg-slate-900/60 border-slate-800/40 text-slate-500 line-through'
                  : 'bg-slate-900/20 border-slate-900 text-slate-400 hover:border-slate-800'
              }`}
              id={`evaluation_progress_btn_${idx}`}
            >
              {isDone && <Check className="h-3 w-3 text-cyan-500" />}
              <span>{name}</span>
            </button>
          );
        })}
      </div>

      {/* Brand Baseline specs preview */}
      {activeBrand && (
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-900/60 space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-900/50">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Product Release Target Baseline Specifications</span>
            <span className="text-[10px] font-mono text-cyan-400 uppercase">{activeBrand.type} description</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-sans">
            <div>
              <p className="text-slate-500 font-mono">Visual Target:</p>
              <p className="text-slate-300 font-medium mt-0.5 italic">{activeBrand.visual || 'No specs set'}</p>
            </div>
            <div>
              <p className="text-slate-500 font-mono">Aroma Target:</p>
              <p className="text-slate-300 font-medium mt-0.5 italic">{activeBrand.aroma || 'No specs set'}</p>
            </div>
            <div>
              <p className="text-slate-500 font-mono">Taste Target:</p>
              <p className="text-slate-300 font-medium mt-0.5 italic">{activeBrand.taste || 'No specs set'}</p>
            </div>
            <div>
              <p className="text-slate-500 font-mono">Mouthfeel Target:</p>
              <p className="text-slate-300 font-medium mt-0.5 italic">{activeBrand.mouthfeel || 'No specs set'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Rubrics Entry Layout */}
      {activeBrand && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rubrics Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* TTT Section */}
            {(activePanel.rubrics || []).includes('tt') && (
              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-900 shadow-xl space-y-4" id="ttt_rubric_card">
                <h3 className="text-md font-bold text-slate-100 flex items-center justify-between">
                  <span>1. Quality Release (True to Target / TTT)</span>
                  <span className="text-[10px] text-emerald-400 font-mono font-medium tracking-widest">TRUE TO SPEC</span>
                </h3>
                <p className="text-slate-400 text-xs">Visually and organoleptically, does this packaging batch match brand baseline standards?</p>

                <div className="space-y-2 pt-2">
                  {['visual', 'aroma', 'taste', 'mouthfeel', 'overall'].map((dim) => {
                    const status = tttMetrics[dim];
                    const label = dim === 'visual' ? 'Visual' : dim === 'aroma' ? 'Aroma' : dim === 'taste' ? 'Flavor/Taste' : dim === 'mouthfeel' ? 'Mouthfeel' : 'Overall Match';
                    const targetText = dim === 'overall' ? 'Does this accurately represent the brand?' : (activeBrand as any)?.[dim] || 'Standard target not set';
                    
                    return (
                      <div key={dim} className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/50 border border-slate-800 rounded-2xl p-3 gap-3">
                        <div className="flex-1">
                          <span className="text-xs font-bold text-slate-200 block">{label}</span>
                          <span className="text-[10px] text-slate-400 line-clamp-1 italic">{targetText}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              triggerHapticFeedback();
                              setTttMetrics(p => ({ ...p, [dim]: 'yes' }));
                            }}
                            className={`px-4 py-2 flex items-center gap-1.5 rounded-xl font-bold font-mono text-[10px] tracking-wider uppercase transition-all ${
                              status === 'yes'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-md'
                                : 'bg-slate-900 text-slate-500 border border-slate-800 hover:border-slate-700 hover:text-slate-300'
                            }`}
                          >
                            Pass
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              triggerHapticFeedback();
                              setTttMetrics(p => ({ ...p, [dim]: 'no' }));
                            }}
                            className={`px-4 py-2 flex items-center gap-1.5 rounded-xl font-bold font-mono text-[10px] tracking-wider uppercase transition-all ${
                              status === 'no'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50 shadow-md'
                                : 'bg-slate-900 text-slate-500 border border-slate-800 hover:border-slate-700 hover:text-slate-300'
                            }`}
                          >
                            Defect
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-1 mt-4">
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Aroma/Taste Defect Details (Optional)</label>
                  <textarea
                    rows={2}
                    value={tttComments}
                    onChange={(e) => setTttComments(e.target.value)}
                    placeholder="Enter visual clarity remarks, carbonation issues or specific out-of-spec observations..."
                    className="w-full bg-slate-900 text-slate-200 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 outline-none text-xs transition-colors placeholder:text-slate-600"
                    id="ttt_comments_textarea"
                  />
                </div>
              </div>
            )}

            {/* Hedonic Section */}
            {(activePanel.rubrics || []).includes('hedonic') && (
              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-900 shadow-xl space-y-4" id="hedonic_rubric_card">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border-b border-slate-900/50 pb-3">
                  <h3 className="text-md font-bold text-slate-100">2. Hedonic Value Rating</h3>
                  {hedonicValue && (
                    <span className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full tracking-widest uppercase shadow-md ${
                      hedonicValue <= 3 
                        ? 'bg-rose-950 border border-rose-500/30 text-rose-400'
                        : hedonicValue <= 6
                          ? 'bg-amber-950 border border-amber-500/30 text-amber-400'
                          : 'bg-emerald-950 border border-emerald-500/30 text-emerald-400'
                    }`}>
                      {hedonicValue === 9 ? 'MIND BLOWN 🤯' : hedonicLabels[hedonicValue]}
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-xs">Based solely on your personal preference, how much do you like this sample?</p>

                {/* Highly Tactical Click Buttons with Color Grading */}
                <div className="grid grid-cols-9 gap-1.5 pt-2 select-none relative">
                  {/* Subtle background gradient line connecting them */}
                  <div className="absolute top-1/2 left-0 w-full h-1 -translate-y-1/2 bg-gradient-to-r from-rose-500/20 via-amber-500/20 to-emerald-500/20 rounded-full z-0 pointer-events-none" />
                  
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((val) => {
                    const active = hedonicValue === val;
                    const getActiveTheme = () => {
                      if (!active) return 'bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-900 hover:border-slate-700 hover:text-slate-300';
                      if (val <= 3) return 'bg-rose-500 text-white border-rose-400 shadow-xl shadow-rose-500/20 scale-110 z-20';
                      if (val <= 6) return 'bg-amber-500 text-slate-950 border-amber-400 shadow-xl shadow-amber-500/20 scale-110 z-20';
                      if (val <= 8) return 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-xl shadow-emerald-500/20 scale-110 z-20';
                      return 'bg-emerald-400 text-slate-950 border-emerald-300 shadow-2xl shadow-emerald-400/40 scale-125 z-30 animate-bounce';
                    };
                    
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          triggerHapticFeedback();
                          setHedonicValue(val);
                        }}
                        className={`h-10 sm:h-12 rounded-full text-sm font-bold font-mono border transition-all z-10 flex items-center justify-center ${getActiveTheme()}`}
                        id={`hedonic_btn_${val}`}
                      >
                        {val === 9 && active ? '🤯' : val}
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-1">
                  <span>Dislike</span>
                  <span>Neutral</span>
                  <span>Like</span>
                </div>

                <div className="space-y-1 mt-4">
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Taster Remarks &amp; Preference details (Optional)</label>
                  <textarea
                    rows={2}
                    value={hedonicComments}
                    onChange={(e) => setHedonicComments(e.target.value)}
                    placeholder="Enter flavor notes, balanced impressions, or why you rated the sample this way..."
                    className="w-full bg-slate-900 text-slate-200 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 outline-none text-xs transition-colors placeholder:text-slate-600"
                    id="hedonic_comments_textarea"
                  />
                </div>
              </div>
            )}

            {/* Descriptive Attributes Section */}
            {(activePanel.rubrics || []).includes('descriptive') && (
              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-900 shadow-xl space-y-4" id="descriptive_rubric_card">
                <div className="border-b border-slate-900/50 pb-3">
                  <h3 className="text-md font-bold text-slate-100">{(activePanel.rubrics || []).includes('hedonic') ? '3. ' : '2. '}Descriptive Attributes</h3>
                  <p className="text-slate-400 text-xs mt-1">Evaluate specific brand characteristics against baseline standards</p>
                </div>
                
                <div className="space-y-4 pt-2">
                  {Object.entries(doeAttributes).map(([attr, score]) => (
                    <div key={attr} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <label className="text-xs text-slate-300 font-bold tracking-wide">{attr}</label>
                        <span className="text-[10px] font-mono bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20 font-bold">{score} / 7</span>
                      </div>
                      
                      <div className="relative pt-1">
                        <div className="absolute top-1/2 left-0 w-full h-[3px] -translate-y-1/2 bg-slate-800 rounded-full select-none" />
                        <div 
                          className="absolute top-1/2 left-0 h-[3px] -translate-y-1/2 bg-cyan-500 rounded-full transition-all duration-200"
                          style={{ width: `${((Number(score) || 0) / 7) * 100}%` }}
                        />
                        <input
                          type="range"
                          min="0"
                          max="7"
                          step="1"
                          value={score}
                          onChange={(e) => {
                            setDoeAttributes(prev => ({ ...prev, [attr]: Number(e.target.value) }));
                          }}
                          className="w-full relative z-10 appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg"
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                        <span>Low / Absent</span>
                        <span>Moderate</span>
                        <span>Very High</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Bar */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigateToTab('dashboard')}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-full font-bold font-sans text-xs border border-slate-800"
              >
                Exit sensory evaluation
              </button>
              <button
                type="button"
                onClick={handleLoggedEvaluation}
                className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-full font-extrabold font-sans text-xs transition-shadow shadow-lg shadow-emerald-500/10"
                id="eval_submit_btn"
              >
                Log Batch Evaluation Report
              </button>
            </div>
          </div>

          {/* Off Flavor Analysis Panel */}
          <div className="space-y-6 animate-fade-in">
            
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-900 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 border-b border-slate-900 pb-2">
                <Flame className="h-5 w-5 text-rose-500" />
                Detected Off-Flavors
              </h3>
              <div className="max-h-72 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {offFlavors.map((of) => {
                  const state = offFlavorSelections[of.name] || { detected: false, severity: 0, notes: '' };
                  return (
                    <div key={of.id} className={`p-3 rounded-xl border transition-colors ${state.detected ? 'bg-rose-500/10 border-rose-500/30' : 'bg-slate-900/40 border-slate-800'}`}>
                      <div className="flex justify-between items-center">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-slate-200">
                          <input 
                            type="checkbox" 
                            checked={state.detected}
                            onChange={(e) => setOffFlavorSelections(prev => ({ ...prev, [of.name]: { ...state, detected: e.target.checked } }))}
                            className="rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-rose-500 focus:ring-offset-slate-950"
                          />
                          {of.name}
                        </label>
                      </div>
                      {state.detected && (
                        <div className="mt-3 pl-6 space-y-2">
                          <div className="flex gap-2">
                            {[1, 2, 3].map((sev) => (
                              <button
                                key={sev}
                                onClick={() => setOffFlavorSelections(prev => ({ ...prev, [of.name]: { ...state, severity: sev as any } }))}
                                className={`flex-1 py-1 text-[10px] uppercase font-mono font-bold border rounded ${state.severity === sev ? 'bg-rose-500 border-rose-400 text-slate-950' : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                              >
                                {sev === 1 ? 'Slight' : sev === 2 ? 'Moderate' : 'Strong'}
                              </button>
                            ))}
                          </div>
                          <input 
                            type="text" 
                            placeholder="Add specifics (e.g. wet cardboard, popcorn...)"
                            value={state.notes}
                            onChange={(e) => setOffFlavorSelections(prev => ({ ...prev, [of.name]: { ...state, notes: e.target.value } }))}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-rose-500"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Aromatic & Chemistry Reference Wheel */}
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-900 shadow-xl space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                  <Compass className="h-5 w-5 text-emerald-400" />
                  ASBC Beer Flavor Wheel
                </h3>
                <span className="text-[9px] font-mono text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/25 font-bold">
                  Live Helper
                </span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Click wheel categories or terms to inspect chemistry and append descriptors straight into your tasting notes!
              </p>
              <div className="border border-slate-900 rounded-2xl overflow-hidden max-h-[290px] overflow-y-auto bg-slate-950 custom-scrollbar">
                <FlavorWheelReference compact={true} onSelectTerm={(term) => {
                  triggerHapticFeedback();
                  if (hedonicValue !== undefined) {
                    setHedonicComments(p => p ? `${p}, ${term}` : term);
                  } else {
                    setTttComments(p => p ? `${p}, ${term}` : term);
                  }
                }} />
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
