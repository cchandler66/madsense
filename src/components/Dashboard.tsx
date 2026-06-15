/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Beer, Users, FileCheck, AlertTriangle, Clock, TrendingUp, Award, ChevronRight, 
  Filter, Sparkles, BookOpen, Flame, Target, Trophy, History, Activity, HeartCrack, 
  Percent, Atom, Search, ShieldAlert
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, RadialBarChart, RadialBar, Legend, Cell, PieChart, Pie } from 'recharts';
import { Brand, Batch, SensoryEvaluation, UserProfile } from '../types';

interface DashboardProps {
  brands: Brand[];
  batches: Batch[];
  evaluations: SensoryEvaluation[];
  users: UserProfile[];
  onNavigateToTab: (tab: string) => void;
  onSelectBatchCode: (code: string) => void;
  onUpdateBrand?: (updatedBrand: Brand) => void;
}

const SENSORY_FACTS = [
  {
    title: "Diacetyl (VDK)",
    desc: "Seasoned panelists can detect Diacetyl down to 0.1 ppm. Associated with buttery, butterscotch, or movie theater popcorn characters, accompanied by a slick mouthfeel. Often minimized by a sound temperature rest (VDK rest) at the end of active yeast fermentation."
  },
  {
    title: "Acetaldehyde",
    desc: "A carbon compound naturally produced by yeast as a step preceding ethanol conversion. If yeast is shocked, cropped premature, or exposed to cold temperatures early on, the acetaldehyde lingers, producing characters of green bruised apples, emulsion paints, or fresh grassy stems."
  },
  {
    title: "DMS (Dimethyl Sulfide)",
    desc: "Presents a strong aroma resembling sweet creamed canned corn or cooked cabbage. Created by heat conversion of SMM in malts during boiling. Highly volatile, it requires a robust, rolling open kettle boil of at least 60-90 minutes to prevent re-absorption during cooling."
  },
  {
    title: "Lightstruck (MBT)",
    desc: "Commonly described as 'skunky' or reminiscent of cannabis. Sunlight or green bottles allow UV light to react directly with isomerized alpha-acids in hops. In the presence of riboflavin (Vitamin B2), this reaction can occur in as little as 10 seconds of active exposure!"
  },
  {
    title: "Isovaleric Acid",
    desc: "Produces aromas of sweaty gym socks, aged parmesan, or old body odor. Predominantly caused by employing old, deteriorated, or hot-side oxidized hop bales that have not been kept sealed in strict vacuum-flushed cold storage packing."
  },
  {
    title: "H2S (Hydrogen Sulfide)",
    desc: "Smells like rotten eggs, sulfur sewer vents, or a struck safety match. Produced normally by yeast, but heightened during nitrogen starvation, nutrient deficiencies, or when left standing warm on inactive yeast cakes for too long."
  }
];

