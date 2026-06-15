/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { analyzeTrueToTarget } from '../lib/sensoryStats';
import { 
  Search, 
  Layers, 
  GitCommit, 
  X, 
  Eye, 
  AlertTriangle, 
  CheckCircle,
  HelpCircle,
  BarChart2,
  Calendar,
  Sparkles,
  Filter,
  FlaskConical
} from 'lucide-react';
import { Batch, SensoryEvaluation, Brand } from '../types';
import { DifferenceTester } from './DifferenceTester';

interface BatchTrackerProps {
  batches: Batch[];
  evaluations: SensoryEvaluation[];
  brands: Brand[];
  preselectedBatchCode?: string;
  onClearPreselectedBatch?: () => void;
}

export const BatchTracker: React.FC<BatchTrackerProps> = ({
  batches,
  evaluations,
  brands,
  preselectedBatchCode = '',
  onClearPreselectedBatch
}) => {
  const [searchTerm, setSearchTerm] = useState<string>(preselectedBatchCode);
  const [filterBrand, setFilterBrand] = useState<string>('all');
  const [filterDateBase, setFilterDateBase] = useState<string>('all');
  const [filterDefectMin, setFilterDefectMin] = useState<number>(0);
  
  const [selectedBatchesForLinking, setSelectedBatchesForLinking] = useState<string[]>([]);
  const [showLinkingPanel, setShowLinkingPanel] = useState<boolean>(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [visibleCount, setVisibleCount] = useState<number>(30);
  const [showTriangleTest, setShowTriangleTest] = useState<boolean>(false);

  const triggerHapticFeedback = () => {
    if (window.navigator.vibrate) {
      window.navigator.vibrate(35);
    }
  };

  // Clear search on preset mount/demount
  React.useEffect(() => {
    if (preselectedBatchCode) {
      setSearchTerm(preselectedBatchCode);
    }
    setVisibleCount(30);
  }, [preselectedBatchCode]);

  const [sortBy, setSortBy] = useState<string>('date-desc');

  // Reset pagination on search change
  React.useEffect(() => {
    setVisibleCount(30);
  }, [searchTerm, filterBrand, filterDateBase, filterDefectMin]);

  // Filter batches based on lookup and sort them
  const filteredBatches = useMemo(() => {
    let result = [...batches];
    
    // Quick Search Text
    if (searchTerm) {
      result = result.filter(
        b => b.batchCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
             b.brandName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Advanced Filter: Brand
    if (filterBrand !== 'all') {
      result = result.filter(b => b.brandName === filterBrand);
    }

    // Advanced Filter: Defect Threshold
    if (filterDefectMin > 0) {
      result = result.filter(b => b.percentDefect >= filterDefectMin);
    }

    // Advanced Filter: Date range mapping
    if (filterDateBase !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      if (filterDateBase === '7days') cutoff.setDate(now.getDate() - 7);
      if (filterDateBase === '30days') cutoff.setDate(now.getDate() - 30);
      if (filterDateBase === '90days') cutoff.setDate(now.getDate() - 90);
      
      result = result.filter(b => {
        const bd = new Date(b.date);
        return bd >= cutoff;
      });
    }

    return result.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'defect-desc':
          return b.percentDefect - a.percentDefect;
        case 'defect-asc':
          return a.percentDefect - b.percentDefect;
        case 'tasters-desc':
          return b.tastersCount - a.tastersCount;
        case 'tasters-asc':
          return a.tastersCount - b.tastersCount;
        case 'brand-asc':
          return a.brandName.localeCompare(b.brandName);
        case 'brand-desc':
          return b.brandName.localeCompare(a.brandName);
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });
  }, [batches, searchTerm, filterBrand, filterDateBase, filterDefectMin, sortBy]);

  // Active Batch detail (if search exact matching or single filtered result)
  const activeBatchCode = useMemo(() => {
    if (filteredBatches.length === 1) return filteredBatches[0].batchCode;
    const exact = filteredBatches.find(b => b.batchCode === searchTerm);
    return exact ? exact.batchCode : null;
  }, [filteredBatches, searchTerm]);

  const activeBatchEvaluations = useMemo(() => {
    if (!activeBatchCode) return [];
    return evaluations.filter(e => e.batchCode === activeBatchCode);
  }, [evaluations, activeBatchCode]);

  // Compute metrics for active batch using sensoryStats
  const activeBatchMetrics = useMemo(() => {
    if (activeBatchEvaluations.length === 0) return null;
    
    let sumHedonic = 0;
    let countHedonic = 0;
    let onTargetCount = 0;
    const offFlavorsDetectedCount: Record<string, number> = {};

    activeBatchEvaluations.forEach(ev => {
      if (ev.hedonicValue) {
        sumHedonic += ev.hedonicValue;
        countHedonic++;
      }
      
      let hasDefect = false;
      const tttStr = String(ev.tttRating).toLowerCase().trim();
      if (tttStr === 'no' || tttStr === 'false') hasDefect = true;
      
      if (ev.tttMetrics) {
        const vals = Object.values(ev.tttMetrics).map(v => String(v).toLowerCase().trim());
        if (vals.some(v => v === 'no' || v === 'false')) hasDefect = true;
        
        if (String(ev.tttMetrics.visual).toLowerCase().trim() === 'no') offFlavorsDetectedCount['Visual/Haze Deviation'] = (offFlavorsDetectedCount['Visual/Haze Deviation'] || 0) + 1;
        if (String(ev.tttMetrics.aroma).toLowerCase().trim() === 'no') offFlavorsDetectedCount['Aroma Deviation'] = (offFlavorsDetectedCount['Aroma Deviation'] || 0) + 1;
        if (String(ev.tttMetrics.taste).toLowerCase().trim() === 'no') offFlavorsDetectedCount['Taste Deviation'] = (offFlavorsDetectedCount['Taste Deviation'] || 0) + 1;
        if (String(ev.tttMetrics.mouthfeel).toLowerCase().trim() === 'no') offFlavorsDetectedCount['Mouthfeel Deviation'] = (offFlavorsDetectedCount['Mouthfeel Deviation'] || 0) + 1;
      }

      if (!hasDefect) {
        onTargetCount++;
      }
      
      ev.offFlavors?.forEach(of => {
        if (of.detected) {
          offFlavorsDetectedCount[of.name] = (offFlavorsDetectedCount[of.name] || 0) + 1;
        }
      });
    });

    const averageHedonic = countHedonic > 0 ? parseFloat((sumHedonic / countHedonic).toFixed(2)) : null;
    
    // Utilize the Advanced true-to-target statistical engine
    const tttAnalysis = analyzeTrueToTarget(activeBatchEvaluations.length, onTargetCount, {
      acceptanceThreshold: 0.7,
      baselineOffTargetRate: 0.2
    });

    return {
      averageHedonic,
      tttAnalysis,
      evaluationsCount: activeBatchEvaluations.length,
      offFlavorsDetectedCount
    };
  }, [activeBatchEvaluations]);

  // Linking Comparison Data
  const linkComparisonDetails = useMemo(() => {
    if (selectedBatchesForLinking.length === 0) return null;
    
    return selectedBatchesForLinking.map(code => {
      const b = batches.find(batch => batch.batchCode === code);
      const evs = evaluations.filter(e => e.batchCode === code);
      
      let sumHedonic = 0;
      let countHedonic = 0;
      let yesTTT = 0;
      let noTTT = 0;
      const dft: Record<string, number> = {};

      evs.forEach(ev => {
        if (ev.hedonicValue) {
          sumHedonic += ev.hedonicValue;
          countHedonic++;
        }
        
        let hasDefect = false;
        const tttStr = String(ev.tttRating).toLowerCase().trim();
        if (tttStr === 'no' || tttStr === 'false') hasDefect = true;
        
        if (ev.tttMetrics) {
          const vals = Object.values(ev.tttMetrics).map(v => String(v).toLowerCase().trim());
          if (vals.some(v => v === 'no' || v === 'false')) hasDefect = true;
        }

        if (hasDefect) {
          noTTT++;
        } else {
          yesTTT++;
        }
        
        if (ev.tttMetrics) {
          if (String(ev.tttMetrics.visual).toLowerCase().trim() === 'no') dft['Vis'] = (dft['Vis'] || 0) + 1;
          if (String(ev.tttMetrics.aroma).toLowerCase().trim() === 'no') dft['Aro'] = (dft['Aro'] || 0) + 1;
          if (String(ev.tttMetrics.taste).toLowerCase().trim() === 'no') dft['Tas'] = (dft['Tas'] || 0) + 1;
          if (String(ev.tttMetrics.mouthfeel).toLowerCase().trim() === 'no') dft['Mfl'] = (dft['Mfl'] || 0) + 1;
        }

        ev.offFlavors?.forEach(of => {
          if (of.detected) {
            dft[of.name] = (dft[of.name] || 0) + 1;
          }
        });
      });

      const calculatedDefects = evs.length > 0 ? Math.round((noTTT / evs.length) * 100) : (b?.percentDefect !== undefined ? b.percentDefect : 'N/A');

      return {
        batchCode: code,
        brandName: b?.brandName || 'Unknown Product',
        tastersCount: b?.tastersCount || evs.length,
        averageHedonic: countHedonic > 0 ? parseFloat((sumHedonic / countHedonic).toFixed(2)) : 'N/A',
        percentDefect: calculatedDefects,
        offFlavorsCount: Object.keys(dft).length
      };
    });
  }, [selectedBatchesForLinking, batches, evaluations]);

  const handleToggleBatchForLinking = (batchCode: string) => {
    setSelectedBatchesForLinking(prev => 
      prev.includes(batchCode) ? prev.filter(c => c !== batchCode) : [...prev, batchCode]
    );
  };

  return (
    <div className="space-y-6" id="bulk_batch_comparison_view">
      {/* Search Console */}
      <div className="flex flex-col gap-4 bg-slate-950 p-6 rounded-3xl border border-slate-900 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
              <Layers className="h-5 w-5 text-cyan-400" />
              Batch History &amp; Comparative Analysis
            </h2>
            <p className="text-slate-400 text-xs">Link multiple daily release batches to analyze quality regression</p>
          </div>

          <div className="flex gap-2 items-center flex-wrap sm:flex-nowrap sm:justify-start">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search via batch code or brand name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-900 text-white rounded-full border border-slate-800 outline-none text-xs w-60 focus:border-cyan-500/50"
                id="batch_search_input"
              />
              {searchTerm && (
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    if (onClearPreselectedBatch) onClearPreselectedBatch();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`p-2 rounded-full border transition-colors shrink-0 ${
                showAdvancedFilters || filterBrand !== 'all' || filterDateBase !== 'all' || filterDefectMin > 0
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' 
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'
              }`}
            >
              <Filter className="h-4 w-4" />
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs px-3 py-2 rounded-full outline-none focus:border-cyan-500/50 cursor-pointer"
              id="batch_sort_dropdown"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="defect-desc">Defects (Highest) </option>
              <option value="defect-asc">Defects (Lowest) </option>
              <option value="tasters-desc">Tasters (Most)</option>
              <option value="tasters-asc">Tasters (Least)</option>
              <option value="brand-asc">A-Z (Brand)</option>
              <option value="brand-desc">Z-A (Brand)</option>
            </select>

            <button
              onClick={() => setShowLinkingPanel(!showLinkingPanel)}
              className={`px-4 py-2 text-xs font-bold rounded-full border flex items-center gap-1.5 transition-colors shrink-0 ${
                selectedBatchesForLinking.length > 0 
                  ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 font-extrabold' 
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'
              }`}
              id="batch_linker_toggle"
            >
              <GitCommit className="h-4 w-4" /> Batch Linker ({selectedBatchesForLinking.length})
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showAdvancedFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-slate-800 flex flex-wrap gap-4 mt-2">
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-mono text-slate-500">Brand</span>
                  <select
                    value={filterBrand}
                    onChange={e => setFilterBrand(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-slate-300 text-xs px-3 py-2 rounded-lg outline-none w-40"
                  >
                    <option value="all">Every Brand</option>
                    {brands?.map(b => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-mono text-slate-500">Date Range</span>
                  <select
                    value={filterDateBase}
                    onChange={e => setFilterDateBase(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-slate-300 text-xs px-3 py-2 rounded-lg outline-none w-40"
                  >
                    <option value="all">All Time</option>
                    <option value="7days">Last 7 Days</option>
                    <option value="30days">Last 30 Days</option>
                    <option value="90days">Last 90 Days</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-mono text-slate-500">Defect threshold</span>
                  <select
                    value={filterDefectMin}
                    onChange={e => setFilterDefectMin(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-800 text-slate-300 text-xs px-3 py-2 rounded-lg outline-none w-40"
                  >
                    <option value={0}>Any</option>
                    <option value={10}>&gt; 10% defects</option>
                    <option value={30}>&gt; 30% defects</option>
                    <option value={50}>&gt; 50% defects</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Batch Linker Side-by-side Comparative Panel */}
      <AnimatePresence>
        {showLinkingPanel && selectedBatchesForLinking.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-6 bg-slate-950 rounded-3xl border border-cyan-950/40 shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-900/60">
              <div>
                <h3 className="text-md font-bold text-slate-250 flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-cyan-400" />
                  Comparative Registry Analysis
                </h3>
                <p className="text-slate-500 text-[11px] mt-0.5 font-sans">Statistical side-by-side comparative analysis of linked batches</p>
              </div>
              <button 
                onClick={() => setSelectedBatchesForLinking([])}
                className="text-slate-500 hover:text-rose-400 text-xs font-mono"
              >
                Clear All
              </button>
            </div>

            {/* Side-by-side Table/Cards inside grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {linkComparisonDetails?.map((item) => (
                <div key={item.batchCode} className="p-4 bg-slate-900/30 rounded-2xl border border-slate-905 flex flex-col justify-between border-slate-900/50">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[10px] font-mono font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-cyan-400">
                        Batch No {item.batchCode}
                      </span>
                      <button 
                        onClick={() => handleToggleBatchForLinking(item.batchCode)}
                        className="text-slate-500 hover:text-rose-400"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <h4 className="text-sm font-bold text-slate-200 truncate pt-2">{item.brandName}</h4>
                    
                    <div className="space-y-1.5 pt-3 text-xs">
                      <div className="flex justify-between font-mono">
                        <span className="text-slate-500">Hedonic Average:</span>
                        <span className="text-amber-400 font-bold">{item.averageHedonic}</span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span className="text-slate-500">TTT Defect score:</span>
                        <span className={`font-bold ${item.percentDefect > 30 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {item.percentDefect}%
                        </span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span className="text-slate-500">Flagged Defects:</span>
                        <span className="text-slate-300">{item.offFlavorsCount} defects</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setSearchTerm(item.batchCode);
                      setShowLinkingPanel(false);
                    }}
                    className="w-full mt-4 py-1.5 bg-slate-950 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-200 text-[10px] font-mono border border-slate-850"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>

            {/* Quick Linker Visual Curve Chart */}
            {linkComparisonDetails && linkComparisonDetails.length > 1 && (
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-900/70 space-y-4">
                <span className="text-[10px] text-slate-500 font-mono uppercase block">TTT Defect Rate Comparison Analysis map:</span>
                <div className="relative h-20 w-full flex items-end">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 500 80" preserveAspectRatio="none">
                    <line x1="0" y1="40" x2="500" y2="40" stroke="#1e293b" strokeDasharray="3 3"/>
                    {/* Draw bars side-by-side */}
                    {linkComparisonDetails?.map((item, idx) => {
                      const l = linkComparisonDetails.length;
                      const x = (idx / (l - 1)) * 440 + 30;
                      const height = typeof item.percentDefect === 'number' ? (item.percentDefect / 100) * 55 : 5;
                      const isHigh = typeof item.percentDefect === 'number' && item.percentDefect > 30;
                      return (
                        <g key={idx}>
                          <rect
                            x={x - 10}
                            y={70 - height}
                            width="20"
                            height={height}
                            fill={isHigh ? '#f43f5e' : '#10b981'}
                            rx="3"
                          />
                          <text x={x} y={78} textAnchor="middle" fill="#475569" className="text-[9px] font-mono">
                            {item.batchCode.slice(-4)}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid: Left - Search Table, Right - Detailed Spec Analysis (if batch active) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Batches Table List */}
        <div className={`bg-slate-950 p-6 rounded-3xl border border-slate-900/60 shadow-xl flex flex-col justify-between ${
          activeBatchCode ? 'lg:col-span-2' : 'lg:col-span-3'
        }`}>
          <div>
            <h3 className="text-md font-bold text-slate-200 mb-4">Brewing Batches Lookup Table</h3>
            
            <div className="overflow-x-auto pr-1">
              <table className="w-full text-xs font-sans text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-905 text-slate-500 font-mono uppercase tracking-wider text-[10px]">
                    <th 
                      className="pb-3 pr-2 select-none cursor-pointer hover:text-slate-300 transition-colors"
                      onClick={() => setSortBy(p => p === 'brand-asc' ? 'brand-desc' : 'brand-asc')}
                    >
                      Product Brand {sortBy.startsWith('brand') ? (sortBy === 'brand-asc' ? '▲' : '▼') : ''}
                    </th>
                    <th 
                      className="pb-3 px-2 select-none cursor-pointer hover:text-slate-300 transition-colors"
                      onClick={() => setSortBy(p => p === 'date-desc' ? 'date-asc' : 'date-desc')}
                    >
                      Batch No {sortBy.startsWith('date') ? (sortBy === 'date-desc' ? '▼' : '▲') : ''}
                    </th>
                    <th 
                      className="pb-3 px-2 select-none cursor-pointer hover:text-slate-300 transition-colors"
                      onClick={() => setSortBy(p => p === 'date-desc' ? 'date-asc' : 'date-desc')}
                    >
                      Release Date
                    </th>
                    <th 
                      className="pb-3 px-2 text-center select-none cursor-pointer hover:text-slate-300 transition-colors"
                      onClick={() => setSortBy(p => p === 'tasters-desc' ? 'tasters-asc' : 'tasters-desc')}
                    >
                      Tasters Count {sortBy.startsWith('tasters') ? (sortBy === 'tasters-desc' ? '▼' : '▲') : ''}
                    </th>
                    <th 
                      className="pb-3 px-2 text-right select-none cursor-pointer hover:text-slate-300 transition-colors"
                      onClick={() => setSortBy(p => p === 'defect-desc' ? 'defect-asc' : 'defect-desc')}
                    >
                      TTT Defect % {sortBy.startsWith('defect') ? (sortBy === 'defect-desc' ? '▼' : '▲') : ''}
                    </th>
                    <th className="pb-3 pl-2 text-right">Compare Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60">
                  {filteredBatches.slice(0, visibleCount).map((b) => {
                    const linked = selectedBatchesForLinking.includes(b.batchCode);
                    const isDefect = b.percentDefect > 30;

                    const activeEvals = evaluations.filter(e => e.batchCode === b.batchCode);
                    const tasterCount = new Set(activeEvals.map(e => e.userEmail || e.userName)).size;
                    const evalCount = activeEvals.length;

                    return (
                      <tr 
                        key={b.id} 
                        className={`hover:bg-slate-900/20 cursor-pointer ${activeBatchCode === b.batchCode ? 'bg-slate-900/30' : ''}`}
                        onClick={() => {
                          triggerHapticFeedback();
                          setSearchTerm(b.batchCode);
                        }}
                      >
                        <td 
                          className="py-4 font-bold text-slate-200 pr-2 max-w-[150px] truncate hover:text-cyan-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerHapticFeedback();
                            setFilterBrand(b.brandName);
                            setSearchTerm('');
                          }}
                        >
                          {b.brandName}
                        </td>
                        <td className="py-4 font-mono text-slate-300 px-2">{b.batchCode}</td>
                        <td className="py-4 text-slate-400 px-2">{b.date}</td>
                        <td className="py-4 text-slate-400 px-2 text-center font-mono">
                          <span className="text-slate-100 font-bold">{tasterCount > 0 ? tasterCount : b.tastersCount}</span>
                          <span className="text-slate-500 text-[9px] uppercase ml-1">Tasters</span>
                          <span className="text-slate-500 text-[10px] block border-t border-slate-900 mt-1 pt-1">{evalCount > 0 ? evalCount : b.tastersCount} tests</span>
                        </td>
                        <td className="py-4 text-right px-2">
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                            isDefect ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {b.percentDefect}%
                          </span>
                        </td>
                        <td className="py-4 text-right pl-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleToggleBatchForLinking(b.batchCode)}
                            className={`p-1 text-[10px] font-mono border rounded ${
                              linked 
                                ? 'bg-cyan-500/15 border-cyan-400 text-cyan-400 font-extrabold'
                                : 'bg-slate-900/20 border-slate-900 text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            {linked ? 'LINKED' : 'ADD'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  
                  {filteredBatches.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 font-mono italic">
                        No matches found for lookup search query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {filteredBatches.length > visibleCount && (
              <div className="flex justify-center pt-4 border-t border-slate-900/40">
                <button
                  type="button"
                  onClick={() => setVisibleCount(p => p + 50)}
                  className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-full text-xs font-mono border border-slate-800 hover:border-slate-700 transition"
                >
                  Load More Batches (+{filteredBatches.length - visibleCount} item(s) remaining)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Detailed active stats segment */}
        {activeBatchCode && activeBatchMetrics && (
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-900 flex flex-col justify-between shadow-2xl relative">
            
            <div className="space-y-4">
              <div className="flex justify-between items-start border-b border-slate-900/60 pb-3">
                <div>
                  <span className="text-[10px] text-slate-500 font-mono block uppercase">Analytical Deep Dive</span>
                  <h3 className="text-md font-bold text-slate-250 mt-1">Batch Code: {activeBatchCode}</h3>
                </div>
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    if (onClearPreselectedBatch) onClearPreselectedBatch();
                  }}
                  className="text-slate-500 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Stats highlights */}
              <div className="grid grid-cols-2 gap-3 pb-3">
                <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-900">
                  <span className="text-[10px] text-slate-500 font-mono block leading-none">Hedonic Mean</span>
                  <p className="text-2xl font-bold font-mono text-amber-500 mt-1.5">{activeBatchMetrics.averageHedonic || 'N/A'}</p>
                </div>
                <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-900">
                  <span className="text-[10px] text-slate-500 font-mono block leading-none">TTT Pass rate</span>
                  <p className="text-2xl font-bold font-mono text-emerald-400 mt-1.5">{typeof activeBatchMetrics.tttAnalysis.proportionOnTarget === 'number' ? `${(activeBatchMetrics.tttAnalysis.proportionOnTarget * 100).toFixed(0)}%` : 'N/A'}</p>
                </div>
              </div>

              {/* Advanced TTT Recommendation */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-500 font-mono block uppercase">Release Recommendation:</span>
                <div className={`p-3 rounded-xl border flex flex-col gap-1.5 ${
                  activeBatchMetrics.tttAnalysis.recommendation === 'release'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}>
                  <div className="flex items-center gap-1.5 font-bold">
                    {activeBatchMetrics.tttAnalysis.recommendation === 'release' ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                    <span>{activeBatchMetrics.tttAnalysis.recommendation === 'release' ? 'RELEASE APPROVED' : 'HOLD FOR REVIEW'}</span>
                  </div>
                  <p className="text-xs font-mono opacity-80 leading-relaxed">
                    {activeBatchMetrics.tttAnalysis.conclusion}
                  </p>
                </div>
              </div>

              {/* Triangle Difference Test Action */}
              <button 
                onClick={() => setShowTriangleTest(true)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-cyan-600/20 border border-cyan-500/30 hover:bg-cyan-600/40 hover:border-cyan-400/50 text-cyan-400 rounded-xl transition-colors font-bold text-sm"
              >
                <FlaskConical className="h-4 w-4" />
                Run Triangle Exclusivity Test
              </button>

              {/* Off Flavors log checklist */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-500 font-mono block uppercase">Detected Fermentation Off-Flavors:</span>
                
                {Object.keys(activeBatchMetrics.offFlavorsDetectedCount).length === 0 ? (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <span>Clean Run. No off-flavors or fermentation defects flagged by tasters.</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {Object.entries(activeBatchMetrics.offFlavorsDetectedCount).map(([ofName, count]) => (
                      <div key={ofName} className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 flex items-center justify-between text-xs font-mono">
                        <span className="font-sans font-bold leading-none">{ofName}</span>
                        <span>Flagged x{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tasters direct comments stream */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-500 font-mono block uppercase">Panelists Raw Comments stream:</span>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1 text-xs custom-scrollbar">
                  {activeBatchEvaluations.map((ev, idx) => (
                    <div key={ev.id || idx} className="p-2 bg-slate-900/40 rounded-xl space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-slate-400 font-bold">{ev.userName}</span>
                        {ev.hedonicValue && <span className="text-amber-500">Value: {ev.hedonicValue}/9</span>}
                      </div>
                      <p className="text-slate-300 font-sans italic">"{ev.hedonicComments || ev.tttComments || 'No written comments logged'}"</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-900/40 pt-4 mt-4">
              <span className="text-[10px] text-slate-600 font-mono flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Historical Log Certifications Verified.
              </span>
            </div>

          </div>
        )}

      </div>

      {showTriangleTest && activeBatchCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl mt-8">
            <DifferenceTester 
              batchCode={activeBatchCode}
              onCancel={() => setShowTriangleTest(false)}
              onComplete={(sample, timeMs) => {
                setShowTriangleTest(false);
                triggerHapticFeedback();
                alert(`Triangle test complete. You picked ${sample} in ${(timeMs/1000).toFixed(1)}s.`);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
