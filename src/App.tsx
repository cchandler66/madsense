/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Layers, 
  Beer, 
  Users, 
  Database,
  Compass,
  Clipboard,
  Sliders,
  Settings,
  ShieldCheck,
  TrendingUp,
  GraduationCap,
  BookOpen,
  Sparkles,
  Trophy
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  query,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db, auth, handleFirestoreError } from './firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';

import { Brand, Batch, SensoryPanel, SensoryEvaluation, UserProfile, OffFlavorItem } from './types';
import { 
  INITIAL_BRANDS, 
  INITIAL_BATCHES, 
  INITIAL_EVALUATIONS, 
  INITIAL_USERS,
  INITIAL_OFF_FLAVORS 
} from './data/historicalData';

import { ErrorBoundary } from './components/ErrorBoundary';
import { useSensoryData } from './context/SensoryContext';

const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const PanelManager = lazy(() => import('./components/PanelManager').then(m => ({ default: m.PanelManager })));
const ActivePanel = lazy(() => import('./components/ActivePanel').then(m => ({ default: m.ActivePanel })));
const BatchTracker = lazy(() => import('./components/BatchTracker').then(m => ({ default: m.BatchTracker })));
const DataImporter = lazy(() => import('./components/DataImporter').then(m => ({ default: m.DataImporter })));
const AdminConsole = lazy(() => import('./components/AdminConsole').then(m => ({ default: m.AdminConsole })));
const TrainingPortal = lazy(() => import('./components/TrainingPortal').then(m => ({ default: m.TrainingPortal })));
const FlavorWheelReference = lazy(() => import('./components/FlavorWheelReference').then(m => ({ default: m.FlavorWheelReference })));
const MyProfile = lazy(() => import('./components/MyProfile').then(m => ({ default: m.MyProfile })));
const FlavorSpaceForce = lazy(() => import('./components/FlavorSpaceForce').then(m => ({ default: m.FlavorSpaceForce })));
const Leaderboard = lazy(() => import('./components/Leaderboard').then(m => ({ default: m.Leaderboard })));