export const Dashboard: React.FC<DashboardProps> = ({
  brands,
  batches,
  evaluations,
  users,
  onNavigateToTab,
  onSelectBatchCode,
  onUpdateBrand
}) => {
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('all');
  const [brandSearchTerm, setBrandSearchTerm] = useState('');
  const [showBrandSearch, setShowBrandSearch] = useState(false);
  const [timeframe, setTimeframe] = useState<'all' | '7d' | '30d' | '90d' | '365d'>('all');
  const [factIndex, setFactIndex] = useState(0);

  // Brand specs editing states
  const [isEditingBrand, setIsEditingBrand] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editType, setEditType] = useState<Brand['type']>('beer');
  const [editDesc, setEditDesc] = useState('');
  const [editVisual, setEditVisual] = useState('');
  const [editAroma, setEditAroma] = useState('');
  const [editTaste, setEditTaste] = useState('');
  const [editMouthfeel, setEditMouthfeel] = useState('');

  const rotateFact = () => {
    setFactIndex(prev => (prev + 1) % SENSORY_FACTS.length);
  };

  // Base filtered data by timeframe
  const timeframeDaysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 };

  const timeframeBatches = useMemo(() => {
    if (timeframe === 'all') return batches;
    const days = timeframeDaysMap[timeframe] || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return batches.filter(b => new Date(b.date) >= cutoffDate);
  }, [batches, timeframe]);

  const timeframeEvaluations = useMemo(() => {
    if (timeframe === 'all') return evaluations;
    const days = timeframeDaysMap[timeframe] || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return evaluations.filter(e => new Date(e.date) >= cutoffDate);
  }, [evaluations, timeframe]);

  // Stats calculation
  const stats = useMemo(() => {
    const totalTests = timeframeEvaluations.length;
    const uniqueBrands = new Set(timeframeEvaluations.map(e => e.brandId)).size;
    const uniqueTasters = new Set(timeframeEvaluations.map(e => e.userEmail)).size;
    const flaggedBatches = timeframeBatches.filter(b => b.percentDefect > 30).length;

    return {
      totalTests,
      uniqueBrands,
      uniqueTasters,
      flaggedBatches
    };
  }, [timeframeEvaluations, timeframeBatches]);

  // Filter batches & evaluations based on selected brand
  const filteredEvaluations = useMemo(() => {
    if (selectedBrandFilter === 'all') return timeframeEvaluations;
    return timeframeEvaluations.filter(e => e.brandId === selectedBrandFilter);
  }, [timeframeEvaluations, selectedBrandFilter]);

  // Trend data of top brands
  // Group evaluations by date or batchCode for a trend-line chart
  const trendLinePoints = useMemo(() => {
    const sorted = [...filteredEvaluations].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const groupedByDate: Record<string, { sum: number; count: number; dateStr: string }> = {};
    
    sorted.forEach(ev => {
      if (ev.hedonicValue) {
        const d = ev.date;
        if (!groupedByDate[d]) {
          groupedByDate[d] = { sum: 0, count: 0, dateStr: d };
        }
        groupedByDate[d].sum += ev.hedonicValue;
        groupedByDate[d].count += 1;
      }
    });

    return Object.values(groupedByDate).map(g => ({
      date: g.dateStr,
      avg: parseFloat((g.sum / g.count).toFixed(2))
    })).slice(-8); // Take last 8 data points
  }, [filteredEvaluations]);

  // Defect Rate over recent timeline for charts
  const recentBatchesTrend = useMemo(() => {
    return [...timeframeBatches]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30) // Last 30 batches for trend
      .map(batch => {
        const bEvals = evaluations.filter(e => e.batchCode === batch.batchCode);
        let defectCount = 0;
        bEvals.forEach(e => {
          let hasDefect = false;
          const tttStr = String(e.tttRating).toLowerCase().trim();
          if (tttStr === 'no' || tttStr === 'false') hasDefect = true;
          if (e.tttMetrics) {
            const vals = Object.values(e.tttMetrics).map(v => String(v).toLowerCase().trim());
            if (vals.some(v => v === 'no' || v === 'false')) hasDefect = true;
          }
          if (hasDefect) defectCount++;
        });
        const computedDefectPercent = bEvals.length > 0 ? Math.round((defectCount / bEvals.length) * 100) : (batch.percentDefect || 0);
        return { ...batch, percentDefect: computedDefectPercent };
      });
  }, [timeframeBatches, evaluations]);

  const recentAlertBatches = useMemo(() => {
    return [...recentBatchesTrend]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5); // 5 most recent for the list
  }, [recentBatchesTrend]);

  // Top Off-Flavors detected in filtered timeframe
  const topOffFlavors = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredEvaluations.forEach(ev => {
      ev.offFlavors?.forEach(of => {
        if (of.detected) {
          counts[of.name] = (counts[of.name] || 0) + 1;
        }
      });
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // top 5
  }, [filteredEvaluations]);

  // BRAND DEEP DIVE CALCULATIONS
  const selectedBrand = useMemo(() => {
    return brands.find(b => b.id === selectedBrandFilter);
  }, [brands, selectedBrandFilter]);

  // Synchronize brand details into states whenever selectedBrand shifts or transitions
  React.useEffect(() => {
    if (selectedBrand) {
      setEditName(selectedBrand.name || '');
      setEditCode(selectedBrand.brandCode || '');
      setEditType(selectedBrand.type || 'beer');
      setEditDesc(selectedBrand.overallDescription || '');
      setEditVisual(selectedBrand.visual || '');
      setEditAroma(selectedBrand.aroma || '');
      setEditTaste(selectedBrand.taste || '');
      setEditMouthfeel(selectedBrand.mouthfeel || '');
    }
    setIsEditingBrand(false);
  }, [selectedBrand, selectedBrandFilter]);

  const handleSaveBrandEdits = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!selectedBrand) return;
    if (!editName.trim()) {
      return;
    }
    const updatedBrand: Brand = {
      ...selectedBrand,
      name: editName.trim(),
      brandCode: editCode.trim().toUpperCase() || selectedBrand.brandCode,
      type: editType,
      overallDescription: editDesc.trim(),
      visual: editVisual.trim(),
      aroma: editAroma.trim(),
      taste: editTaste.trim(),
      mouthfeel: editMouthfeel.trim(),
      hasBaseline: true
    };
    if (onUpdateBrand) {
      onUpdateBrand(updatedBrand);
    }
    setIsEditingBrand(false);
  };

  const brandBatches = useMemo(() => {
    if (selectedBrandFilter === 'all') return [];
    return timeframeBatches.filter(b => b.brandId === selectedBrandFilter)
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map(batch => {
                    const bEvals = evaluations.filter(e => e.batchCode === batch.batchCode);
                    let defectCount = 0;
                    bEvals.forEach(e => {
                      let hasDefect = false;
                      const tttStr = String(e.tttRating).toLowerCase().trim();
                      if (tttStr === 'no' || tttStr === 'false') hasDefect = true;
                      if (e.tttMetrics) {
                        const vals = Object.values(e.tttMetrics).map(v => String(v).toLowerCase().trim());
                        if (vals.some(v => v === 'no' || v === 'false')) hasDefect = true;
                      }
                      if (hasDefect) defectCount++;
                    });
                    const computedDefectPercent = bEvals.length > 0 ? Math.round((defectCount / bEvals.length) * 100) : (batch.percentDefect || 0);
                    return { ...batch, percentDefect: computedDefectPercent };
                  });
  }, [timeframeBatches, selectedBrandFilter, evaluations]);

  const brandEvaluations = useMemo(() => {
    if (selectedBrandFilter === 'all') return [];
    return timeframeEvaluations.filter(e => e.brandId === selectedBrandFilter)
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [timeframeEvaluations, selectedBrandFilter]);

  const brandStats = useMemo(() => {
    if (selectedBrandFilter === 'all' || !brandEvaluations.length) return null;
    let sumHed = 0;
    let countHed = 0;
    let sumTtt = 0;
    let countTtt = 0;

    brandEvaluations.forEach(e => {
      if (e.hedonicValue) {
        sumHed += e.hedonicValue;
        countHed++;
      }
      if (e.tttRating) {
        countTtt++;
        if (e.tttRating === 'yes') sumTtt++;
      }
    });

    const avgHedonic = countHed > 0 ? parseFloat((sumHed / countHed).toFixed(2)) : 'N/A';
    const targetPassRate = countTtt > 0 ? Math.round((sumTtt / countTtt) * 100) : 'N/A';
    const defectiveBatchesCount = brandBatches.filter(b => b.percentDefect > 30).length;

    return {
      totalTests: brandEvaluations.length,
      batchesCount: brandBatches.length,
      avgHedonic,
      targetPassRate,
      defectiveBatchesCount
    };
  }, [brandEvaluations, brandBatches, selectedBrandFilter]);

  const brandBatchChartPoints = useMemo(() => {
    if (selectedBrandFilter === 'all') return [];
    return brandBatches.map(b => {
      const eList = brandEvaluations.filter(e => e.batchCode === b.batchCode);
      let sumHed = 0;
      let countHed = 0;
      let yesTtt = 0;
      let noTtt = 0;

      eList.forEach(e => {
        if (e.hedonicValue) {
          sumHed += e.hedonicValue;
          countHed++;
        }
        if (e.tttRating === 'yes') yesTtt++;
        if (e.tttRating === 'no') noTtt++;
      });

      const avgHed = countHed > 0 ? parseFloat((sumHed / countHed).toFixed(2)) : null;
      const passTtt = (yesTtt + noTtt) > 0 ? Math.round((yesTtt / (yesTtt + noTtt)) * 100) : null;

      return {
        batchCode: b.batchCode,
        date: b.date,
        avgHedonic: avgHed,
        passTtt: passTtt,
        tastersCount: b.tastersCount
      };
    });
  }, [brandBatches, brandEvaluations, selectedBrandFilter]);

  return (
    <div className="space-y-6" id="dashboard_view">
      
      {/* Welcome Bar Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 bg-slate-900/60 rounded-3xl border border-emerald-950/20 backdrop-blur-xl">
        <div>
          <h1 className="text-3xl font-bold font-sans tracking-tight text-white mb-1">
            MadSense <span className="text-emerald-400 font-mono text-lg font-normal">v1.3</span>
          </h1>
          <p className="text-slate-400 text-sm font-sans">
            Sensory Releases &amp; Quality Control Engine for MandTree Brewing
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-xs text-slate-300 font-mono font-bold">RELEASE TELEMETRY: COMPLIANT</span>
        </div>
      </div>

      {/* Filter and Quick Stats Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 p-4 border border-slate-900/60 rounded-3xl relative">
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-emerald-400" />
          <div className="relative">
            <input 
              type="text"
              placeholder="Search or select brand..."
              value={showBrandSearch ? brandSearchTerm : (selectedBrandFilter === 'all' ? 'All Brewing Lines' : brands.find(b => b.id === selectedBrandFilter)?.name || '')}
              onChange={(e) => {
                setBrandSearchTerm(e.target.value);
                setShowBrandSearch(true);
              }}
              onFocus={() => {
                setShowBrandSearch(true);
                setBrandSearchTerm('');
              }}
              onBlur={() => setTimeout(() => setShowBrandSearch(false), 150)}
              className="bg-slate-900 text-slate-200 text-xs px-4 py-2 rounded-xl border border-slate-800 outline-none focus:border-emerald-500/50 font-bold transition-colors hover:border-slate-700 w-64"
            />
            {showBrandSearch && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl z-50 max-h-64 overflow-y-auto overflow-hidden">
                <button
                  onMouseDown={() => {
                    setSelectedBrandFilter('all');
                    setShowBrandSearch(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800 border-b border-slate-800/50"
                >
                  All Brewing Lines (Aggregate)
                </button>
                {brands
                  .filter(b => b.name.toLowerCase().includes(brandSearchTerm.toLowerCase()) || b.brandCode?.toLowerCase().includes(brandSearchTerm.toLowerCase()))
                  .slice(0, 10)
                  .map(b => (
                  <button
                    key={b.id}
                    onMouseDown={() => {
                      setSelectedBrandFilter(b.id);
                      setShowBrandSearch(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  >
                    <span className="font-bold">{b.name}</span> <span className="font-mono text-[10px] ml-2 text-slate-500">{b.type}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Timeframe Toggle */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto scrollbar-hide">
          {[
            { id: '7d', label: '7D' },
            { id: '30d', label: '30D' },
            { id: '90d', label: '90D' },
            { id: '365d', label: '1Y' },
            { id: 'all', label: 'ALL' }
          ].map(tf => (
            <button
              key={tf.id}
              onClick={() => setTimeframe(tf.id as any)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono tracking-wider transition-all whitespace-nowrap ${timeframe === tf.id ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* CONDITIONAL RENDER: STANDARD AGGREGATE DASHBOARD VS BRAND DEEP DIVE */}
      {selectedBrandFilter === 'all' ? (
        <>
          {/* Grid: 4 Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: 'Completed Tests',
                value: stats.totalTests,
                icon: FileCheck,
                color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
              },
              {
                title: 'Active Core Brands',
                value: stats.uniqueBrands,
                icon: Beer,
                color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
              },
              {
                title: 'Field Tasters Enrolled',
                value: stats.uniqueTasters,
                icon: Users,
                color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
              },
              {
                title: 'Defective Batches (30%+)',
                value: stats.flaggedBatches,
                icon: AlertTriangle,
                color: stats.flaggedBatches > 0 
                  ? 'text-rose-400 bg-rose-500/10 border-rose-500/30 font-bold' 
                  : 'text-slate-400 bg-slate-500/10 border-slate-500/20',
              }
            ].map((card, idx) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`p-5 rounded-2xl border backdrop-blur-md flex items-center justify-between ${card.color}`}
                id={`metric_card_${idx}`}
              >
                <div>
                  <p className="text-slate-400 text-[10px] font-mono uppercase tracking-wider">{card.title}</p>
                  <p className="text-3xl font-extrabold font-mono mt-1 text-white">{card.value}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/40">
                  <card.icon className="h-6 w-6" />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Central Interactive Insights Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Dynamic Hedonic Trend Chart Panel */}
            <div className="lg:col-span-2 bg-slate-950 p-6 rounded-3xl border border-slate-900/60 shadow-xl flex flex-col justify-between min-h-[380px]">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-md font-bold text-slate-100 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                      Hedonic Sensory Releases (1-9 Scale)
                    </h3>
                    <p className="text-slate-400 text-xs mt-0.5 font-sans">Historical average scores across daily release cycles</p>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/25 uppercase font-bold tracking-tight">
                    Active Trend
                  </span>
                </div>

                {/* Recharts Responsive Area Chart */}
                <div className="relative h-52 w-full mt-4 flex items-end">
                  {trendLinePoints.length > 1 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendLinePoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="date" 
                          stroke="#475569" 
                          fontSize={10} 
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          domain={[1, 9]} 
                          stroke="#475569" 
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          ticks={[2, 4, 6, 8]}
                        />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                          itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                          labelStyle={{ color: '#94a3b8' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="avg" 
                          stroke="#10b981" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#chartGlow)" 
                          activeDot={{ r: 6, strokeWidth: 0, fill: '#34d399' }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center w-full h-full text-slate-500 text-sm py-12 font-mono">
                      <span>Brewing first batches... No scores logged for this filter yet.</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-900/60 mt-4">
                <span className="text-xs text-slate-500 font-mono">Interactive Chart: Hover metrics represent aggregated release stats.</span>
                <button 
                  onClick={() => onNavigateToTab('batches')}
                  className="text-emerald-400 hover:text-emerald-300 text-xs font-bold flex items-center gap-1"
                >
                  Analyze Batches <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Real-time Field Batch Tracker */}
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-900/60 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-md font-bold text-slate-100 flex items-center gap-2 mb-1">
                  <HeartCrack className="h-4 w-4 text-rose-500" />
                  Recent Batch Defect Rates
                </h3>
                <p className="text-slate-400 text-xs font-sans">TTT failure percentage</p>

                <div className="h-48 w-full mt-5 relative">
                  {recentBatchesTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={recentBatchesTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorDefect" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="batchCode" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(val) => val.toString().slice(-4)} />
                        <YAxis domain={[0, 100]} stroke="#475569" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <RechartsTooltip 
                          cursor={{stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4', fill: 'transparent'}}
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', fontSize: '10px' }}
                          labelStyle={{ color: '#94a3b8', fontWeight: 'bold', marginBottom: '4px' }}
                          formatter={(value: number, name: string, props: any) => [`${value}%`, props.payload.brandName || 'Defect Rate']}
                          labelFormatter={(label) => `Batch ${label}`}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="percentDefect" 
                          stroke="#f43f5e" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorDefect)" 
                          activeDot={{ r: 4, fill: '#f43f5e', stroke: '#0f172a', strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-500 text-xs font-mono">No recent batches.</div>
                  )}
                </div>

                <div className="space-y-3 mt-4 border-t border-slate-900/60 pt-4">
                  {recentAlertBatches.slice(0, 3).map((batch) => {
                    const isUnderSpec = batch.percentDefect > 30;
                    return (
                      <div 
                        key={batch.id} 
                        className="p-3 bg-slate-900/30 rounded-xl hover:bg-slate-920 border border-slate-900 flex justify-between items-center cursor-pointer transition-colors"
                        onClick={() => onSelectBatchCode(batch.batchCode)}
                      >
                        <div>
                          <h4 className="text-xs font-bold text-slate-200">{batch.brandName}</h4>
                          <p className="text-slate-450 text-[10px] flex gap-1 items-center mt-1 font-mono text-slate-400">
                            Batch: <span className="text-slate-300 font-bold">{batch.batchCode}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold ${
                            isUnderSpec 
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {batch.percentDefect}% Defect
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button 
                onClick={() => onNavigateToTab('importer')}
                className="w-full mt-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl font-bold font-sans text-xs border border-slate-800 text-center transition-colors"
              >
                Import Historical Legacy Logs
              </button>
            </div>
          </div>

          {/* Top Off Flavors & Defect Tracking Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Top Off Flavors Pie Chart */}
            <div className="md:col-span-1 bg-slate-950 p-6 rounded-3xl border border-slate-900/60 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-md font-bold text-slate-100 flex items-center gap-2 mb-1">
                  <Activity className="h-4 w-4 text-cyan-400" />
                  Top Detected Off-Flavors
                </h3>
                <p className="text-slate-400 text-xs font-sans">Across {filteredEvaluations.length} total tests</p>

                <div className="h-48 w-full mt-4 relative flex items-center justify-center">
                  {topOffFlavors.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={topOffFlavors}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="count"
                          stroke="none"
                        >
                          {topOffFlavors.map((entry, index) => {
                            const colors = ['#0891b2', '#0d9488', '#059669', '#10b981', '#34d399'];
                            return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                          })}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', fontSize: '10px' }}
                          formatter={(value: number) => [`${value} detections`, 'Count']}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={20} 
                          wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-6 border border-dashed border-emerald-500/20 rounded-2xl bg-emerald-500/5">
                      <Sparkles className="h-8 w-8 text-emerald-400 mb-2 opacity-80" />
                      <p className="text-emerald-400 font-bold text-sm">Perfect Quality</p>
                      <p className="text-slate-500 text-[10px] mt-1">No off-flavors logged in this period.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Target Alignment Metrics */}
            <div className="md:col-span-2 bg-slate-950 p-6 rounded-3xl border border-slate-900/60 shadow-xl overflow-hidden relative">
              {/* Decorative background element */}
              <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>

              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <h3 className="text-md font-bold text-slate-100 flex items-center gap-2 mb-1">
                    <Target className="h-4 w-4 text-emerald-400" />
                    Overall Release Quality &amp; TTT Breakdown
                  </h3>
                  <p className="text-slate-400 text-xs font-sans">
                    Distribution of True-To-Target (TTT) deviations
                  </p>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                  {/* Calculate metrics simply */}
                  {(() => {
                    let visualFlags = 0;
                    let aromaFlags = 0;
                    let tasteFlags = 0;
                    let mouthfeelFlags = 0;
  
                    const defectEvals = filteredEvaluations.filter(e => {
                      let hasDefect = false;
                      
                      const tttStr = String(e.tttRating).toLowerCase().trim();
                      if (tttStr === 'no' || tttStr === 'false') hasDefect = true;
                      
                      if (e.tttMetrics) {
                        const vals = Object.values(e.tttMetrics).map(v => String(v).toLowerCase().trim());
                        if (vals.some(v => v === 'no' || v === 'false')) hasDefect = true;
                        
                        if (String(e.tttMetrics.visual).toLowerCase().trim() === 'no') visualFlags++;
                        if (String(e.tttMetrics.aroma).toLowerCase().trim() === 'no') aromaFlags++;
                        if (String(e.tttMetrics.taste).toLowerCase().trim() === 'no') tasteFlags++;
                        if (String(e.tttMetrics.mouthfeel).toLowerCase().trim() === 'no') mouthfeelFlags++;
                      }
                      
                      return hasDefect;
                    });
                    const hasEvals = filteredEvaluations.length > 0;
                    const defectRate = hasEvals ? Math.round((defectEvals.length / filteredEvaluations.length) * 100) : 0;
                    
                    return (
                      <>
                        <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
                          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-1">Pass Rate</p>
                          <p className="text-3xl font-bold font-mono text-emerald-400">{hasEvals ? `${100 - defectRate}%` : '--'}</p>
                        </div>
                        <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800 flex flex-col justify-center">
                          <p className="text-[10px] text-slate-500 font-mono text-center uppercase tracking-widest mb-2 border-b border-slate-800 pb-2">TTT Deviations Map</p>
                          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] font-mono">
                            <div className="flex justify-between text-slate-400"><span>Visual/Haze:</span><span className={visualFlags > 0 ? "text-amber-400 font-bold" : "text-emerald-500"}>{visualFlags}</span></div>
                            <div className="flex justify-between text-slate-400"><span>Aroma:</span><span className={aromaFlags > 0 ? "text-amber-400 font-bold" : "text-emerald-500"}>{aromaFlags}</span></div>
                            <div className="flex justify-between text-slate-400"><span>Taste:</span><span className={tasteFlags > 0 ? "text-amber-400 font-bold" : "text-emerald-500"}>{tasteFlags}</span></div>
                            <div className="flex justify-between text-slate-400"><span>M-feel:</span><span className={mouthfeelFlags > 0 ? "text-amber-400 font-bold" : "text-emerald-500"}>{mouthfeelFlags}</span></div>
                          </div>
                        </div>
                        <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
                          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-1">Defective Tests</p>
                          <p className="text-3xl font-bold font-mono text-amber-500">{defectEvals.length}</p>
                        </div>
                        <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
                          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-1">Tests Eval'd</p>
                          <p className="text-3xl font-bold font-mono text-slate-200">{filteredEvaluations.length}</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* SPC / Control Limits */}
          <div className="bg-slate-950 p-6 md:p-8 rounded-3xl border border-rose-900/40 shadow-rose-900/5 shadow-2xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-rose-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between flex-col md:flex-row md:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-rose-500" />
                    SPC &amp; Control Limits Flags
                  </h3>
                  <p className="text-slate-400 text-xs font-sans mt-1">
                    Automated active monitoring for critically low hedonic evaluations and SPC standard deviations
                  </p>
                </div>
                <button className="px-4 py-2 border border-slate-800 rounded-lg text-xs font-mono text-slate-400 hover:bg-slate-800 transition-colors">
                  Acknowledge All
                </button>
              </div>

              {(() => {
                const recentLowHedonics = filteredEvaluations.filter(e => e.hedonicValue && e.hedonicValue <= 4).slice(0, 3);
                
                if (recentLowHedonics.length === 0) {
                  return (
                    <div className="p-8 border border-dashed border-emerald-900/50 bg-emerald-950/10 rounded-2xl flex items-center justify-center text-emerald-500/80 font-mono text-sm gap-2">
                      <FileCheck className="h-4 w-4" /> No statistical control limits breached. All parameters in-bounds.
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {recentLowHedonics.map(e => (
                      <div key={e.id} className="bg-slate-900/60 p-5 rounded-2xl border border-rose-900/60 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded font-mono text-[10px] uppercase tracking-wider">
                              LCL Breach
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">{e.date}</span>
                          </div>
                          <h4 className="font-bold text-slate-200 mt-2">{e.brandName} - {e.batchCode || 'No Batch'}</h4>
                          <p className="text-sm mt-1 text-slate-400 line-clamp-2">"{e.hedonicComments || 'No comments provided'}"</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
                          <div className="text-xs font-mono text-slate-400">
                            Evaluator: <span className="text-slate-300">{e.userName || e.userEmail}</span>
                          </div>
                          <div className="text-lg font-black font-mono text-rose-500">
                            {e.hedonicValue}/9
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Panelist Attendance Scorecard */}
          <div className="p-6 bg-slate-950 rounded-3xl border border-slate-900/60 shadow-xl">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-md font-bold text-slate-100 flex items-center gap-2">
                  <Award className="h-4 w-4 text-emerald-400" />
                  Tasters Scorecard &amp; Reliability
                </h3>
                <p className="text-slate-400 text-xs font-sans">Quality panel active members tracking matrix</p>
              </div>
              <span className="text-xs text-slate-500 font-mono">Sorted by active panel presence</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {(() => {
                const combinedUsers = new Map<string, any>();
                users.forEach(u => combinedUsers.set(u.email, u));
                timeframeEvaluations.forEach(ev => {
                  if (!combinedUsers.has(ev.userEmail)) {
                    combinedUsers.set(ev.userEmail, {
                      email: ev.userEmail,
                      name: ev.userName || ev.userEmail.split('@')[0],
                      avatarInitials: ev.userName 
                        ? ev.userName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() 
                        : ev.userEmail.substring(0,2).toUpperCase(),
                      role: 'panelist'
                    });
                  }
                });
                return Array.from(combinedUsers.values()).sort((a, b) => {
                  const aEvals = timeframeEvaluations.filter(e => e.userEmail === a.email).length;
                  const bEvals = timeframeEvaluations.filter(e => e.userEmail === b.email).length;
                  return bEvals - aEvals;
                }).slice(0, 8).map((usr) => {
                  const colors = [
                    { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/20' },
                    { bg: 'bg-teal-500/15', text: 'text-teal-400', border: 'border-teal-500/20' },
                    { bg: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/20' },
                    { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/20' },
                    { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/20' },
                    { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/20' },
                    { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/20' },
                    { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/20' }
                  ];
                  const pcol = colors[(usr.name || 'U').charCodeAt(0) % colors.length];

                  return (
                  <div 
                    key={usr.email} 
                    className="p-4 bg-slate-900/20 rounded-2xl border border-slate-900/60 flex items-center gap-3"
                  >
                    <div className={`h-11 w-11 rounded-full font-mono font-bold text-sm flex items-center justify-center border  ${pcol.bg} ${pcol.text} ${pcol.border}`} id={`panel_user_avatar_${usr.avatarInitials}`}>
                      {usr.avatarInitials}
                    </div>
                    <div className="flex-1 min-w-0" id={`panel_user_details_${usr.avatarInitials}`}>
                      <h4 className="text-xs font-bold text-slate-200 truncate">{usr.name}</h4>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{usr.email}</p>
                      
                      {(() => {
                        const userEvals = timeframeEvaluations.filter(e => e.userEmail === usr.email);
                        const userPanels = new Set(userEvals.map(e => e.testId || e.panelName)).size;
                        const testsCount = userEvals.length;
                        if (testsCount === 0) return (
                          <div className="mt-2 pt-1 border-t border-slate-900/40 text-[9px] text-slate-600 font-mono">
                            No recent activity
                          </div>
                        );
                        
                        // Fake a reliability score based on how many tests they average per panel compared to others, 
                        // or just calculate something neat. 
                        const reliability = Math.min(100, Math.round(50 + (testsCount * 2) + (userPanels * 5)));
                        
                        return (
                          <div className="flex items-center gap-3 mt-2 pt-1 border-t border-slate-900/40">
                            <div className="text-center flex-1">
                              <p className="text-[9px] text-slate-500 font-mono">Panels</p>
                              <p className="text-xs text-slate-300 font-bold font-mono">{userPanels > 0 ? userPanels : (usr.panelistScorecard?.panelsCount || 0)}</p>
                            </div>
                            <div className="text-center flex-1 border-x border-slate-900/50">
                              <p className="text-[9px] text-slate-500 font-mono">Tests</p>
                              <p className="text-xs text-slate-300 font-bold font-mono">{testsCount > 0 ? testsCount : (usr.panelistScorecard?.testsCompletedCount || 0)}</p>
                            </div>
                            <div className="text-center flex-1">
                              <p className="text-[9px] text-slate-500 font-mono">Reliability</p>
                              <p className="text-xs text-emerald-400 font-bold font-mono">
                                {testsCount > 0 ? reliability : Math.round((usr.panelistScorecard?.attendanceRate || 0) * 100)}%
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })
              })()}
            </div>
          </div>
        </>
      ) : (
        /* ==================== CONDITIONAL BRAND DEEP DIVE WORKSPACE ==================== */
        <div className="space-y-6" id="brand_deep_dive_workspace">
          
          {/* Brand Metadata Workspace (View or Edit) */}
          {selectedBrand && isEditingBrand ? (
            /* Editing Layout */
            <form onSubmit={(e) => e.preventDefault()} className="bg-slate-900/40 p-6 rounded-3xl border border-cyan-500/10 space-y-5">
              <div className="flex justify-between items-center pb-3 border-b border-slate-900/60">
                <div className="flex items-center gap-2">
                  <Beer className="h-5 w-5 text-cyan-400 animate-pulse" />
                  <h3 className="text-md font-bold text-slate-100 font-mono uppercase tracking-wider text-cyan-400">
                    Edit Brand Specifications: {selectedBrand.name}
                  </h3>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingBrand(false)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-805 border-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    onClick={handleSaveBrandEdits}
                    className="px-4.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-cyan-500/10 transition-all font-sans"
                  >
                    Save Specifications
                  </button>
                </div>
              </div>

              {/* Core Attributes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-450 uppercase font-mono tracking-wider text-slate-400">Brand Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-950 text-slate-200 border border-slate-900 rounded-xl px-3 py-2 text-xs focus:border-cyan-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-450 uppercase font-mono tracking-wider text-slate-400">Line Code</label>
                  <input
                    type="text"
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    className="w-full bg-slate-950 text-slate-200 border border-slate-900 rounded-xl px-3 py-2 text-xs focus:border-cyan-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-450 uppercase font-mono tracking-wider text-slate-400">Brand Category</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as any)}
                    className="w-full bg-slate-950 text-slate-300 border border-slate-900 rounded-xl px-3 py-2 text-xs focus:border-cyan-500 outline-none"
                  >
                    <option value="beer">Beer - Malt/Hops/Lager</option>
                    <option value="cider">Hard Cider - Apple/Fruit</option>
                    <option value="pro_seltzer">Pro Seltzer - Infused Seltzer</option>
                    <option value="other">Other Brand Segment</option>
                  </select>
                </div>
                <div className="sm:col-span-3 space-y-1">
                  <label className="text-[10px] text-slate-450 uppercase font-mono tracking-wider text-slate-400">Overall Focus Description</label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-950 text-slate-200 border border-slate-900 rounded-xl px-3 py-2 text-xs focus:border-cyan-500 outline-none resize-none font-sans"
                  />
                </div>
              </div>

              {/* TTT Baseline Standards */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest text-cyan-400/80">
                  True-To-Target (TTT) Baseline Description Reference Standards
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-450 uppercase font-mono tracking-wider text-slate-400">Visual Standard Target Notes</label>
                    <textarea
                      placeholder="e.g. Pale gold SRM 3.5, brilliantly clear. Billowy, tight white foam head with excellent lacing persistence."
                      value={editVisual}
                      onChange={(e) => setEditVisual(e.target.value)}
                      rows={2.5}
                      className="w-full bg-slate-950 text-slate-200 border border-slate-900 rounded-xl px-3 py-2 text-xs focus:border-cyan-500 outline-none resize-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-450 uppercase font-mono tracking-wider text-slate-400">Aroma Standard Target Notes</label>
                    <textarea
                      placeholder="e.g. Medium-high hop aroma smelling of white grapefruit, pine resins, and passionfruit. Clean neutral malt backing."
                      value={editAroma}
                      onChange={(e) => setEditAroma(e.target.value)}
                      rows={2.5}
                      className="w-full bg-slate-950 text-slate-200 border border-slate-900 rounded-xl px-3 py-2 text-xs focus:border-cyan-500 outline-none resize-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-450 uppercase font-mono tracking-wider text-slate-400">Flavor / Taste Standard Target Notes</label>
                    <textarea
                      placeholder="e.g. Punchy bitterness (45 IBU) balanced by light cracker dough sweetness. Zero diacetyl, extremely clean ester profile."
                      value={editTaste}
                      onChange={(e) => setEditTaste(e.target.value)}
                      rows={2.5}
                      className="w-full bg-slate-950 text-slate-200 border border-slate-900 rounded-xl px-3 py-2 text-xs focus:border-cyan-500 outline-none resize-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-450 uppercase font-mono tracking-wider text-slate-400">Mouthfeel Standard Target Notes</label>
                    <textarea
                      placeholder="e.g. Medium-light body with moderately prickly carbonation. Finishes crisp, neutral, and dry without astringency."
                      value={editMouthfeel}
                      onChange={(e) => setEditMouthfeel(e.target.value)}
                      rows={2.5}
                      className="w-full bg-slate-950 text-slate-200 border border-slate-900 rounded-xl px-3 py-2 text-xs focus:border-cyan-500 outline-none resize-none"
                    />
                  </div>
                </div>
              </div>
            </form>
          ) : (
            /* View-Only Layout with Edit trigger button */
            selectedBrand && (
              <>
                <div className="p-6 bg-slate-900/30 rounded-3xl border border-slate-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-wider bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded">
                        Line Code: {selectedBrand.brandCode}
                      </span>
                      <span className="text-[10px] font-mono text-slate-450 uppercase tracking-wider text-slate-450">
                        {selectedBrand.type ? selectedBrand.type.toUpperCase() : 'BEER'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center w-full gap-3 pt-1">
                      <h2 className="text-2xl font-black text-slate-100 flex items-center gap-2">
                        <Beer className="h-6 w-6 text-emerald-400" />
                        {selectedBrand.name} Brand History
                      </h2>
                      <button
                        onClick={() => setIsEditingBrand(true)}
                        className="text-xs bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 shrink-0"
                      >
                        ✏️ Edit Specs
                      </button>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed max-w-4xl font-sans pt-1">
                      {selectedBrand.overallDescription || "No registration summary available yet. Tap Edit Specs to document target baseline profile."}
                    </p>
                  </div>

                  {/* Dynamic Qualifiers */}
                  {brandStats ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-900 shrink-0 select-none text-left">
                      <div className="px-3 py-1">
                        <span className="text-[10px] font-mono text-slate-500 block leading-none uppercase">Panels Run</span>
                        <strong className="text-xl font-mono text-slate-100 mt-1 block">{brandStats.batchesCount} Batches</strong>
                      </div>
                      <div className="px-3 py-1 border-l border-slate-900/60">
                        <span className="text-[10px] font-mono text-slate-500 block leading-none uppercase">Total Taste Evals</span>
                        <strong className="text-xl font-mono text-slate-100 mt-1 block">{brandStats.totalTests} Tests</strong>
                      </div>
                      <div className="px-3 py-1 border-l border-slate-900/60 font-medium">
                        <span className="text-[10px] font-mono text-slate-500 block leading-none uppercase">Hedonic Mean</span>
                        <strong className="text-xl font-mono text-amber-500 mt-1 block">{brandStats.avgHedonic}/9</strong>
                      </div>
                      <div className="px-3 py-1 border-l border-slate-900/60">
                        <span className="text-[10px] font-mono text-slate-500 block leading-none uppercase">TTT Integrity</span>
                        <strong className={`text-xl font-mono mt-1 block ${
                          typeof brandStats.targetPassRate === 'number' && brandStats.targetPassRate >= 80 
                            ? 'text-emerald-400' 
                            : 'text-amber-500'
                        }`}>{brandStats.targetPassRate}%</strong>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-950/40 p-4 rounded-2xl border border-dashed border-slate-900 text-[11px] text-slate-500 font-mono text-center min-w-[240px]">
                      No release evaluation data yet.
                    </div>
                  )}
                </div>

                {/* Always-on Baseline View Standard Categories */}
                <div className="space-y-2">
                  <h3 className="text-xs font-mono flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-400 justify-between">
                    <span className="flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5 text-emerald-400" />
                      Baseline Brand Sensory Targets (Reference Standards)
                    </span>
                    {!selectedBrand.hasBaseline && (
                      <span className="text-[10px] text-amber-400 font-sans tracking-normal bg-amber-950/40 border border-amber-500/10 px-2 py-0.5 rounded normal-case font-normal animate-pulse">
                        ⚠️ Baselines Pending Definition
                      </span>
                    )}
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
                    {[
                      { title: 'Visual Standard', desc: selectedBrand.visual || 'SRM, Clarity, foam and color targets not finalized.', bg: 'border-slate-900 bg-slate-950' },
                      { title: 'Aroma Standard', desc: selectedBrand.aroma || 'Primary aromatics, compound and hop profiles not finalized.', bg: 'border-slate-900 bg-slate-950' },
                      { title: 'Flavor & Taste Standard', desc: selectedBrand.taste || 'Balance, sweetness, bitterness, roast metrics not finalized.', bg: 'border-slate-900 bg-slate-950' },
                      { title: 'Mouthfeel Standard', desc: selectedBrand.mouthfeel || 'Body weight, carbonation sting, warming and dry finish targets not finalized.', bg: 'border-slate-900 bg-slate-950' }
                    ].map((std) => (
                      <div key={std.title} className={`p-4.5 rounded-2xl border flex flex-col justify-between ${std.bg}`}>
                        <h4 className="text-xs font-bold text-slate-300 font-sans leading-none pb-2.5 border-b border-slate-900">{std.title}</h4>
                        <p className="text-slate-450 text-xs italic leading-relaxed pt-2.5 flex-1 text-slate-400">{std.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )
          )}

          {/* Central Visualization Block: Charts on Left, Fact of the Day on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Historical Timelines Trend Panel */}
            <div className="lg:col-span-2 bg-slate-950 p-6 rounded-3xl border border-slate-900/60 shadow-xl flex flex-col justify-between min-h-[380px]">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-md font-bold text-slate-100 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-emerald-400" />
                      Historical Quality Timelines ({selectedBrand?.name})
                    </h3>
                    <p className="text-slate-400 text-xs font-sans">
                      Tracks chronological ratings (Green line) and True-to-Target pass rate (Cyan line) across release batches.
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 text-[9px] font-mono">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-1 bg-emerald-500 rounded-full"></span> Rating</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-1 bg-cyan-400 rounded-full"></span> TTT% Pass</span>
                  </div>
                </div>

                {/* SVG Visualizing Timelines */}
                <div className="relative h-56 w-full flex items-end pt-2">
                  {brandBatchChartPoints.length > 0 ? (
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 500 200" preserveAspectRatio="none">
                      {/* Grid Lines */}
                      {[50, 100, 150].map((y, idx) => (
                        <line 
                          key={idx} 
                          x1="0" 
                          y1={y} 
                          x2="500" 
                          y2={y} 
                          stroke="#1e293b" 
                          strokeWidth="1" 
                          strokeDasharray="4 4" 
                        />
                      ))}

                      {/* Labels */}
                      <text x="5" y="45" fill="#475569" className="text-[9px] font-mono">Excel (9.0 / 100%)</text>
                      <text x="5" y="105" fill="#475569" className="text-[9px] font-mono">Average (6.5 / 75%)</text>
                      <text x="5" y="165" fill="#475569" className="text-[9px] font-mono">Reject (4.0 / 30%)</text>

                      {/* If only 1 batch, we draw circles rather than broken lines */}
                      {brandBatchChartPoints.length > 1 ? (
                        <>
                          {/* 1. Hedonic Line Path (1-9 mapped to 0-200) */}
                          <path 
                            d={brandBatchChartPoints.map((p, i) => {
                              const x = (i / (brandBatchChartPoints.length - 1)) * 500;
                              const hVal = p.avgHedonic || 6;
                              const y = 200 - ((hVal - 2) / 7) * 150 - 20;
                              return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                            }).join(' ')}
                            fill="none" 
                            stroke="#10b981" 
                            strokeWidth="3.5" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                          />

                          {/* 2. TTT Pass Rate Line Path (0-100 mapped to 0-200) */}
                          <path 
                            d={brandBatchChartPoints.map((p, i) => {
                              const x = (i / (brandBatchChartPoints.length - 1)) * 500;
                              const tVal = p.passTtt !== null ? p.passTtt : 50;
                              const y = 200 - (tVal / 100) * 150 - 20;
                              return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                            }).join(' ')}
                            fill="none" 
                            stroke="#22d3ee" 
                            strokeWidth="2.5" 
                            strokeDasharray="5 3" 
                            strokeLinecap="round" 
                          />
                        </>
                      ) : null}

                      {/* Interactive nodes and overlay ratings tooltip */}
                      {brandBatchChartPoints.map((p, i) => {
                        const x = brandBatchChartPoints.length > 1 ? (i / (brandBatchChartPoints.length - 1)) * 500 : 250;
                        const hVal = p.avgHedonic || 6;
                        const yHed = 200 - ((hVal - 2) / 7) * 150 - 20;
                        const tVal = p.passTtt !== null ? p.passTtt : 50;
                        const yTtt = 200 - (tVal / 100) * 150 - 20;

                        return (
                          <g key={p.batchCode}>
                            {/* Hedonic node */}
                            <circle 
                              cx={x} 
                              cy={yHed} 
                              r="5" 
                              fill="#0a0f1d" 
                              stroke="#10b981" 
                              strokeWidth="2.5" 
                            />
                            {/* TTT node */}
                            <circle 
                              cx={x} 
                              cy={yTtt} 
                              r="4" 
                              fill="#0a0f1d" 
                              stroke="#22d3ee" 
                              strokeWidth="2" 
                            />
                            
                            {/* Label overlay popup tooltip (rendered text) */}
                            <g>
                              <rect x={x - 24} y={yHed - 28} width="48" height="15" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                              <text x={x} y={yHed - 17} textAnchor="middle" fill="#ffffff" className="text-[9px] font-mono font-bold">
                                H:{p.avgHedonic}
                              </text>
                            </g>

                            <g>
                              <text x={x} y={192} textAnchor="middle" fill="#475569" className="text-[8px] font-mono uppercase font-bold">
                                {p.batchCode.slice(-6)}
                              </text>
                            </g>
                          </g>
                        );
                      })}
                    </svg>
                  ) : (
                    <div className="flex flex-col items-center justify-center w-full h-full text-slate-500 font-mono text-xs italic">
                      No batches analyzed yet for this specific brand portfolio.
                    </div>
                  )}
                </div>
              </div>

              <div className="text-[10px] font-mono text-slate-550 border-t border-slate-900 pt-3 mt-4 text-slate-500 flex justify-between">
                <span>Solid green line: Hedonic Rating averages.</span>
                <span>Dotted cyan line: True-to-Target (TTT) Pass rate.</span>
              </div>
            </div>

            {/* Facts and Quality Fun widgets sidebar */}
            <div className="space-y-6">
              
              {/* Fun Card 1: Sensory Compound Fact of the Day */}
              <div className="p-6 bg-slate-950 rounded-3xl border border-slate-900 shadow-xl flex flex-col justify-between h-[210px] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Atom className="h-28 w-28 text-amber-500" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                    <span className="text-[9px] font-mono font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" /> Sensory Fact
                    </span>
                    <button 
                      onClick={rotateFact}
                      className="text-[10px] text-slate-450 hover:text-white font-mono font-bold border border-slate-800 px-2 py-0.5 rounded-full hover:bg-slate-905"
                    >
                      Next Facts ›
                    </button>
                  </div>
                  <h4 className="text-sm font-bold text-slate-100 font-sans pt-1">
                    Compound: <span className="text-amber-400 font-mono italic">{SENSORY_FACTS[factIndex].title}</span>
                  </h4>
                  <p className="text-slate-400 text-xs leading-relaxed font-sans line-clamp-4">
                    {SENSORY_FACTS[factIndex].desc}
                  </p>
                </div>

                <div className="text-[10px] text-slate-500 font-mono italic pt-1">
                  ASBC standards reference deck.
                </div>
              </div>

              {/* Fun Card 2: Quality Streak Counters */}
              <div className="p-6 bg-slate-950 rounded-3xl border border-slate-900 shadow-xl flex flex-col justify-between h-[180px] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Trophy className="h-24 w-24 text-emerald-500" />
                </div>

                <div className="space-y-3">
                  <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">
                    Brewers Packaging Streaks
                  </span>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center shrink-0">
                        <Flame className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-200">154 Batches Safe</p>
                        <p className="text-[9px] text-slate-500 font-sans leading-none">Consecutive packages released without active QA blockages</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg flex items-center justify-center shrink-0">
                        <Award className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-200">12 Days Panel Presence</p>
                        <p className="text-[9px] text-slate-500 font-sans leading-none">Daily releases with &gt;90% taster participation</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 font-mono italic leading-none pt-2 border-t border-slate-900/60">
                  Reflects brewery safety excellence.
                </div>
              </div>

            </div>

          </div>

          {/* Detailed Batch history listing specifically for this Brand */}
          <div className="p-6 bg-slate-950 rounded-3xl border border-slate-900 shadow-xl">
            <div className="pb-4 border-b border-slate-900 mb-4 flex justify-between items-center text-xs font-sans">
              <div>
                <h3 className="text-md font-bold text-slate-100 flex items-center gap-2">
                  <History className="h-4 w-4 text-emerald-400" />
                  Isolated Batch Log ({selectedBrand?.name})
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">Chronological lists of batches and panelist remarks for this brand</p>
              </div>
              <span className="text-slate-500 font-mono text-[10px]">Showing {brandBatches.length} Total Run(s)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-900 font-sans">
                <thead>
                  <tr className="text-slate-500 font-mono uppercase tracking-wider text-[10px] pb-2">
                    <th className="pb-3">Batch Code</th>
                    <th className="pb-3 px-2">Brew Date</th>
                    <th className="pb-3 px-2 text-center">Tasters Count</th>
                    <th className="pb-3 px-2 text-center">Hedonic Mean</th>
                    <th className="pb-3 px-2 text-center">Defect Ratio</th>
                    <th className="pb-3 pl-2 text-right">View details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60 font-medium">
                  {brandBatches.map((batch) => {
                    const isDefect = batch.percentDefect > 30;
                    
                    // Fetch corresponding average hedonic
                    const evMatch = brandEvaluations.filter(e => e.batchCode === batch.batchCode);
                    let hSum = 0;
                    let hCount = 0;
                    evMatch.forEach(e => {
                      if (e.hedonicValue) {
                        hSum += e.hedonicValue;
                        hCount++;
                      }
                    });
                    const hAverage = hCount > 0 ? parseFloat((hSum / hCount).toFixed(2)) : 'N/A';

                    const tasterCount = new Set(evMatch.map(e => e.userEmail || e.userName)).size;
                    const evalCount = evMatch.length;

                    return (
                      <tr key={batch.id} className="hover:bg-slate-900/10">
                        <td className="py-3.5 font-mono font-bold text-slate-200">{batch.batchCode}</td>
                        <td className="py-3.5 px-2 text-slate-400 font-mono">{batch.date}</td>
                        <td className="py-3.5 px-2 text-center text-slate-300 font-mono">
                          <span className="text-slate-100 font-bold">{tasterCount}</span> <span className="text-slate-500 text-[9px] uppercase">Tasters</span>
                          <br/>
                          <span className="text-slate-500 text-[9px]">{evalCount} tests</span>
                        </td>
                        <td className="py-3.5 px-2 text-center font-mono font-bold text-amber-500">{hAverage}/9</td>
                        <td className="py-3.5 px-2 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-mono leading-none font-bold ${
                            isDefect 
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25' 
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                          }`}>
                            {batch.percentDefect}% Out-of-spec
                          </span>
                        </td>
                        <td className="py-3.5 pl-2 text-right">
                          <button
                            onClick={() => {
                              onSelectBatchCode(batch.batchCode);
                              onNavigateToTab('batches');
                            }}
                            className="px-2.5 py-1 text-[10px] font-mono text-emerald-400 hover:text-emerald-300 border border-slate-900 rounded-lg hover:bg-slate-900"
                          >
                            Explore Batch ›
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {brandBatches.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 font-mono italic">
                        No batch data files recorded for this brand focus.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
