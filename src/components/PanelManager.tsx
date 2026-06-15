/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Calendar, 
  Check, 
  Trash2, 
  UserPlus, 
  Clipboard, 
  Beer,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { Brand, SensoryPanel, UserProfile } from '../types';

interface PanelManagerProps {
  brands: Brand[];
  panels: SensoryPanel[];
  users: UserProfile[];
  onAddPanel: (newPanel: SensoryPanel) => void;
  onUpdatePanel: (updatedPanel: SensoryPanel) => void;
  onDeletePanel: (id: string) => void;
  onNavigateToTab: (tab: string) => void;
  onAddBrand?: (newBrand: Brand) => void;
}

export const PanelManager: React.FC<PanelManagerProps> = ({
  brands,
  panels,
  users,
  onAddPanel,
  onUpdatePanel,
  onDeletePanel,
  onNavigateToTab,
  onAddBrand
}) => {
  const [panelName, setPanelName] = useState<string>('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedRubrics, setSelectedRubrics] = useState<('tt' | 'hedonic' | 'descriptive')[]>(['tt', 'hedonic']);
  const [showConfigForm, setShowConfigForm] = useState<boolean>(false);
  const [editingPanelId, setEditingPanelId] = useState<string | null>(null);
  const [panelBrandSearch, setPanelBrandSearch] = useState<string>('');

  // New on-the-fly brand creation states
  const [showAddBrandForm, setShowAddBrandForm] = useState<boolean>(false);
  const [newBrandName, setNewBrandName] = useState<string>('');
  const [newBrandCode, setNewBrandCode] = useState<string>('');
  const [newBrandType, setNewBrandType] = useState<'beer' | 'cider' | 'pro_seltzer' | 'other'>('beer');
  const [newBrandDesc, setNewBrandDesc] = useState<string>('');
  const [newBrandVisual, setNewBrandVisual] = useState<string>('');
  const [newBrandAroma, setNewBrandAroma] = useState<string>('');
  const [newBrandTaste, setNewBrandTaste] = useState<string>('');
  const [newBrandMouthfeel, setNewBrandMouthfeel] = useState<string>('');

  const handleEditPanel = (panel: SensoryPanel) => {
    setPanelName(panel.name);
    setSelectedBrands(panel.activeBrands);
    setSelectedRubrics(panel.rubrics);
    setEditingPanelId(panel.id);
    setShowConfigForm(true);
  };

  const handleQuickAddBrand = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;

    const brandCode = newBrandCode.trim().toUpperCase() || 
      newBrandName.trim().substring(0, 5).toUpperCase().replace(/[^A-Z0-9]/g, '');

    const newBrand: Brand = {
      id: `brand-${Date.now()}`,
      name: newBrandName.trim(),
      type: newBrandType,
      created: new Date().toISOString().split('T')[0],
      brandCode,
      hasBaseline: !!(newBrandVisual || newBrandAroma || newBrandTaste || newBrandMouthfeel),
      visual: newBrandVisual.trim() || 'SRM, foam quantity and standard clarity targets not finalized.',
      aroma: newBrandAroma.trim() || 'Primary aromatics and dry hop components not finalized.',
      taste: newBrandTaste.trim() || 'Flavor balance, sweetness, and bitterness targets not finalized.',
      mouthfeel: newBrandMouthfeel.trim() || 'Body weight, carbonation, and finish targets not finalized.',
      overallDescription: newBrandDesc.trim() || `Newly-introduced ${newBrandType} line.`
    };

    if (onAddBrand) {
      onAddBrand(newBrand);
    }

    // Auto-select the newly added brand for the panel
    setSelectedBrands(prev => [...prev, newBrand.id]);

    // Reset states
    setNewBrandName('');
    setNewBrandCode('');
    setNewBrandType('beer');
    setNewBrandDesc('');
    setNewBrandVisual('');
    setNewBrandAroma('');
    setNewBrandTaste('');
    setNewBrandMouthfeel('');
    setShowAddBrandForm(false);
  };

  const activePanels = panels.filter(p => p.status === 'active');
  const pastPanels = panels.filter(p => p.status === 'completed');

  const handleBrandToggle = (brandId: string) => {
    setSelectedBrands(prev => 
      prev.includes(brandId) ? prev.filter(id => id !== brandId) : [...prev, brandId]
    );
  };

  const handleRubricToggle = (rubric: 'tt' | 'hedonic' | 'descriptive') => {
    setSelectedRubrics(prev => 
      prev.includes(rubric) ? prev.filter(r => r !== rubric) : [...prev, rubric]
    );
  };

  const handleCreatePanel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!panelName) return;
    if (selectedBrands.length === 0) {
      alert('Must select at least one brand for evaluation.');
      return;
    }

    if (editingPanelId) {
      const existingPanel = panels.find(p => p.id === editingPanelId);
      if (existingPanel) {
        onUpdatePanel({
          ...existingPanel,
          name: panelName,
          activeBrands: selectedBrands,
          rubrics: selectedRubrics
        });
      }
    } else {
      const newPanel: SensoryPanel = {
        id: `panel-${Date.now()}`,
        name: panelName,
        date: new Date().toLocaleDateString('en-US'),
        activeBrands: selectedBrands,
        rubrics: selectedRubrics,
        status: 'active'
      };
      onAddPanel(newPanel);
    }
    
    // Reset fields
    setPanelName('');
    setSelectedBrands([]);
    setSelectedRubrics(['tt', 'hedonic']);
    setEditingPanelId(null);
    setShowConfigForm(false);
  };

  return (
    <div className="space-y-6" id="panel_selector_view">
      {/* Header Grid */}
      <div className="flex justify-between items-center bg-slate-950 p-6 rounded-3xl border border-slate-900 shadow-lg">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <Clipboard className="h-5 w-5 text-emerald-400" />
            Panel Configuration Console
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">Assigned daily release panels and scoring parameters</p>
        </div>
        
        {!showConfigForm && (
          <button
            onClick={() => setShowConfigForm(true)}
            className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-sans text-xs px-4 py-2.5 rounded-full transition-colors"
            id="open_create_panel_btn"
          >
            <Plus className="h-4 w-4" /> Set Up Daily Panel
          </button>
        )}
      </div>

      <AnimatePresence>
        {showConfigForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-950 p-6 rounded-3xl border border-emerald-950/40 shadow-xl overflow-hidden"
          >
            <form onSubmit={handleCreatePanel} className="space-y-6" id="create_panel_form">
              <div className="flex justify-between items-center pb-4 border-b border-slate-900/60">
                <h3 className="text-md font-bold text-slate-200">Set Up Daily Sensory Evaluation Panel</h3>
                <button
                  type="button"
                  onClick={() => setShowConfigForm(false)}
                  className="text-slate-500 hover:text-slate-300 text-xs font-mono"
                >
                  Cancel
                </button>
              </div>

              {/* Panel Name */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 uppercase tracking-widest font-mono">Panel Release Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5/27 Daily Hazy &amp; Lager Sensory Release"
                  value={panelName}
                  onChange={(e) => setPanelName(e.target.value)}
                  className="w-full bg-slate-900 text-white border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 outline-none text-sm transition-colors placeholder:text-slate-600"
                  id="panel_name_input"
                />
              </div>

              {/* Rubric parameters */}
              <div className="space-y-2">
                <label className="text-xs text-slate-400 uppercase tracking-widest font-mono block">Assign Required Rubrics</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'tt', name: 'True to Target (Defect)', summary: 'TTT release standard check' },
                    { id: 'hedonic', name: 'Hedonic Assessment (1-9)', summary: 'Overall product enjoyment metrics' },
                    { id: 'descriptive', name: 'Descriptive Attributes', summary: 'Visual, Aroma, Taste scales' }
                  ].map((rub) => {
                    const active = selectedRubrics.includes(rub.id as any);
                    return (
                      <div
                        key={rub.id}
                        onClick={() => handleRubricToggle(rub.id as any)}
                        className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                          active 
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold' 
                            : 'bg-slate-900/40 border-slate-900 text-slate-400 hover:border-slate-800'
                        }`}
                        id={`rubric_toggle_${rub.id}`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-sm">{rub.name}</span>
                          {active && <Check className="h-4 w-4 bg-emerald-500 text-slate-950 rounded-full p-0.5" />}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 font-sans">{rub.summary}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Brands to Evaluate */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-slate-400 uppercase tracking-widest font-mono block">Brands For Boarding</label>
                  <button
                    type="button"
                    onClick={() => setShowAddBrandForm(!showAddBrandForm)}
                    className="text-[10px] font-sans font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-950/40 border border-cyan-500/20 px-2 py-1 rounded"
                  >
                    {showAddBrandForm ? 'Close Add Box' : '+ Register Brand'}
                  </button>
                </div>

                <AnimatePresence>
                  {showAddBrandForm && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -8, height: 0 }}
                      className="p-4 bg-slate-900 rounded-2xl border border-cyan-500/10 space-y-3 overflow-hidden text-left"
                    >
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono text-cyan-400">
                        Create Brand Profile
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-0.5">
                          <label className="text-[9px] text-slate-400 font-mono">Brand Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Thundergazer IPA"
                            value={newBrandName}
                            onChange={(e) => setNewBrandName(e.target.value)}
                            className="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded px-2.5 py-1.5 outline-none focus:border-cyan-500"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[9px] text-slate-400 font-mono">Brand Code</label>
                          <input
                            type="text"
                            placeholder="e.g. TG-IPA"
                            value={newBrandCode}
                            onChange={(e) => setNewBrandCode(e.target.value)}
                            className="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded px-2.5 py-1.5 outline-none focus:border-cyan-500"
                          />
                        </div>
                        <div className="space-y-0.5 sm:col-span-2">
                          <label className="text-[9px] text-slate-400 font-mono">Brand Category</label>
                          <select
                            value={newBrandType}
                            onChange={(e) => setNewBrandType(e.target.value as any)}
                            className="w-full bg-slate-950 text-xs text-slate-300 border border-slate-800 rounded px-2.5 py-1.5 outline-none focus:border-cyan-500"
                          >
                            <option value="beer">Beer - Hop Forward / Malt / Lager</option>
                            <option value="cider">Hard Cider - Apples & Fruits</option>
                            <option value="pro_seltzer">Pro Seltzer - Pure Infusions</option>
                            <option value="other">Other Beverage Concept</option>
                          </select>
                        </div>
                        <div className="space-y-0.5 sm:col-span-2 mt-2">
                          <label className="text-[9px] text-slate-400 font-mono">Overall Brand Description</label>
                          <textarea
                            placeholder="General focus or marketing description..."
                            value={newBrandDesc}
                            onChange={(e) => setNewBrandDesc(e.target.value)}
                            rows={1}
                            className="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded px-2.5 py-1.5 outline-none focus:border-cyan-500 resize-none font-sans"
                          />
                        </div>
                        <div className="space-y-0.5 sm:col-span-2 mt-2">
                          <h5 className="text-[10px] font-bold text-cyan-500 uppercase font-mono tracking-widest border-b border-slate-800 pb-1 mb-2">True-To-Target (TTT) Baselines</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-0.5">
                              <label className="text-[9px] text-slate-400 font-mono">Visual Standard</label>
                              <textarea
                                placeholder="SRM, clarity, foam..."
                                value={newBrandVisual}
                                onChange={(e) => setNewBrandVisual(e.target.value)}
                                rows={2}
                                className="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded px-2.5 py-1.5 outline-none focus:border-cyan-500 resize-none font-sans"
                              />
                            </div>
                            <div className="space-y-0.5">
                              <label className="text-[9px] text-slate-400 font-mono">Aroma Standard</label>
                              <textarea
                                placeholder="Primary aromatics, hops, malt notes..."
                                value={newBrandAroma}
                                onChange={(e) => setNewBrandAroma(e.target.value)}
                                rows={2}
                                className="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded px-2.5 py-1.5 outline-none focus:border-cyan-500 resize-none font-sans"
                              />
                            </div>
                            <div className="space-y-0.5">
                              <label className="text-[9px] text-slate-400 font-mono">Flavor/Taste Standard</label>
                              <textarea
                                placeholder="Bitterness, sweetness, balance..."
                                value={newBrandTaste}
                                onChange={(e) => setNewBrandTaste(e.target.value)}
                                rows={2}
                                className="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded px-2.5 py-1.5 outline-none focus:border-cyan-500 resize-none font-sans"
                              />
                            </div>
                            <div className="space-y-0.5">
                              <label className="text-[9px] text-slate-400 font-mono">Mouthfeel Standard</label>
                              <textarea
                                placeholder="Body weight, carbonation, finish..."
                                value={newBrandMouthfeel}
                                onChange={(e) => setNewBrandMouthfeel(e.target.value)}
                                rows={2}
                                className="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded px-2.5 py-1.5 outline-none focus:border-cyan-500 resize-none font-sans"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={handleQuickAddBrand}
                          disabled={!newBrandName.trim()}
                          className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold font-sans text-[10px] rounded"
                        >
                          Confirm &amp; Add Brand
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-3">
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="Search to add brands to the panel..."
                      value={panelBrandSearch}
                      onChange={(e) => setPanelBrandSearch(e.target.value)}
                      className="w-full bg-slate-950 text-slate-200 border border-slate-900 rounded-xl px-4 py-2 text-xs focus:border-cyan-500 outline-none font-bold"
                    />
                  </div>

                  {/* Selected brands & top suggestions */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {brands
                      .filter(b => !panelBrandSearch || b.name.toLowerCase().includes(panelBrandSearch.toLowerCase()) || b.brandCode?.toLowerCase().includes(panelBrandSearch.toLowerCase()))
                      .sort((a, b) => {
                        const aSel = selectedBrands.includes(a.id);
                        const bSel = selectedBrands.includes(b.id);
                        if (aSel && !bSel) return -1;
                        if (!aSel && bSel) return 1;
                        return 0;
                      })
                      .slice(0, panelBrandSearch ? 20 : Math.max(8, selectedBrands.length + 4))
                      .map((b) => {
                        const selected = selectedBrands.includes(b.id);
                        return (
                          <div
                            key={b.id}
                            onClick={() => handleBrandToggle(b.id)}
                            className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer text-xs truncate transition-all ${
                              selected 
                                ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 font-bold font-sans shadow-lg' 
                                : 'bg-slate-900/40 border-slate-900 text-slate-300 hover:border-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Beer className={`h-3.5 w-3.5 ${selected ? 'text-cyan-400' : 'text-slate-500'}`} />
                              <span className="truncate">{b.name}</span>
                            </div>
                            {selected && <Check className="h-3 w-3 bg-cyan-400 text-slate-950 rounded-full p-0.5 shrink-0" />}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* Submit btn */}
              <div className="pt-4 border-t border-slate-900/60 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfigForm(false)}
                  className="px-5 py-2 hover:bg-slate-900 text-slate-400 rounded-full font-bold font-sans text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-full font-bold font-sans text-xs transition-colors"
                  id="create_panel_submit_btn"
                >
                  Publish Active Panel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Release Panels */}
      <div className="bg-slate-950 p-6 rounded-3xl border border-slate-900/60 shadow-xl space-y-4">
        <h3 className="text-md font-bold text-slate-200">Active Panels in Field (Live Evaluation)</h3>
        
        {activePanels.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/20 rounded-2xl border border-dashed border-slate-900 text-slate-500 text-xs font-mono space-y-2">
            <p>No active sensory releases are currently requested in the field.</p>
            <p className="no-underline text-emerald-400 hover:text-emerald-300 cursor-pointer text-[10px] font-sans" onClick={() => setShowConfigForm(true)}>+ Click here to establish a daily panel</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activePanels.map((p) => {
              const panelAssignedBrands = brands.filter(b => (p.activeBrands || []).includes(b.id));
              return (
                <div key={p.id} className="p-4 bg-slate-900/30 rounded-2xl border border-emerald-950/25 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1.5 flex-1min-w-0">
                    <h4 className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block"></span>
                      {p.name}
                    </h4>
                    <div className="flex flex-wrap gap-2 items-center text-xs">
                      <span className="flex items-center gap-1 text-slate-500 font-mono">
                        <Calendar className="h-3 w-3" /> {p.date}
                      </span>
                      <span className="text-slate-600 font-sans">|</span>
                      <div className="flex gap-1">
                        {(p.rubrics || []).map(rub => (
                          <span key={rub} className="px-1.5 py-0.5 bg-slate-950 rounded border border-slate-800 text-[10px] text-slate-400 font-monouppercase tracking-wider">
                            {rub === 'tt' ? 'True-To-Target' : rub}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {panelAssignedBrands.map(br => (
                        <span key={br.id} className="px-2 py-0.5 bg-cyan-950/50 text-cyan-400 text-[11px] rounded-full border border-cyan-500/20 font-sans">
                          {br.name}
                        </span>
                      ))}
                    </div>
                  </div>

                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleEditPanel(p)}
                        className="p-2 hover:bg-cyan-500/10 text-cyan-400 rounded-full transition-colors border border-transparent hover:border-cyan-500/25"
                        title="Edit Panel"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                      </button>
                      <button
                        onClick={() => onUpdatePanel({ ...p, status: 'completed' })}
                        className="p-2 hover:bg-emerald-500/10 text-emerald-400 rounded-full transition-colors border border-transparent hover:border-emerald-500/25"
                        title="Mark Completed"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onNavigateToTab('panel')}
                        className="flex items-center gap-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold rounded-full transition-all border border-emerald-500/20"
                      >
                        Sample Evaluation <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDeletePanel(p.id)}
                        className="p-2 hover:bg-rose-500/10 text-rose-400 rounded-full transition-colors border border-transparent hover:border-rose-500/25"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Historical Completed Panels */}
      <div className="bg-slate-950 p-6 rounded-3xl border border-slate-900/60 shadow-xl space-y-4">
        <h3 className="text-md font-bold text-slate-400">Past Completed Release Cycles</h3>
        
        {pastPanels.length === 0 ? (
          <p className="text-slate-600 text-xs font-mono italic">No archive panels logged yet.</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {pastPanels.map((p) => (
              <div key={p.id} className="p-3 bg-slate-900/10 rounded-xl border border-slate-900 flex justify-between items-center text-xs">
                <div>
                  <h4 className="font-bold text-slate-300">{p.name}</h4>
                  <p className="text-slate-500 font-mono mt-0.5">{p.date} • {(p.activeBrands || []).length} brands</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Released</span>
                  <span className="h-2 w-2 rounded-full bg-slate-600"></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
