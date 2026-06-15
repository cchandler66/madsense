/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, 
  Settings, 
  Flame, 
  Plus, 
  Check, 
  BookOpen, 
  Vibrate, 
  Moon, 
  Tv, 
  Mail,
  UserPlus
} from 'lucide-react';
import { UserProfile, OffFlavorItem, SensoryEvaluation } from '../types';

interface AdminConsoleProps {
  users: UserProfile[];
  evaluations: SensoryEvaluation[];
  offFlavors: OffFlavorItem[];
  onAddUser: (user: UserProfile) => void;
  onUpdateUser: (user: UserProfile) => void;
  onUpdateOffFlavor: (of: OffFlavorItem) => void;
  onNavigateToTab: (tab: string) => void;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({
  users,
  evaluations,
  offFlavors,
  onAddUser,
  onUpdateUser,
  onUpdateOffFlavor,
  onNavigateToTab
}) => {
  const [newUserEmail, setNewUserEmail] = useState<string>('');
  const [newUserName, setNewUserName] = useState<string>('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'panelist'>('panelist');

  const [activeTab, setActiveTab] = useState<'panelists' | 'offflavors' | 'preferences'>('panelists');
  
  // Local toggle states
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(true);
  const [dailyEmailEnabled, setDailyEmailEnabled] = useState(true);
  const [weeklyEmailEnabled, setWeeklyEmailEnabled] = useState(true);

  // Off Flavor form states
  const [editingOfId, setEditingOfId] = useState<string | null>(null);
  const [ofName, setOfName] = useState('');
  const [ofDescription, setOfDescription] = useState('');
  const [ofCauses, setOfCauses] = useState('');
  const [ofPrevention, setOfPrevention] = useState('');

  const initiateEditOffFlavor = (of: OffFlavorItem | null) => {
    if (of) {
      setEditingOfId(of.id);
      setOfName(of.name);
      setOfDescription(of.sensoryDescription);
      setOfCauses(of.commonCauses);
      setOfPrevention(of.prevention);
    } else {
      setEditingOfId('new');
      setOfName('');
      setOfDescription('');
      setOfCauses('');
      setOfPrevention('');
    }
  };

  const handleSaveOffFlavor = () => {
    if (!ofName.trim()) return;
    const newOf: OffFlavorItem = {
      id: editingOfId === 'new' ? `off-${Date.now()}` : (editingOfId as string),
      name: ofName,
      sensoryDescription: ofDescription,
      commonCauses: ofCauses,
      prevention: ofPrevention
    };
    onUpdateOffFlavor(newOf);
    setEditingOfId(null);
  };

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || !newUserName) return;

    // Get initials
    const initials = newUserName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const newUser: UserProfile = {
      email: newUserEmail,
      name: newUserName,
      avatarInitials: initials,
      role: newUserRole,
      panelistScorecard: {
        panelsCount: 1,
        testsCompletedCount: 1,
        attendanceRate: 1.0
      }
    };

    onAddUser(newUser);
    setNewUserEmail('');
    setNewUserName('');
    alert(`Panelist account for ${newUserName} successfully created.`);
  };

  const combinedUsers = React.useMemo(() => {
    const map = new Map<string, UserProfile & { testsCompletedCount: number; panelsCount: number; attendanceRate: number }>();
    
    users.forEach(u => {
      map.set(u.email, {
        ...u,
        testsCompletedCount: u.panelistScorecard?.testsCompletedCount || 0,
        panelsCount: u.panelistScorecard?.panelsCount || 0,
        attendanceRate: u.panelistScorecard?.attendanceRate || 0
      });
    });

    evaluations.forEach(e => {
      if (!map.has(e.userEmail)) {
        const initials = e.userName 
          ? e.userName.split(' ').map(n=>n[0]).join('').substring(0,2) 
          : e.userEmail.substring(0,2).toUpperCase();
          
        map.set(e.userEmail, {
          email: e.userEmail,
          name: e.userName || e.userEmail.split('@')[0],
          avatarInitials: initials.toUpperCase(),
          role: 'panelist',
          testsCompletedCount: 0,
          panelsCount: 0,
          attendanceRate: 0.5
        });
      }
      
      const u = map.get(e.userEmail)!;
      u.testsCompletedCount++;
    });

    return Array.from(map.values()).sort((a,b) => b.testsCompletedCount - a.testsCompletedCount);
  }, [users, evaluations]);

