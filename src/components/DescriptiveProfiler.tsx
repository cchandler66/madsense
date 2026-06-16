import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Plus, X, Search, Beaker, MessageSquare, Check } from 'lucide-react';
import { FLAVOR_WHEEL_DATA, FlavorWheelNode, SECTOR_COLORS } from '../data/flavorWheelData';

export interface DescriptiveAttribute {
  term: string;
  categoryPath: string;
  intensity: number;
  notes: string;
  chem?: string;
}

interface Props {
  initialAttributes?: DescriptiveAttribute[];
  onChange: (attributes: DescriptiveAttribute[]) => void;
  brandTargetInfo?: { visual?: string; aroma?: string; taste?: string; mouthfeel?: string };
}

export const DescriptiveProfiler: React.FC<Props> = ({ initialAttributes = [], onChange, brandTargetInfo }) => {
  const [selectedAttrs, setSelectedAttrs] = useState<DescriptiveAttribute[]>(initialAttributes);

  React.useEffect(() => {
    setSelectedAttrs(initialAttributes);
  }, [initialAttributes]);
  
  // Navigation State for the ASBC Wheel
  const [navPath, setNavPath] = useState<FlavorWheelNode[]>(FLAVOR_WHEEL_DATA.children || []);
  const [pathHistory, setPathHistory] = useState<{ nodes: FlavorWheelNode[], title: string }[]>([]);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  const triggerHaptic = () => {
    if (window.navigator.vibrate) window.navigator.vibrate(20);
  };

  const handleSelectAttribute = (node: FlavorWheelNode, fullPath: string) => {
    triggerHaptic();
    if (selectedAttrs.find(a => a.term === node.name)) return; // Already added

    const newAttr: DescriptiveAttribute = {
      term: node.name,
      categoryPath: fullPath,
      intensity: 4, // Default middle intensity
      notes: '',
      chem: node.chem
    };
    
    const updated = [...selectedAttrs, newAttr];
    setSelectedAttrs(updated);
    onChange(updated);
  };

  const handleUpdateAttribute = (index: number, field: keyof DescriptiveAttribute, value: any) => {
    const updated = [...selectedAttrs];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedAttrs(updated);
    onChange(updated);
  };

  const handleRemoveAttribute = (index: number) => {
    triggerHaptic();
    const updated = selectedAttrs.filter((_, i) => i !== index);
    setSelectedAttrs(updated);
    onChange(updated);
  };

  // Drill down into a category
  const navigateDeeper = (node: FlavorWheelNode, currentTitle: string) => {
    triggerHaptic();
    if (node.children) {
      setPathHistory([...pathHistory, { nodes: navPath, title: currentTitle }]);
      setNavPath(node.children);
    } else {
      const existingIdx = selectedAttrs.findIndex(a => a.term === node.name);
      if (existingIdx !== -1) {
        handleRemoveAttribute(existingIdx);
      } else {
        handleSelectAttribute(node, currentTitle);
      }
    }
  };

  // Navigate up the breadcrumb
  const navigateUp = () => {
    triggerHaptic();
    if (pathHistory.length === 0) return;
    const previous = pathHistory[pathHistory.length - 1];
    setNavPath(previous.nodes);
    setPathHistory(pathHistory.slice(0, -1));
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 bg-slate-950 border border-slate-900 rounded-3xl p-6 shadow-xl" id="descriptive_rubric_card">
      
      {/* LEFT COLUMN: The Profile Builder (Selected Attributes) */}
      <div className="space-y-4 flex flex-col">
        <div className="border-b border-slate-900/50 pb-3">
          <h3 className="text-md font-bold text-slate-100 flex items-center gap-2">
            <Beaker className="h-5 w-5 text-cyan-400" />
            Active Flavor Profile
          </h3>
          <p className="text-slate-400 text-xs mt-1">Adjust intensities and add required panel notes for detected flavors.</p>
        </div>

        {selectedAttrs.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
            <Search className="h-8 w-8 text-slate-600 mb-3" />
            <p className="text-sm font-bold text-slate-400">No characteristics selected</p>
            <p className="text-xs text-slate-500 mt-1">Explore the ASBC Lexicon to map the sensory profile.</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            <AnimatePresence>
              {selectedAttrs.map((attr, idx) => (
                <motion.div 
                  key={attr.term}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 relative overflow-hidden group"
                >
                  <button 
                    onClick={() => handleRemoveAttribute(idx)}
                    className="absolute top-3 right-3 text-slate-600 hover:text-rose-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="pr-8">
                    <p className="text-[10px] text-cyan-500 font-mono tracking-widest uppercase mb-1">{attr.categoryPath}</p>
                    <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      {attr.term}
                      {attr.chem && <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">{attr.chem}</span>}
                    </h4>
                  </div>

                  {/* High-Fidelity Slider */}
                  <div className="mt-4 mb-2">
                    <div className="flex justify-between items-end mb-1.5">
                      <label className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Intensity</label>
                      <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                        {attr.intensity} / 7
                      </span>
                    </div>
                    <input
                      type="range" min="0" max="7" step="1"
                      value={attr.intensity}
                      onChange={(e) => handleUpdateAttribute(idx, 'intensity', Number(e.target.value))}
                      className="w-full appearance-none bg-slate-800 h-1.5 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-1">
                      <span>Threshold</span>
                      <span>Moderate</span>
                      <span>Extreme</span>
                    </div>
                  </div>

                  {/* Integrated Notes Field */}
                  <div className="mt-3 relative">
                    <MessageSquare className="h-3.5 w-3.5 text-slate-600 absolute top-2.5 left-2.5" />
                    <input
                      type="text"
                      placeholder="Add specific descriptors..."
                      value={attr.notes}
                      onChange={(e) => handleUpdateAttribute(idx, 'notes', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-200 outline-none transition-colors placeholder:text-slate-600"
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: The ASBC Lexicon Explorer */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex flex-col h-[600px]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest font-mono">ASBC Lexicon</h3>
          {pathHistory.length > 0 && (
            <button onClick={navigateUp} className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              &larr; Back
            </button>
          )}
        </div>

        {/* Breadcrumb Header */}
        <div className="mb-4 text-xs font-mono text-slate-500 flex flex-wrap gap-1 items-center bg-slate-950 p-2 rounded-lg border border-slate-900">
          <span className="font-bold text-slate-400">Beer</span>
          {pathHistory.map((hist, i) => (
            <React.Fragment key={i}>
              <ChevronRight className="h-3 w-3 text-slate-700" />
              <span>{hist.title}</span>
            </React.Fragment>
          ))}
        </div>

        {/* Navigation Grid */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {navPath.map((node) => {
              // Determine if it's a leaf node (a specific flavor) or a category
              const isLeaf = !node.children;
              const hasBeenSelected = selectedAttrs.some(a => a.term === node.name);
              
              // Get a base color if it's a high level category
              const baseColor = SECTOR_COLORS[node.name] || '#334155'; // default slate

              return (
                <button
                  key={node.name}
                  onClick={() => navigateDeeper(node, node.name)}
                  className={`text-left p-3 rounded-xl border transition-all flex items-center justify-between group ${
                    hasBeenSelected && isLeaf
                      ? 'bg-emerald-500/20 border-emerald-500/50 hover:bg-emerald-500/10'
                      : isLeaf 
                        ? 'bg-slate-950 border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900'
                        : 'bg-slate-900 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
                  }`}
                >
                  <div>
                    <span className={`text-sm font-bold ${isLeaf ? 'text-slate-300' : 'text-slate-100'}`}>
                      {node.name}
                    </span>
                    {node.terms && (
                      <p className="text-[9px] text-slate-500 leading-tight mt-1 line-clamp-2 pr-2">
                        {node.terms}
                      </p>
                    )}
                  </div>
                  
                  {isLeaf ? (
                    hasBeenSelected ? <Check className="h-4 w-4 text-emerald-500" /> : <Plus className="h-4 w-4 text-slate-600 group-hover:text-cyan-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
};