const LoadingFallback = () => (
  <div className="w-full h-[60vh] flex flex-col items-center justify-center animate-pulse">
    <div className="h-12 w-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
    <p className="text-emerald-400 font-mono text-xs tracking-widest uppercase">Loading Module...</p>
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [preselectedBatchCode, setPreselectedBatchCode] = useState<string>('');
  
  const {
    user,
    brands,
    batches,
    evaluations,
    users,
    panels,
    offFlavors,
    dbError,
    setDbError,
    popularitySortedBrands,
    handleUpdateBrand,
    handleCreateBrand,
    handleAddPanel,
    handleUpdatePanel,
    handleDeletePanel,
    handleAddUser,
    handleUpdateUser,
    handleUpdateOffFlavor,
    handleLogEvaluation,
    handleImportLegacyData
  } = useSensoryData();

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSelectBatchTrigger = (batchCode: string) => {
    setPreselectedBatchCode(batchCode);
    setActiveTab('batches');
  };

  // Nav Links List
  const navItems = [
    { id: 'dashboard', name: 'Overview', icon: Compass },
    { id: 'leaderboard', name: 'Leaderboard', icon: Trophy },
    { id: 'panel', name: 'Sample Evaluation', icon: Sliders },
    { id: 'doe', name: 'Flavor Space Force', icon: Sparkles },
    { id: 'batches', name: 'Batch Tracker', icon: Layers },
    { id: 'training', name: 'Training Portal', icon: GraduationCap },
    { id: 'wheel', name: 'ASBC Flavor Wheel', icon: BookOpen },
    { id: 'importer', name: 'Legacy Importer', icon: Database },
    { id: 'config', name: 'Panel & Brand Config', icon: Clipboard },
    { id: 'profile', name: 'My Profile', icon: Users },
    { id: 'admin', name: 'Admin Console', icon: Settings }
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full text-center shadow-xl shadow-emerald-500/5">
          <div className="h-16 w-16 bg-emerald-500 rounded-3xl flex items-center justify-center font-bold text-slate-950 text-2xl mx-auto mb-6 shadow-lg shadow-emerald-500/20">
            M
          </div>
          <h1 className="text-2xl font-bold mb-2">MadSense Access</h1>
          <p className="text-slate-400 text-sm mb-8">Authenticate with Google Workspace to enter the secured sensory platform.</p>
          <button onClick={handleLogin} className="w-full bg-slate-100 text-slate-950 font-bold py-3 px-4 rounded-xl flex items-center gap-3 justify-center hover:bg-white transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans selection:bg-emerald-500/20 selection:text-emerald-400 relative">
      
      {/* DB Error Banner */}
      {dbError && (
        <div className="fixed top-4 right-4 z-50 bg-red-950/90 border border-red-800 text-red-200 px-4 py-3 rounded-xl shadow-xl shadow-red-900/10 backdrop-blur-md max-w-sm flex items-start gap-3 transform transition-all animate-in slide-in-from-top-2">
          <div className="mt-0.5"><Database className="h-4 w-4 text-red-400" /></div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-red-300 mb-0.5">Database Error</h4>
            <p className="text-xs text-red-200/80 leading-relaxed">{dbError.message}</p>
            {dbError.count > 1 && (
              <span className="inline-block mt-2 text-[10px] bg-red-900/50 px-2 py-0.5 rounded-full text-red-300 font-mono">
                Repeated {dbError.count} times
              </span>
            )}
          </div>
          <button onClick={() => setDbError(null)} className="text-red-400 hover:text-red-200 shrink-0 p-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      )}

      {/* Responsive Left Navigation Bar (Desktop Drawer) */}
      <aside className="w-full md:w-64 bg-slate-950 border-r border-slate-900/60 flex flex-col justify-between p-6 shrink-0 md:sticky md:top-0 md:h-screen z-10">
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-900">
            <div className="h-10 w-10 bg-emerald-500 rounded-2xl flex items-center justify-center font-bold text-slate-950 text-md shadow-lg shadow-emerald-500/10">
              M
            </div>
            <div>
              <span className="text-[9px] font-mono tracking-widest text-[#ca8a04] uppercase font-bold">MadTree Brewing</span>
              <p className="text-md font-extrabold text-slate-100 tracking-tight leading-none mt-1">MadSense</p>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (item.id !== 'batches') {
                      setPreselectedBatchCode('');
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4.5 py-3 rounded-2xl text-xs font-bold transition-all text-left group ${
                    active 
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10' 
                      : 'text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'
                  }`}
                  id={`nav_tab_${item.id}`}
                >
                  <item.icon className={`h-4.5 w-4.5 shrink-0 ${active ? 'text-slate-950' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer specifications */}
        <div className="hidden md:block pt-6 border-t border-slate-900 text-[10px] text-slate-650 text-slate-500 space-y-2 font-mono">
          <p className="flex items-center gap-1.5 font-sans justify-center bg-slate-900/40 py-2.5 rounded-xl border border-slate-900">
            <ShieldCheck className="h-4 w-4 text-emerald-400" /> Secure Sandbox Verified
          </p>
          <p className="text-center pb-2">© 2026 MadTree. All Rights Reserved.</p>
          <button onClick={() => signOut(auth)} className="w-full py-2 hover:text-rose-400 transition-colors text-center border border-slate-800 rounded-lg hover:border-rose-900">Sign Out</button>
        </div>
      </aside>

      {/* Floating Bottom Navigator for Mobile/Tablet */}
      <div className="md:hidden fixed bottom-3 left-3 right-3 bg-slate-950/80 backdrop-blur-xl border border-slate-900 rounded-3xl p-2 flex justify-around shadow-2xl z-40">
        {navItems.map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (item.id !== 'batches') {
                  setPreselectedBatchCode('');
                }
              }}
              className={`p-3 rounded-2xl transition-all ${
                active ? 'bg-emerald-500 text-slate-950' : 'text-slate-500'
              }`}
              id={`nav_mobile_tab_${item.id}`}
            >
              <item.icon className="h-5 w-5" />
            </button>
          );
        })}
      </div>

      {/* Main viewport canvas */}
      <main className="flex-1 p-6 md:p-10 pb-24 md:pb-10 max-w-7xl mx-auto w-full overflow-hidden">
        
        {/* Active Tab rendering router with micro transitions */}
        <div className="w-full">
          <Suspense fallback={<LoadingFallback />}>
            {activeTab === 'dashboard' && (
              <ErrorBoundary moduleName="Dashboard">
                <Dashboard 
                  onNavigateToTab={setActiveTab}
                  onSelectBatchCode={handleSelectBatchTrigger}
                />
              </ErrorBoundary>
            )}

            {activeTab === 'leaderboard' && (
              <ErrorBoundary moduleName="Leaderboard">
                <Leaderboard 
                  evaluations={evaluations}
                  users={users}
                  brands={popularitySortedBrands}
                />
              </ErrorBoundary>
            )}

            {activeTab === 'panel' && (
              <ErrorBoundary moduleName="Active Panel">
                <ActivePanel 
                  activePanels={panels}
                  brands={popularitySortedBrands}
                  evaluations={evaluations}
                  offFlavors={offFlavors}
                  userEmail={user?.email || 'chandler.cottrell@madtree.com'}
                  userName={user?.displayName || 'Chandler Cottrell'}
                  onLogEvaluation={handleLogEvaluation}
                  onNavigateToTab={setActiveTab}
                />
              </ErrorBoundary>
            )}

            {activeTab === 'doe' && (
              <ErrorBoundary moduleName="Flavor Space Force">
                <FlavorSpaceForce
                  brands={popularitySortedBrands}
                  userEmail={user?.email || 'chandler.cottrell@madtree.com'}
                  userName={user?.displayName || 'Chandler Cottrell'}
                  onLogEvaluation={handleLogEvaluation}
                />
              </ErrorBoundary>
            )}

            {activeTab === 'batches' && (
              <ErrorBoundary moduleName="Batch Tracker">
                <BatchTracker 
                  batches={batches}
                  evaluations={evaluations}
                  brands={popularitySortedBrands}
                  preselectedBatchCode={preselectedBatchCode}
                  onClearPreselectedBatch={() => setPreselectedBatchCode('')}
                />
              </ErrorBoundary>
            )}

            {activeTab === 'profile' && (
              <ErrorBoundary moduleName="My Profile">
                <MyProfile 
                  userEmail={user?.email || 'chandler.cottrell@madtree.com'}
                  userName={user?.displayName || 'Chandler Cottrell'}
                  users={users}
                  evaluations={evaluations}
                />
              </ErrorBoundary>
            )}

            {activeTab === 'training' && (
              <ErrorBoundary moduleName="Training Portal">
                <TrainingPortal 
                  batches={batches}
                  evaluations={evaluations}
                  users={users}
                  offFlavors={offFlavors}
                  onAddPanel={handleAddPanel}
                />
              </ErrorBoundary>
            )}

            {activeTab === 'wheel' && (
              <ErrorBoundary moduleName="Flavor Wheel">
                <FlavorWheelReference />
              </ErrorBoundary>
            )}

            {activeTab === 'importer' && (
              <ErrorBoundary moduleName="Legacy Importer">
                <DataImporter 
                  onImportData={handleImportLegacyData}
                  onNavigateToTab={setActiveTab}
                />
              </ErrorBoundary>
            )}

            {activeTab === 'config' && (
              <ErrorBoundary moduleName="Panel & Brand Config">
                <PanelManager 
                  brands={popularitySortedBrands}
                  panels={panels}
                  users={users}
                  onAddPanel={handleAddPanel}
                  onUpdatePanel={handleUpdatePanel}
                  onDeletePanel={handleDeletePanel}
                  onNavigateToTab={setActiveTab}
                  onAddBrand={handleCreateBrand}
                />
              </ErrorBoundary>
            )}

            {activeTab === 'admin' && (
              <ErrorBoundary moduleName="Admin Console">
                <AdminConsole 
                  users={users}
                  evaluations={evaluations}
                  offFlavors={offFlavors}
                  onAddUser={handleAddUser}
                  onUpdateUser={handleUpdateUser}
                  onUpdateOffFlavor={handleUpdateOffFlavor}
                  onNavigateToTab={setActiveTab}
                />
              </ErrorBoundary>
            )}
          </Suspense>
        </div>

      </main>
    </div>
  );
}
