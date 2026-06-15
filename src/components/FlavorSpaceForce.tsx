import React, { useState, useEffect } from 'react';
import { Sparkles, Activity, Plus, Trash2, Download, CheckCircle, ChevronLeft, Database } from 'lucide-react';
import { Brand, SensoryEvaluation } from '../types';

interface FlavorSpaceForceProps {
  userEmail: string;
  userName: string;
  brands?: Brand[]; // For backwards compat with App.tsx signatures
  onLogEvaluation?: (evalItem: SensoryEvaluation) => void;
}

export interface FsfTrialProject {
  id: string;
  name: string;
  attributes: string[]; // custom attributes
  sessions: {
    id: string;
    name: string;
    samples: string[];
  }[];
}

export interface FsfEvaluation {
  id: string;
  projectId: string;
  sessionId: string;
  sampleCode: string;
  userEmail: string;
  preference: number | null; // 1-9
  attributes: Record<string, number>; // 0-7
  notes: string;
}

const DEFAULT_ATTRIBUTES = ['Overall Intensity', 'Sweetness', 'Tartness / Acidity', 'Hop Aroma', 'Malt Character'];

export const FlavorSpaceForce: React.FC<FlavorSpaceForceProps> = ({ userEmail, userName }) => {
  const [viewMode, setViewMode] = useState<'taster' | 'admin'>('taster');
  
  const [projects, setProjects] = useState<FsfTrialProject[]>([]);
  const [evals, setEvals] = useState<FsfEvaluation[]>([]);
  
  // Taster states
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [selectedSample, setSelectedSample] = useState<string>(''); // if non-empty, we are in evaluation mode
  
  // Tasting form states
  const [activePreferences, setActivePreferences] = useState<number | null>(null);
  const [activeAttributes, setActiveAttributes] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<string>('');

  // Admin states
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectAttributes, setNewProjectAttributes] = useState(DEFAULT_ATTRIBUTES.join(', '));
  const [newProjectSessions, setNewProjectSessions] = useState<{name: string, samples: string}[]>([
    { name: 'Day 1', samples: '101, 102, 103, 104, 105' },
    { name: 'Day 2', samples: '201, 202, 203, 204, 205' },
    { name: 'Day 3', samples: '301, 302, 303, 304, 305' },
    { name: 'Day 4', samples: '401, 402, 403, 404, 405' },
  ]);

  useEffect(() => {
    const locProj = localStorage.getItem('fsf_projects');
    const locEvals = localStorage.getItem('fsf_evals');
    if (locProj) setProjects(JSON.parse(locProj));
    if (locEvals) setEvals(JSON.parse(locEvals));
  }, []);

  const saveProjects = (p: FsfTrialProject[]) => {
    setProjects(p);
    localStorage.setItem('fsf_projects', JSON.stringify(p));
  };
  
  const saveEvals = (e: FsfEvaluation[]) => {
    setEvals(e);
    localStorage.setItem('fsf_evals', JSON.stringify(e));
  };

  const handleCreateProject = () => {
    if(!newProjectName.trim()) {
      alert("Please enter a project name.");
      return;
    }
    const attrs = newProjectAttributes.split(',').map(a => a.trim()).filter(a => a !== '');
    if(attrs.length === 0) {
      alert("Please add at least one attribute to evaluate.");
      return;
    }
    const proj: FsfTrialProject = {
      id: `fsf-proj-${Date.now()}`,
      name: newProjectName,
      attributes: attrs,
      sessions: newProjectSessions.map((s, i) => ({
        id: `sess-${i}-${Date.now()}`,
        name: s.name,
        samples: s.samples.split(',').map(ss => ss.trim()).filter(ss => ss !== '')
      }))
    };
    saveProjects([...projects, proj]);
    setShowNewProjectForm(false);
    setNewProjectName('');
  };

  const exportToCsv = (projectId: string) => {
    const pEvals = evals.filter(e => e.projectId === projectId);
    const proj = projects.find(p => p.id === projectId);
    if (!proj || pEvals.length === 0) {
      alert("No data to export for this project.");
      return;
    }
    
    // Header
    const customAttrs = proj.attributes;
    const header = ['ID', 'User Email', 'Session', 'Sample Code', 'Preference (1-9)', ...customAttrs, 'Notes'];
    
    const rows = pEvals.map(ev => {
      const sessionName = proj.sessions.find(s => s.id === ev.sessionId)?.name || ev.sessionId;
      return [
        ev.id,
        ev.userEmail,
        sessionName,
        ev.sampleCode,
        ev.preference?.toString() || '',
        ...customAttrs.map(attr => ev.attributes[attr] !== undefined ? ev.attributes[attr].toString() : ''),
        `"${(ev.notes || '').replace(/"/g, '""')}"`
      ];
    });
    
    const csvContent = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fsf-export-${proj.name.replace(/\s+/g, '-')}.csv`;
    a.click();
  };

  const currentProject = projects.find(p => p.id === selectedProjectId);
  const currentSession = currentProject?.sessions.find(s => s.id === selectedSessionId);

  const startEvaluation = (sampleCode: string) => {
    const existing = evals.find(e => e.projectId === selectedProjectId && e.sessionId === selectedSessionId && e.sampleCode === sampleCode && e.userEmail === userEmail);
    if (existing) {
      setActivePreferences(existing.preference);
      setActiveAttributes(existing.attributes);
      setNotes(existing.notes || '');
    } else {
      setActivePreferences(null);
      const defaultAttrs: Record<string, number> = {};
      currentProject?.attributes.forEach(attr => defaultAttrs[attr] = 4);
      setActiveAttributes(defaultAttrs);
      setNotes('');
    }
    setSelectedSample(sampleCode);
  };

  const submitEvaluation = () => {
    if (activePreferences === null) {
      alert("Please provide a preference rating.");
      return;
    }
    
    const existingIdx = evals.findIndex(e => e.projectId === selectedProjectId && e.sessionId === selectedSessionId && e.sampleCode === selectedSample && e.userEmail === userEmail);
    
    const newEval: FsfEvaluation = {
      id: existingIdx >= 0 ? evals[existingIdx].id : `fsfev-${Date.now()}`,
      projectId: selectedProjectId,
      sessionId: selectedSessionId,
      sampleCode: selectedSample,
      userEmail,
      preference: activePreferences,
      attributes: activeAttributes,
      notes
    };
    
    let newEvals = [...evals];
    if (existingIdx >= 0) {
      newEvals[existingIdx] = newEval;
    } else {
      newEvals.push(newEval);
    }
    
    saveEvals(newEvals);
    setSelectedSample(''); // Go back to sample list
  };

  const getUserEvalForSample = (projectId: string, sessionId: string, sampleCode: string) => {
    return evals.find(e => e.projectId === projectId && e.sessionId === sessionId && e.sampleCode === sampleCode && e.userEmail === userEmail);
  };

  const getActiveThemeForHedonic = (val: number, active: boolean) => {
    if (!active) return 'bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-900 hover:border-slate-700 hover:text-slate-300';
    if (val <= 3) return 'bg-rose-500 text-white border-rose-400 shadow-xl shadow-rose-500/20 scale-110 z-20';
    if (val <= 6) return 'bg-amber-500 text-slate-950 border-amber-400 shadow-xl shadow-amber-500/20 scale-110 z-20';
    if (val <= 8) return 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-xl shadow-emerald-500/20 scale-110 z-20';
    return 'bg-emerald-400 text-slate-950 border-emerald-300 shadow-2xl shadow-emerald-400/40 scale-125 z-30 animate-bounce';
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex justify-between items-center bg-slate-900 p-2 rounded-full border border-slate-800 w-fit">
        <button
          onClick={() => setViewMode('taster')}
          className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${
            viewMode === 'taster' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Taster View
        </button>
        <button
          onClick={() => setViewMode('admin')}
          className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${
            viewMode === 'admin' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Admin Config
        </button>
      </div>

      {viewMode === 'admin' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Database className="h-5 w-5 text-cyan-400" />
              Trial Projects Management
            </h2>
            <button
              onClick={() => setShowNewProjectForm(!showNewProjectForm)}
              className="bg-cyan-500 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> New Trial Project
            </button>
          </div>

          {showNewProjectForm && (
            <div className="bg-slate-900 p-6 rounded-3xl border border-cyan-500/30 space-y-4">
              <h3 className="text-sm font-bold text-slate-200">Create Trial Project</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-mono mb-1 block">Project Name</label>
                  <input
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200"
                    placeholder="e.g. Yeast Trial Delta"
                    value={newProjectName}
                    onChange={e => setNewProjectName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-mono mb-1 block">Attributes to Scale (Comma-separated)</label>
                  <input
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200"
                    placeholder="Overall Intensity, Sweetness, Pine..."
                    value={newProjectAttributes}
                    onChange={e => setNewProjectAttributes(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-mono mb-1 block">Sessions & Samples</label>
                  <div className="space-y-2">
                    {newProjectSessions.map((session, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          className="w-32 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200"
                          placeholder="Session Name"
                          value={session.name}
                          onChange={(e) => {
                            const newSess = [...newProjectSessions];
                            newSess[idx].name = e.target.value;
                            setNewProjectSessions(newSess);
                          }}
                        />
                        <input
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200"
                          placeholder="Samples (comma separated, e.g. 101, 102)"
                          value={session.samples}
                          onChange={(e) => {
                            const newSess = [...newProjectSessions];
                            newSess[idx].samples = e.target.value;
                            setNewProjectSessions(newSess);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setNewProjectSessions([...newProjectSessions, { name: `Day ${newProjectSessions.length + 1}`, samples: '' }])}
                    className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add Session
                  </button>
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleCreateProject}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-6 py-2 rounded-xl text-sm font-bold"
                >
                  Save Project
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {projects.length === 0 ? (
              <div className="p-8 border border-dashed border-slate-800 rounded-3xl text-center text-slate-500">
                No trial projects configured yet.
              </div>
            ) : (
              projects.map(proj => (
                <div key={proj.id} className="bg-slate-950 border border-slate-900 rounded-2xl p-6 shadow-xl flex justify-between items-center">
                  <div>
                    <h4 className="text-lg font-bold text-slate-100">{proj.name}</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {proj.sessions.length} Sessions | {proj.attributes.length} Attributes
                    </p>
                    <p className="text-xs text-slate-500 font-mono mt-1">
                      {evals.filter(e => e.projectId === proj.id).length} results collected
                    </p>
                  </div>
                  <button
                    onClick={() => exportToCsv(proj.id)}
                    className="bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" /> Export CSV
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {viewMode === 'taster' && (
        <div className="space-y-6">
          {!selectedSample ? (
            <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 font-mono uppercase tracking-widest block">Active Trial Project</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => { setSelectedProjectId(e.target.value); setSelectedSessionId(''); }}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2 text-sm text-slate-200 outline-none cursor-pointer"
                  >
                    <option value="">Select Project...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 font-mono uppercase tracking-widest block">Evaluation Session</label>
                  <select
                    value={selectedSessionId}
                    onChange={(e) => setSelectedSessionId(e.target.value)}
                    disabled={!selectedProjectId}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2 text-sm text-slate-200 outline-none disabled:opacity-50 cursor-pointer"
                  >
                    <option value="">Select Session...</option>
                    {currentProject?.sessions.map(s => {
                      const allComplete = s.samples.length > 0 && s.samples.every(sample => getUserEvalForSample(currentProject.id, s.id, sample));
                      return <option key={s.id} value={s.id}>{s.name} {allComplete ? '(Complete)' : ''}</option>;
                    })}
                  </select>
                </div>
              </div>

              {currentProject && currentSession ? (
                <div className="pt-4 border-t border-slate-900/50">
                  <h3 className="text-sm font-bold text-slate-200 mb-4">{currentSession.name} Samples</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {currentSession.samples.map(sample => {
                      const existingEval = getUserEvalForSample(currentProject.id, currentSession.id, sample);
                      const isComplete = !!existingEval;

                      return (
                        <button
                          key={sample}
                          onClick={() => startEvaluation(sample)}
                          className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-4 transition-all relative overflow-hidden group border ${
                            isComplete 
                              ? 'bg-slate-900/50 border-emerald-500/30 hover:border-emerald-500 shadow-inner' 
                              : 'bg-emerald-950/20 border-emerald-500 hover:bg-emerald-900/40 shadow-lg shadow-emerald-500/10'
                          }`}
                        >
                          <span className={`text-2xl font-bold font-mono z-10 ${isComplete ? 'text-slate-300' : 'text-emerald-400'}`}>
                            {sample}
                          </span>
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-2 z-10 font-bold group-hover:text-emerald-400 transition-colors">
                            {isComplete ? 'Edit Eval' : 'Taste'}
                          </span>
                          
                          {/* If complete show large faded score in background */}
                          {isComplete && existingEval?.preference && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                              <span className="text-8xl font-black font-mono text-emerald-400">
                                {existingEval.preference}
                              </span>
                            </div>
                          )}
                          
                          {isComplete && existingEval && (
                            <div className="absolute top-2 right-2">
                              {existingEval.preference && existingEval.preference >= 7 && <Sparkles className="h-4 w-4 text-emerald-400" />}
                              {existingEval.preference && existingEval.preference <= 3 && <Activity className="h-4 w-4 text-rose-500" />}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Completion check */}
                  {currentSession.samples.every(s => getUserEvalForSample(currentProject.id, currentSession.id, s)) && (
                    <div className="mt-8 p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl flex items-center justify-center gap-3 text-emerald-400 animate-fade-in">
                      <CheckCircle className="h-6 w-6" />
                      <span className="font-bold text-sm">All samples for this session successfully evaluated.</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 border-2 border-dashed border-slate-900 rounded-2xl">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-slate-700" />
                  <p>Select both a project and session to begin tasting.</p>
                </div>
              )}
            </div>
          ) : (
            /* EVALUATION VIEW */
            <div className="bg-slate-950 border border-emerald-500/20 rounded-3xl p-6 shadow-2xl animate-in slide-in-from-right-4">
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-900">
                <button
                  onClick={() => setSelectedSample('')}
                  className="p-2 hover:bg-slate-900 rounded-full text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <div>
                  <h2 className="text-2xl font-black text-slate-100 font-mono">CODE: {selectedSample}</h2>
                  <p className="text-slate-400 text-xs">Project: {currentProject?.name} | {currentSession?.name}</p>
                </div>
              </div>

              {/* Hedonic Preference */}
              <div className="mb-8">
                <h3 className="text-md font-bold text-slate-200 mb-3 flex items-center justify-between">
                  <span>1. Overall Preference</span>
                  {activePreferences && <span className="text-xs font-mono bg-emerald-950/30 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30 border-dashed">Score: {activePreferences} / 9</span>}
                </h3>
                <div className="grid grid-cols-9 gap-1 sm:gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(val => (
                    <button
                      key={val}
                      onClick={() => setActivePreferences(val)}
                      className={`h-12 rounded-xl text-sm font-bold font-mono transition-all flex items-center justify-center border ${getActiveThemeForHedonic(val, activePreferences === val)}`}
                    >
                      {val === 9 && activePreferences === val ? '🤯' : val}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-2 px-1">
                  <span>Dislike</span>
                  <span>Neutral</span>
                  <span>Like</span>
                </div>
              </div>

              {/* Attributes (0-7 scale) */}
              <div className="mb-8 p-4 bg-slate-900/50 rounded-2xl border border-slate-900">
                <h3 className="text-md font-bold text-slate-200 mb-4">2. Attribute Intensity</h3>
                <div className="space-y-5">
                  {currentProject?.attributes?.map((attr, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex justify-between items-center text-xs px-1">
                        <span className="font-bold text-slate-300 tracking-wide">{attr}</span>
                        <span className="font-mono font-bold text-cyan-400 text-[10px] tracking-widest uppercase">
                          {activeAttributes[attr]} / 7
                        </span>
                      </div>
                      <div className="flex gap-1 sm:gap-2 w-full select-none">
                        {[0, 1, 2, 3, 4, 5, 6, 7].map(score => {
                          const isActive = activeAttributes[attr] === score;
                          const isTarget = score === 4;
                          return (
                            <button
                              key={score}
                              onClick={() => setActiveAttributes(prev => ({ ...prev, [attr]: score }))}
                              className={`flex-1 h-8 sm:h-10 rounded-lg flex items-center justify-center font-bold font-mono text-xs transition-all border ${
                                isActive 
                                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 scale-105 shadow-md shadow-cyan-500/20 z-10' 
                                  : isTarget
                                    ? 'bg-slate-900 border-cyan-500/30 text-cyan-400 hover:bg-slate-800 hover:border-cyan-500/50'
                                    : 'bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-900 hover:border-slate-700 hover:text-slate-400'
                              }`}
                            >
                              {score}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-slate-200 mb-2">3. Tasting Notes (Optional)</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record distinct aromas, flavors, or off-notes here..."
                  rows={2}
                  className="w-full bg-slate-900 text-slate-200 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-900/50">
                <button
                  onClick={submitEvaluation}
                  className="px-8 py-3 rounded-xl font-bold uppercase tracking-wider text-sm transition-all bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                >
                  <CheckCircle className="h-5 w-5" />
                  Save Reading
                </button>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
};