  return (
    <div className="space-y-6" id="admin_configuration_view">
      {/* Settings Grid Header */}
      <div className="flex flex-col md:flex-row md:items-center p-6 bg-slate-950 rounded-3xl border border-slate-900 shadow-xl justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <Settings className="h-5 w-5 text-emerald-400" />
            Administrative System Control
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">Control panelist profiles, off-flavor references, and mobile haptic settings</p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-900 rounded-full p-1 border border-slate-800">
          {[
            { id: 'panelists', name: 'Panelists', icon: Users },
            { id: 'offflavors', name: 'Off-Flavor DB', icon: Flame },
            { id: 'preferences', name: 'Settings', icon: Moon }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-emerald-500 text-slate-950 shadow-md' 
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tab.name}</span>
            </button>
          ))}
          <button
            onClick={() => onNavigateToTab('config')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all text-slate-400 hover:text-emerald-400`}
          >
            <Settings className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Panel Config &rarr;</span>
          </button>
        </div>
      </div>

      {activeTab === 'panelists' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* List are panelists */}
          <div className="lg:col-span-2 bg-slate-950 p-6 rounded-3xl border border-slate-900/60 shadow-xl space-y-4">
            <h3 className="text-md font-bold text-slate-200">Registered Panelists Scoreboard</h3>
            
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 pr-2 custom-scrollbar">
              {combinedUsers.map(usr => (
                <div key={usr.email} className="p-3 bg-slate-900/40 rounded-2xl border border-slate-900 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-3">
                    <span className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 font-mono font-bold flex items-center justify-center text-slate-300">
                      {usr.avatarInitials}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-200">{usr.name}</h4>
                      <p className="text-slate-500 font-mono text-[10px] mt-0.5">{usr.email}</p>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-3">
                    <select
                      value={usr.role}
                      onChange={(e) => onUpdateUser({...usr, role: e.target.value as 'admin' | 'panelist'})}
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono border appearance-none text-center cursor-pointer outline-none transition-colors ${
                        usr.role === 'admin' 
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-450 text-rose-400 hover:text-rose-300' 
                          : 'bg-slate-950 border-slate-800 text-slate-450 text-slate-400 hover:text-slate-300'
                      }`}
                      title="Update Role"
                    >
                      <option value="admin">ADMIN</option>
                      <option value="panelist">PANELIST</option>
                    </select>
                    
                    <span className="text-slate-500 font-mono text-[11px] hidden sm:inline">
                      {usr.testsCompletedCount} tests logged • {Math.round(usr.attendanceRate * 100)}% attendance
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Panelist Box */}
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-900/60 shadow-xl flex flex-col justify-between">
            <form onSubmit={handleAddUserSubmit} className="space-y-4">
              <h3 className="text-md font-bold text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-900/60">
                <UserPlus className="h-5 w-5 text-emerald-400" />
                Enroll Panelist
              </h3>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Taster Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Charlie Johantges"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full bg-slate-900 text-white border border-slate-850 rounded-xl px-4 py-2.5 outline-none text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Company Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. charlie.johantges@madtree.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full bg-slate-900 text-white border border-slate-850 rounded-xl px-4 py-2.5 outline-none text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Access Privileges</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full bg-slate-900 text-white border border-slate-850 rounded-xl px-4 py-2.5 outline-none text-xs"
                >
                  <option value="panelist">Panelist (Field Taster)</option>
                  <option value="admin">System Admin / Brewmaster</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold font-sans text-xs transition-colors"
                id="add_panelist_submit_btn"
              >
                Enroll New Taster Profile
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'offflavors' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex justify-end">
            <button
              onClick={() => initiateEditOffFlavor(null)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs"
            >
              <Plus className="h-4 w-4" /> Add Off-Flavor
            </button>
          </div>

          {editingOfId && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl mb-6 shadow-xl space-y-4">
              <h3 className="font-bold text-slate-200">{editingOfId === 'new' ? 'New Off-Flavor' : 'Edit Off-Flavor'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Name / Title</label>
                  <input type="text" value={ofName} onChange={e => setOfName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200" placeholder="e.g. Diacetyl" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Sensory Details</label>
                  <textarea value={ofDescription} onChange={e => setOfDescription(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200" placeholder="e.g. Butter, movie theater popcorn..."></textarea>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Common Causes</label>
                  <textarea value={ofCauses} onChange={e => setOfCauses(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200"></textarea>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Prevention</label>
                  <textarea value={ofPrevention} onChange={e => setOfPrevention(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200"></textarea>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditingOfId(null)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold">Cancel</button>
                <button type="button" onClick={handleSaveOffFlavor} className="px-4 py-2 bg-emerald-500 text-slate-950 rounded-lg text-xs font-bold">Save Off-Flavor</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {offFlavors.map(of => (
              <div key={of.id} className="bg-slate-950 p-6 rounded-3xl border border-slate-900 shadow-md space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                    <h4 className="font-bold text-slate-200 flex items-center gap-1.5 text-sm">
                      <Flame className="h-4.5 w-4.5 text-rose-500" />
                      {of.name}
                    </h4>
                    <button onClick={() => initiateEditOffFlavor(of)} className="text-[10px] font-mono text-cyan-500 bg-cyan-500/10 hover:bg-cyan-500/20 px-2 py-1 rounded">EDIT</button>
                  </div>
                  <div className="space-y-2 pt-3 text-xs">
                    <p className="text-slate-400 leading-normal"><span className="text-amber-400 font-mono">Sensory Details: </span>{of.sensoryDescription}</p>
                    <p className="text-slate-400 leading-normal"><span className="text-rose-500 font-mono">Common Causes: </span>{of.commonCauses}</p>
                    <p className="text-slate-400 leading-normal"><span className="text-emerald-400 font-mono">Brewer Prevention: </span>{of.prevention}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'preferences' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
          {/* Email Automations Panel */}
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-900 shadow-xl space-y-6">
            <h3 className="text-md font-bold text-slate-200 flex items-center gap-1.5 pb-2 border-b border-slate-900">
              <Mail className="h-5 w-5 text-cyan-400" />
              Automated Reports
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-900/40 p-4 rounded-2xl border border-slate-900">
                <div>
                  <h4 className="font-bold text-slate-300 text-xs">Daily 7 PM Rollup</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">Email aggregated tasting results from the day to the quality team at 19:00</p>
                </div>
                <div
                  onClick={() => setDailyEmailEnabled(!dailyEmailEnabled)}
                  className={`h-6 w-11 rounded-full p-1 cursor-pointer flex items-center shrink-0 border transition-colors ${dailyEmailEnabled ? 'bg-emerald-500 border-emerald-400 justify-end' : 'bg-slate-800 border-slate-700 justify-start'}`}
                >
                  <span className={`h-4 w-4 rounded-full inline-block ${dailyEmailEnabled ? 'bg-slate-950' : 'bg-slate-400'}`}></span>
                </div>
              </div>

              <div className="flex justify-between items-center bg-slate-900/40 p-4 rounded-2xl border border-slate-900">
                <div>
                  <h4 className="font-bold text-slate-300 text-xs">Weekly Monday Morning Recap</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">Send panel completion stats, control limit flags, and FSF updates at 8:00 AM</p>
                </div>
                <div 
                  onClick={() => setWeeklyEmailEnabled(!weeklyEmailEnabled)}
                  className={`h-6 w-11 rounded-full p-1 cursor-pointer flex items-center shrink-0 border transition-colors ${weeklyEmailEnabled ? 'bg-emerald-500 border-emerald-400 justify-end' : 'bg-slate-800 border-slate-700 justify-start'}`}
                >
                  <span className={`h-4 w-4 rounded-full inline-block ${weeklyEmailEnabled ? 'bg-slate-950' : 'bg-slate-400'}`}></span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-900 shadow-xl space-y-6">
            <h3 className="text-md font-bold text-slate-200 flex items-center gap-1.5 pb-2 border-b border-slate-900">
              <Tv className="h-5 w-5 text-emerald-400" />
              Field Device Configuration
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-900/40 p-4 rounded-2xl border border-slate-900">
                <div>
                  <h4 className="font-bold text-slate-300 text-xs">Simulated Field Haptic Feedback</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">Simulate native Android/iOS vibration profiles inside browser preview evaluations</p>
                </div>
                <div 
                  className={`h-6 w-11 rounded-full p-1 cursor-pointer flex items-center shrink-0 border transition-colors ${hapticsEnabled ? 'bg-emerald-500 border-emerald-400 justify-end' : 'bg-slate-800 border-slate-700 justify-start'}`}
                  id="toggle_haptics_control"
                  onClick={() => setHapticsEnabled(!hapticsEnabled)}
                >
                  <span className={`h-4 w-4 rounded-full inline-block ${hapticsEnabled ? 'bg-slate-950' : 'bg-slate-400'}`}></span>
                </div>
              </div>

              <div className="flex justify-between items-center bg-slate-900/40 p-4 rounded-2xl border border-slate-900">
                <div>
                  <h4 className="font-bold text-slate-300 text-xs">Field Dark-Mode Support</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">Force eye-safe dark forest background specs for field visits during nights</p>
                </div>
                <div 
                  className={`h-6 w-11 rounded-full p-1 cursor-pointer flex items-center shrink-0 border transition-colors ${darkModeEnabled ? 'bg-emerald-500 border-emerald-400 justify-end' : 'bg-slate-800 border-slate-700 justify-start'}`}
                  id="toggle_theme_control"
                  onClick={() => setDarkModeEnabled(!darkModeEnabled)}
                >
                  <span className={`h-4 w-4 rounded-full inline-block ${darkModeEnabled ? 'bg-slate-950' : 'bg-slate-400'}`}></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
