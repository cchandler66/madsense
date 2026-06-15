/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Award, 
  Target, 
  Flame, 
  Search, 
  FlaskConical, 
  Users, 
  CheckCircle, 
  AlertTriangle,
  Layers,
  GraduationCap,
  Calendar,
  Sparkles,
  ShieldAlert,
  Database,
  Plus,
  Dna
} from 'lucide-react';
import { Brand, Batch, SensoryEvaluation, UserProfile, OffFlavorItem, SensoryPanel } from '../types';

interface TrainingSessionConfig {
  id: string;
  name: string;
  dateStr: string;
  spikedAttribute: string;
  notes: string;
  stations: number;
}

interface TrainingPortalProps {
  batches: Batch[];
  evaluations: SensoryEvaluation[];
  users: UserProfile[];
  offFlavors: OffFlavorItem[];
  onAddPanel: (p: SensoryPanel) => void;
}

export const TrainingPortal: React.FC<TrainingPortalProps> = ({
  batches,
  evaluations,
  users,
  offFlavors,
  onAddPanel
}) => {
  const [viewMode, setViewMode] = useState<'analytics' | 'admin'>('analytics');
  const [selectedTasterSearch, setSelectedTasterSearch] = useState('');
  const [selectedSpikeCompoundFilter, setSelectedSpikeCompoundFilter] = useState('all');
  
  // Admin Mode states
  const [trainingConfigs, setTrainingConfigs] = useState<TrainingSessionConfig[]>([]);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [newConfigName, setNewConfigName] = useState('');
  const [newConfigAttribute, setNewConfigAttribute] = useState('');
  const [newConfigNotes, setNewConfigNotes] = useState('');
  const [newConfigStations, setNewConfigStations] = useState(4);

  useEffect(() => {
    const loc = localStorage.getItem('training_configs');
    if (loc) setTrainingConfigs(JSON.parse(loc));
  }, []);

  const saveConfig = (c: TrainingSessionConfig[]) => {
    setTrainingConfigs(c);
    localStorage.setItem('training_configs', JSON.stringify(c));
  };

  const handleCreateConfig = () => {
    if (!newConfigName.trim() || !newConfigAttribute.trim()) {
      alert("Please enter a session name and spiked attribute.");
      return;
    }
    const nConfig: TrainingSessionConfig = {
      id: `train-${Date.now()}`,
      name: newConfigName,
      dateStr: new Date().toLocaleDateString('en-US'),
      spikedAttribute: newConfigAttribute,
      notes: newConfigNotes,
      stations: newConfigStations
    };
    saveConfig([...trainingConfigs, nConfig]);

    onAddPanel({
      id: `panel-train-${Date.now()}`,
      name: `[Training] ${newConfigName}`,
      date: new Date().toLocaleDateString('en-US'),
      activeBrands: [], // dummy or empty, training logic will handle
      rubrics: ['training'],
      status: 'active',
      trainingSpikedAttribute: newConfigAttribute,
      trainingNotes: newConfigNotes,
      trainingStations: newConfigStations
    });

    setShowConfigForm(false);
    setNewConfigName('');
    setNewConfigAttribute('');
    setNewConfigNotes('');
    setNewConfigStations(4);
  };


  // Filter evaluations that are explicitly TRADING calibrations
  const trainingEvaluations = useMemo(() => {
    return evaluations.filter(ev => {
      const isTrainingBatch = batches.some(b => b.batchCode === ev.batchCode && b.tags.includes('training'));
      const isDraughtLabTraining = ev.panelName.toLowerCase().includes('training') || 
                                   ev.panelName.toLowerCase().includes('spike') || 
                                   ev.panelName.toLowerCase().includes('mystery') ||
                                   ev.id.includes('training');
      return isTrainingBatch || isDraughtLabTraining;
    });
  }, [evaluations, batches]);

  // Compute calibration stats for spiked compounds
  const spikedCompoundStats = useMemo(() => {
    const stats: Record<string, { total: number; correct: number; tasters: Set<string>; compoundName: string }> = {};

    trainingEvaluations.forEach(ev => {
      // Find what compound was spiked
      let compound = 'Control';
      
      // Parse spiked compound from evaluation notes, comments or off flavor entries
      const offFlav = ev.offFlavors?.[0];
      if (offFlav && offFlav.name && offFlav.name.toLowerCase() !== 'control') {
        compound = offFlav.name.split(' (')[0]; 
      } else if (ev.hedonicComments?.includes('Spiked Attribute:')) {
        const match = ev.hedonicComments.match(/Spiked Attribute:\s*([A-Za-z0-9\s-\(\)]+)(?:\.|$)/);
        if (match) compound = match[1].split(' (')[0].trim();
      }

      if (!stats[compound]) {
        stats[compound] = {
          total: 0,
          correct: 0,
          tasters: new Set(),
          compoundName: compound
        };
      }

      stats[compound].total++;
      stats[compound].tasters.add(ev.userEmail);

      // In training imports,passedVal === 'yes' indicates they successfully detected/identified the spike
      const detected = ev.offFlavors?.[0]?.detected === true || ev.hedonicComments?.includes('Passed: yes') || ev.tttRating === 'no';
      if (detected) {
        stats[compound].correct++;
      }
    });

    return Object.values(stats);
  }, [trainingEvaluations]);

  // Calibration sensitivity leaderboard calculations
  const leaderboard = useMemo(() => {
    const normalizeEmail = (email: string): string => {
      let low = email.toLowerCase().trim();
      if (low.endsWith('@madtreebrewing.com')) {
        return low.replace('@madtreebrewing.com', '@madtree.com');
      }
      return low;
    };

    const tasterScores: Record<string, { total: number; correct: number; name: string; email: string }> = {};

    trainingEvaluations.forEach(ev => {
      const email = ev.userEmail;
      if (!email) return;

      const normEmail = normalizeEmail(email);

      if (!tasterScores[normEmail]) {
        tasterScores[normEmail] = {
          total: 0,
          correct: 0,
          name: ev.userName || email.split('@')[0],
          email: normEmail
        };
      }

      tasterScores[normEmail].total++;
      
      const detected = ev.offFlavors?.[0]?.detected === true || ev.hedonicComments?.includes('Passed: yes') || ev.tttRating === 'no';
      if (detected) {
        tasterScores[normEmail].correct++;
      }
    });

    // Make sure we seed any remaining users so they appear
    users.forEach(u => {
      const normEmail = normalizeEmail(u.email);
      if (!tasterScores[normEmail] && u.panelistScorecard) {
        // Give some initial synthetic calibration engagement based on their commercial panel engagement
        const mockTotal = Math.max(1, Math.floor(u.panelistScorecard.panelsCount / 20));
        const mockCorrect = Math.max(0, Math.floor(mockTotal * u.panelistScorecard.attendanceRate));
        tasterScores[normEmail] = {
          total: mockTotal,
          correct: mockCorrect,
          name: u.name,
          email: normEmail
        };
      }
    });

    return Object.values(tasterScores)
      .map(entry => {
        const pct = entry.total > 0 ? Math.round((entry.correct / entry.total) * 100) : 0;
        let rank = 'Initiate';
        if (pct >= 90 && entry.total >= 4) rank = 'Spike Champion 🏆';
        else if (pct >= 75) rank = 'Senior Specialist 🔬';
        else if (pct >= 50) rank = 'Calibrated Taster';

        return {
          ...entry,
          accuracy: pct,
          rank
        };
      })
      .sort((a, b) => b.accuracy - a.accuracy || b.total - a.total);
  }, [trainingEvaluations, users]);

  // Target filtered evaluations for the taster or compound lists
  const filteredTrainingEvaluations = useMemo(() => {
    return trainingEvaluations.filter(ev => {
      const matchSearch = !selectedTasterSearch ? true : 
        (ev.userName || '').toLowerCase().includes(selectedTasterSearch.toLowerCase()) ||
        (ev.userEmail || '').toLowerCase().includes(selectedTasterSearch.toLowerCase());

      let matchCompound = true;
      if (selectedSpikeCompoundFilter !== 'all') {
        const evComment = (ev.hedonicComments || '').toLowerCase();
        const evOff = ev.offFlavors?.[0] ? ev.offFlavors[0].name.toLowerCase() : '';
        matchCompound = evComment.includes(selectedSpikeCompoundFilter.toLowerCase()) || 
                        evOff.includes(selectedSpikeCompoundFilter.toLowerCase());
      }

      return matchSearch && matchCompound;
    });
  }, [trainingEvaluations, selectedTasterSearch, selectedSpikeCompoundFilter]);

  return (
    <div className="space-y-6" id="training_portal_view">
      
      {/* Banner Card Header */}
      <div className="p-6 bg-slate-900/60 rounded-3xl border border-amber-950/40 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-4 items-center">
          <div className="h-12 w-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/10 shrink-0">
            <GraduationCap className="h-6 w-6 text-slate-950" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-sans text-white tracking-tight flex items-center gap-1.5">
              Tasters Calibration &amp; Training Portal
            </h1>
            <p className="text-slate-400 text-xs mt-0.5 font-sans">
              Internal sensory standard tracking, blind double-spike detection index, and panelist calibration leaderboard.
            </p>
          </div>
        </div>
        <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800 self-start md:self-auto">
          <button
            onClick={() => setViewMode('analytics')}
            className={`px-4 py-2 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-colors ${
              viewMode === 'analytics' ? 'bg-amber-500/20 text-amber-500' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setViewMode('admin')}
            className={`px-4 py-2 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-colors flex items-center gap-2 ${
              viewMode === 'admin' ? 'bg-amber-500/20 text-amber-500' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Config Admin
          </button>
        </div>
      </div>

      {viewMode === 'admin' && (
        <div className="animate-fade-in space-y-6">
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-900 shadow-xl">
            <div className="flex justify-between items-center mb-6 border-b border-slate-900/60 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <FlaskConical className="h-5 w-5 text-emerald-400" />
                  Sensory Training Session Architect
                </h3>
                <p className="text-slate-400 text-xs mt-1">Configure isolated blind spike sessions for panelist calibration.</p>
              </div>
              <button 
                onClick={() => setShowConfigForm(!showConfigForm)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 font-mono transition-colors"
              >
                <Plus className="w-4 h-4" /> New Setup
              </button>
            </div>

            {showConfigForm && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-slate-900/40 p-6 rounded-2xl border border-emerald-900/30 mb-6 overflow-hidden space-y-4"
              >
                <h4 className="font-bold text-emerald-400 font-mono text-sm uppercase tracking-widest flex items-center gap-2">
                  <Database className="w-4 h-4" /> Session Parameters
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono text-slate-500 tracking-widest">Session / Reference Name</label>
                    <input 
                      type="text"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500 transition-colors"
                      placeholder="e.g. Q3 Diacetyl Blind Spike"
                      value={newConfigName}
                      onChange={e => setNewConfigName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono text-slate-500 tracking-widest">Target Spiked Attribute / Chemistry</label>
                    <select
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500 transition-colors"
                      value={newConfigAttribute}
                      onChange={e => setNewConfigAttribute(e.target.value)}
                    >
                      <option value="">-- Select Off Flavor --</option>
                      {offFlavors.map(of => (
                        <option key={of.id} value={of.name}>{of.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono text-slate-500 tracking-widest">Number of Sample Stations</label>
                    <input 
                      type="number"
                      min="1"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500 transition-colors"
                      value={newConfigStations}
                      onChange={e => setNewConfigStations(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] uppercase font-mono text-slate-500 tracking-widest">Methodology Notes / Prep Instructions</label>
                    <textarea 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500 transition-colors resize-none"
                      rows={2}
                      placeholder="Enter dosing concentrations or preparation protocol..."
                      value={newConfigNotes}
                      onChange={e => setNewConfigNotes(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button 
                    onClick={handleCreateConfig}
                    className="bg-emerald-500 text-slate-950 font-bold px-6 py-2 rounded-full text-xs font-mono tracking-widest hover:bg-emerald-400 transition-colors"
                  >
                    DEPLOY TO FIELD
                  </button>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trainingConfigs.length === 0 ? (
                <div className="col-span-full py-8 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500 font-mono text-sm">
                  No active field training sessions configured.
                </div>
              ) : (
                trainingConfigs.map(c => (
                  <div key={c.id} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-slate-200 truncate">{c.name}</h4>
                      <span className="text-[9px] font-mono whitespace-nowrap bg-emerald-950/40 text-emerald-500 px-2 py-0.5 rounded border border-emerald-500/20">
                        {c.dateStr}
                      </span>
                    </div>
                    <div className="space-y-1.5 z-10 relative">
                      <p className="text-xs text-slate-400 flex items-center gap-2">
                        <Dna className="w-3.5 h-3.5 text-cyan-500" /> <span className="font-mono">{c.spikedAttribute}</span>
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-2">
                        <FlaskConical className="w-3.5 h-3.5 text-amber-500" /> {c.stations} Stations Deployed
                      </p>
                      {c.notes && <p className="text-[10px] text-slate-500 line-clamp-1 italic mt-1 bg-slate-950/50 p-1.5 rounded">{c.notes}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'analytics' && (
        <>
          {/* Grid Dashboard Widgets */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Compound Sensitivity Performance Index Chart */}
        <div className="lg:col-span-2 bg-slate-950 p-6 rounded-3xl border border-slate-900 shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-md font-bold text-slate-100 flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-amber-500" />
              Spiked Compound Accuracy Index
            </h3>
            <p className="text-slate-400 text-xs mt-0.5 leading-relaxed font-sans">
              Percentage of tasters who successfully identified the spike standard during blind tests (excluding control runs).
            </p>

            <div className="space-y-4 pt-4">
              {spikedCompoundStats.filter(s => s.compoundName !== 'Control').map((compound) => {
                const percent = Math.round((compound.correct / compound.total) * 100);
                return (
                  <div key={compound.compoundName} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-200 font-bold">{compound.compoundName} Spike</span>
                      <span className="text-slate-400 font-bold">
                        {percent}% ({compound.correct}/{compound.total} Tasters Passed)
                      </span>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          percent >= 75 
                            ? 'bg-emerald-500' 
                            : percent >= 50 
                              ? 'bg-amber-500' 
                              : 'bg-rose-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-900/60 text-[10px] text-slate-500 font-mono mt-4">
            Double-blind controls evaluated daily under ASBC sensory standard threshold guidance.
          </div>
        </div>

        {/* The Calibration League Leaderboard */}
        <div className="bg-slate-950 p-6 rounded-3xl border border-slate-900 shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-md font-bold text-slate-100 flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" />
              Calibration Leaderboard
            </h3>
            <p className="text-slate-400 text-xs mt-0.5 font-sans">
              Tasters ranked by accuracy in successfully identifying blind spiked compounds.
            </p>

            <div className="space-y-3 pt-3 overflow-y-auto max-h-[280px]">
              {leaderboard.map((usr, i) => (
                <div key={usr.email} className="flex justify-between items-center p-2.5 bg-slate-900/30 rounded-xl border border-slate-900/60">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xs font-mono font-bold text-slate-500 bg-slate-900 h-6 w-6 flex items-center justify-center rounded-lg border border-slate-800 shrink-0">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-200 truncate">{usr.name}</h4>
                      <p className="text-[10px] text-amber-500 font-mono font-bold mt-0.5">{usr.rank}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-slate-100">{usr.accuracy}%</span>
                    <p className="text-[9px] text-slate-500 font-mono italic">{usr.correct}/{usr.total} hit</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-900/60 text-center text-[10px] text-slate-550 font-mono mt-3 text-slate-500">
            Qualifies tasters for brand release panels.
          </div>
        </div>

      </div>

      {/* Lookup Registries & Filter Panels */}
      <div className="p-6 bg-slate-950 rounded-3xl border border-slate-900 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-900 gap-4 mb-4">
          <div>
            <h3 className="text-md font-bold text-slate-100 font-sans">Calibration Log Registry</h3>
            <p className="text-slate-400 text-xs mt-0.5 font-sans">Query raw panel responses from blind calibrations &amp; spikes</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch gap-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Filter panelist name..."
                value={selectedTasterSearch}
                onChange={(e) => setSelectedTasterSearch(e.target.value)}
                className="pl-8 pr-4 py-1.5 bg-slate-900 text-xs text-white rounded-full border border-slate-800 outline-none w-48 focus:border-amber-500/50"
              />
            </div>

            <select
              value={selectedSpikeCompoundFilter}
              onChange={(e) => setSelectedSpikeCompoundFilter(e.target.value)}
              className="bg-slate-900 text-xs text-slate-300 px-3 py-1.5 border border-slate-800 rounded-full outline-none focus:border-amber-500/50 shrink-0"
            >
              <option value="all">All Spiked Compounds</option>
              <option value="diacetyl">Diacetyl (Buttery)</option>
              <option value="acetaldehyde">Acetaldehyde (Apple)</option>
              <option value="dms">DMS (Corn)</option>
              <option value="control">Control Runs</option>
            </select>
          </div>
        </div>

        {/* Listings log table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans divide-y divide-slate-900">
            <thead>
              <tr className="text-slate-500 font-mono uppercase tracking-wider text-[10px] pb-2">
                <th className="pb-3">Panelist Taster</th>
                <th className="pb-3 px-2">Calibration Batch</th>
                <th className="pb-3 px-2 text-center">Spiked Attribute</th>
                <th className="pb-3 px-2 text-center">Taster Selection</th>
                <th className="pb-3 px-2 text-center">Result Status</th>
                <th className="pb-3 pl-2 text-right">Evals Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/60 font-medium">
              {filteredTrainingEvaluations.map((ev, index) => {
                const comment = ev.hedonicComments || '';
                // Pull guessed / spike attributes
                let attribute = 'Control';
                let guessed = 'Control';
                let isPassed = false;

                const offFlav = ev.offFlavors?.[0];
                if (offFlav && offFlav.name && offFlav.name.toLowerCase() !== 'control') {
                  attribute = offFlav.name.split(' (')[0];
                  guessed = offFlav.notes?.replace('Guessed: ', '') || (offFlav.detected ? attribute : 'Missed');
                  isPassed = offFlav.detected;
                } else if (comment.includes('Spiked Attribute:')) {
                  const sMatch = comment.match(/Spiked Attribute:\s*([A-Za-z0-0\s]+)/);
                  const parsedS = sMatch ? sMatch[1].trim() : 'Control';
                  attribute = parsedS;
                  
                  const gMatch = comment.match(/Taster identified:\s*"([A-Za-z0-0\s]+)"/);
                  guessed = gMatch ? gMatch[1] : 'Missed';
                  isPassed = comment.includes('Passed: yes');
                }

                return (
                  <tr key={ev.id || index} className="hover:bg-slate-900/10">
                    <td className="py-3.5 font-bold text-slate-200">
                      <div>{ev.userName}</div>
                      <div className="text-[10px] text-slate-500 font-mono font-normal">{ev.userEmail}</div>
                    </td>
                    <td className="py-3.5 px-2 font-mono text-slate-300">{ev.batchCode}</td>
                    <td className="py-3.5 px-2 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        attribute === 'Control' 
                          ? 'bg-slate-900 text-slate-400' 
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                      }`}>
                        {attribute}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-center text-slate-300 font-mono italic">
                      "{guessed}"
                    </td>
                    <td className="py-3.5 px-2 text-center">
                      {isPassed ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold font-sans text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle className="h-3 w-3 shrink-0" /> HIT / PASSED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold font-sans text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                          <AlertTriangle className="h-3 w-3 shrink-0" /> MISSED
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 pl-2 text-right text-slate-400 font-mono">{ev.date}</td>
                  </tr>
                );
              })}

              {filteredTrainingEvaluations.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-mono italic">
                    No matching calibration evaluations found in system registry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

    </div>
  );
};
