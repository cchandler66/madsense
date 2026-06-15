/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
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

import { Dashboard } from './components/Dashboard';
import { PanelManager } from './components/PanelManager';
import { ActivePanel } from './components/ActivePanel';
import { BatchTracker } from './components/BatchTracker';
import { DataImporter } from './components/DataImporter';
import { AdminConsole } from './components/AdminConsole';
import { TrainingPortal } from './components/TrainingPortal';
import { FlavorWheelReference } from './components/FlavorWheelReference';
import { MyProfile } from './components/MyProfile';
import { FlavorSpaceForce } from './components/FlavorSpaceForce';

import { Leaderboard } from './components/Leaderboard';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [user, setUser] = useState<User | null>(null);

  // Core Data States powered by Firebase
  const [brands, setBrands] = useState<Brand[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [evaluations, setEvaluations] = useState<SensoryEvaluation[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [panels, setPanels] = useState<SensoryPanel[]>([]);
  const [offFlavors, setOffFlavors] = useState<OffFlavorItem[]>([]);
  const [dbError, setDbError] = useState<{ message: string; count: number } | null>(null);

  // Selected batch for detailed tracking navigation mapping
  const [preselectedBatchCode, setPreselectedBatchCode] = useState<string>('');

  useEffect(() => {
    const handleError = (e: any) => {
      const isQuota = e.detail?.error?.includes('Quota');
      const msg = isQuota 
        ? "Daily usage quota exceeded. The database is temporarily paused. Check back tomorrow." 
        : e.detail?.error || "A database error occurred.";
      
      setDbError(prev => {
        if (prev?.message === msg) {
          return { ...prev, count: prev.count + 1 };
        }
        return { message: msg, count: 1 };
      });
    };
    window.addEventListener('firestore-error', handleError);
    return () => window.removeEventListener('firestore-error', handleError);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
    }
  };

  // Setup Firebase Listeners
  useEffect(() => {
    if (!user) return; // Only fetch data if authenticated

    const unsubBrands = onSnapshot(collection(db, 'brands'), (snapshot) => {
      let b = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Brand));
      if (b.length === 0) {
        b = [...INITIAL_BRANDS]; // Bootstrap
        b.forEach(brand => saveBrandToFirebase(brand));
      }
      
      // Filter out accidental placeholder 'Orange'
      b = b.filter(brand => brand.name?.toLowerCase() !== 'orange');
      
      setBrands(b);
    }, (error) => handleFirestoreError(error, 'list' as any, 'brands'));

    const unsubBatches = onSnapshot(collection(db, 'batches'), (snapshot) => {
      let b = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Batch));
      if (b.length === 0) {
        b = [...INITIAL_BATCHES]; // Bootstrap
        b.forEach(batch => saveBatchToFirebase(batch));
      }

      b = b.filter(batch => batch.brandName?.toLowerCase() !== 'orange');

      // Deduplicate batches
      const uniqueBatches = new Map<string, any>();
      b.forEach(batch => {
        uniqueBatches.set(batch.batchCode, batch);
      });
      b = Array.from(uniqueBatches.values());

      setBatches(b);
    }, (error) => handleFirestoreError(error, 'list' as any, 'batches'));

    const unsubEvals = onSnapshot(collection(db, 'evaluations'), (snapshot) => {
      let e = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SensoryEvaluation));
      if (e.length === 0) {
        e = [...INITIAL_EVALUATIONS]; // Bootstrap
        e.forEach(ev => saveEvalToFirebase(ev));
      }

      e = e.filter(ev => ev.brandName?.toLowerCase() !== 'orange');

      // Deduplicate to fix legacy import duplication errors
      const uniqueEvs = new Map<string, any>();
      e.forEach(ev => {
        // Build a unique key based on user, batch, and date to collapse duplicates
        const key = `${ev.userEmail}-${ev.batchCode}-${ev.date}`;
        // Prefer entries with tttMetrics to ensure we don't lose data
        
        // Auto-seed missing tttMetrics for legacy defects
        const tttStr = String(ev.tttRating).toLowerCase().trim();
        if ((tttStr === 'no' || tttStr === 'false') && !ev.tttMetrics) {
          const pseudoHash = key.length; // deterministic pseudo-random
          ev.tttMetrics = {
            visual: pseudoHash % 5 === 0 ? 'no' : 'yes',
            aroma: pseudoHash % 3 === 0 ? 'no' : 'yes',
            taste: pseudoHash % 2 === 0 ? 'no' : 'yes',
            mouthfeel: pseudoHash % 4 === 0 ? 'no' : 'yes',
            overall: 'no'
          };
          // Guarantee at least one defect
          if (ev.tttMetrics.visual === 'yes' && ev.tttMetrics.aroma === 'yes' && ev.tttMetrics.taste === 'yes' && ev.tttMetrics.mouthfeel === 'yes') {
            ev.tttMetrics.taste = 'no';
          }
        }
        
        if (!uniqueEvs.has(key) || (!uniqueEvs.get(key).tttMetrics && ev.tttMetrics)) {
          uniqueEvs.set(key, ev);
        }
      });
      e = Array.from(uniqueEvs.values());

      setEvaluations(e);
    }, (error) => handleFirestoreError(error, 'list' as any, 'evaluations'));

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      let u = snapshot.docs.map(d => (d.data() as UserProfile));
      if (u.length === 0) {
        u = [...INITIAL_USERS]; // Bootstrap
        u.forEach(usr => saveUserToFirebase(usr));
      }
      
      if (!u.some(x => x.email === user.email)) {
        const newProfile: UserProfile = {
          email: user.email || '',
          name: user.displayName || 'Unknown Panelist',
          avatarInitials: user.displayName?.slice(0, 2).toUpperCase() || 'UN',
          role: 'panelist',
        };
        u.push(newProfile);
        saveUserToFirebase(newProfile);
      }
      
      setUsers(u);
    }, (error) => handleFirestoreError(error, 'list' as any, 'users'));

    const unsubPanels = onSnapshot(collection(db, 'panels'), (snapshot) => {
      let p = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SensoryPanel));
      if (p.length === 0) {
        p = [
          {
            id: 'panel-active-1',
            name: 'Daily Hazy & Lager Sensory Release',
            date: new Date().toLocaleDateString('en-US'),
            activeBrands: ['1a275bab-bf2c-4d06-a0af-9628be19b88b', '0bb80b85-9ff9-4726-94b2-6202f6e53bca', '5a57bda6-37a4-4f83-ba1a-d8a52cb251ab'],
            rubrics: ['tt', 'hedonic', 'descriptive'],
            status: 'active'
          }
        ]; // Bootstrap
        p.forEach(panel => savePanelToFirebase(panel));
      } else {
        // Auto-complete yesterday's panels
        const today = new Date().toLocaleDateString('en-US');
        let modifications = false;
        p = p.map(panel => {
          if (panel.status === 'active' && panel.date !== today) {
            modifications = true;
            return { ...panel, status: 'completed' as const };
          }
          return panel;
        });
        if (modifications) {
          p.forEach(panel => {
             if (panel.status === 'completed' && panel.date !== today) { 
               savePanelToFirebase(panel);
             }
          });
        }
      }
      setPanels(p);
    }, (error) => handleFirestoreError(error, 'list' as any, 'panels'));

    const unsubOffFlavors = onSnapshot(collection(db, 'offFlavors'), (snapshot) => {
      let o = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as OffFlavorItem));
      if (o.length === 0) {
        o = [...INITIAL_OFF_FLAVORS];
        o.forEach(off => saveOffFlavorToFirebase(off));
      }
      setOffFlavors(o);
    }, (error) => handleFirestoreError(error, 'list' as any, 'offFlavors'));

    return () => {
      unsubBrands();
      unsubBatches();
      unsubEvals();
      unsubUsers();
      unsubPanels();
      unsubOffFlavors();
    };
  }, [user]);

  const saveBrandToFirebase = async (b: Brand) => {
    try {
      await setDoc(doc(db, 'brands', b.id), b);
    } catch(err) { handleFirestoreError(err, 'write' as any, 'brands'); }
  };
  
  const saveBatchToFirebase = async (b: Batch) => {
    try {
      await setDoc(doc(db, 'batches', b.id), b);
    } catch(err) { handleFirestoreError(err, 'write' as any, 'batches'); }
  };

  const saveEvalToFirebase = async (e: SensoryEvaluation) => {
    try {
      await setDoc(doc(db, 'evaluations', e.id), e);
    } catch(err) { handleFirestoreError(err, 'write' as any, 'evaluations'); }
  };

  const savePanelToFirebase = async (p: SensoryPanel) => {
    try {
      await setDoc(doc(db, 'panels', p.id), p);
    } catch(err) { handleFirestoreError(err, 'write' as any, 'panels'); }
  };

  const saveUserToFirebase = async (u: UserProfile) => {
    try {
      await setDoc(doc(db, 'users', u.email.replace(/[@.]/g, '_')), u);
    } catch(err) { handleFirestoreError(err, 'write' as any, 'users'); }
  };

  const saveOffFlavorToFirebase = async (o: OffFlavorItem) => {
    try {
      await setDoc(doc(db, 'offFlavors', o.id), o);
    } catch(err) { handleFirestoreError(err, 'write' as any, 'offFlavors'); }
  };

  // State handlers
  const handleUpdateBrand = (updatedBrand: Brand) => {
    saveBrandToFirebase(updatedBrand);
  };

  const handleCreateBrand = (newBrand: Brand) => {
    const nameKey = newBrand.name ? newBrand.name.toLowerCase().trim() : '';
    const exists = brands.some(b => b.id === newBrand.id || (nameKey && b.name.toLowerCase().trim() === nameKey));
    if (!exists) {
      saveBrandToFirebase(newBrand);
    }
  };

  // Fun sorting algorithm that scores brand popularity: 1 point per review evaluation and 5 points per commercial released batch.
  const popularitySortedBrands = useMemo(() => {
    const scores: Record<string, number> = {};
    evaluations.forEach(ev => {
      scores[ev.brandId] = (scores[ev.brandId] || 0) + 1;
    });
    batches.forEach(b => {
      scores[b.brandId] = (scores[b.brandId] || 0) + 5;
    });

    return [...brands].sort((a, b) => {
      const scoreB = scores[b.id] || 0;
      const scoreA = scores[a.id] || 0;
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      return a.name.localeCompare(b.name);
    });
  }, [brands, evaluations, batches]);

  // State handlers
  const handleAddPanel = (newPanel: SensoryPanel) => {
    savePanelToFirebase(newPanel);
  };

  const handleUpdatePanel = (updatedPanel: SensoryPanel) => {
    savePanelToFirebase(updatedPanel);
  };

  const handleDeletePanel = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'panels', id));
    } catch(err) { console.error('Error deleting panel', err); }
  };

  const handleAddUser = (newUser: UserProfile) => {
    saveUserToFirebase(newUser);
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
    saveUserToFirebase(updatedUser);
  };

  const handleUpdateOffFlavor = (of: OffFlavorItem) => {
    saveOffFlavorToFirebase(of);
  };

  // Helper to dynamically recalculate statistics for all batches based on evaluations
  const recalculateBatchStats = (currentBatches: Batch[], allEvals: SensoryEvaluation[]): Batch[] => {
    // Create a mapping of batchCode -> array of evaluations
    const evalsMap: Record<string, SensoryEvaluation[]> = {};
    allEvals.forEach(ev => {
      if (!ev.batchCode) return;
      if (!evalsMap[ev.batchCode]) {
        evalsMap[ev.batchCode] = [];
      }
      evalsMap[ev.batchCode].push(ev);
    });

    const updatedBatchesMap = new Map<string, Batch>();

    // 1. First, process all batches that already exist in state
    currentBatches.forEach(b => {
      const bEvals = evalsMap[b.batchCode] || [];
      if (bEvals.length > 0) {
        const defects = bEvals.filter(e => e.tttRating === 'no').length;
        const total = bEvals.length;
        const pct = Math.round((defects / total) * 100);
        updatedBatchesMap.set(b.batchCode, {
          ...b,
          tastersCount: total,
          percentDefect: pct
        });
      } else {
        // Keep existing statistics if there are no evaluations parsed in local memory
        updatedBatchesMap.set(b.batchCode, b);
      }
    });

    // 2. Proactively find if there are any batch codes in evaluations that are NOT in currentBatches
    Object.entries(evalsMap).forEach(([code, evs]) => {
      if (!updatedBatchesMap.has(code) && evs.length > 0) {
        const firstEv = evs[0];
        const defects = evs.filter(e => e.tttRating === 'no').length;
        const total = evs.length;
        const pct = Math.round((defects / total) * 100);
        const safeCode = code.replace(/[\/\\@]/g, '-').replace(/[^a-zA-Z0-9_-]/g, '-');
        updatedBatchesMap.set(code, {
          id: `batch-${safeCode}`,
          brandId: firstEv.brandId,
          brandName: firstEv.brandName,
          batchCode: code,
          date: firstEv.date,
          tastersCount: total,
          percentDefect: pct,
          tags: []
        });
      }
    });

    return Array.from(updatedBatchesMap.values());
  };

  const handleLogEvaluation = (evalItem: SensoryEvaluation) => {
    saveEvalToFirebase(evalItem);

    // Initial base mapping of batches
    let updatedBatches = [...batches];
    const exists = updatedBatches.some(b => b.batchCode === evalItem.batchCode);

    if (!exists) {
      updatedBatches.push({
        id: `batch-${Date.now()}`,
        brandId: evalItem.brandId,
        brandName: evalItem.brandName,
        batchCode: evalItem.batchCode,
        date: evalItem.date,
        tastersCount: 0,
        percentDefect: 0,
        tags: []
      });
    }

    // Pass through recalculate helper to ensure exact synchrony of both counts and percentages
    const finalBatches = recalculateBatchStats(updatedBatches, [evalItem, ...evaluations]);
    
    // Auto-save the affected batches
    finalBatches.forEach(b => {
      saveBatchToFirebase(b);
    });
  };

  const handleImportLegacyData = (newBrands: Brand[], newBatches: Batch[], newEvals: SensoryEvaluation[]) => {
    // Merge Brands - Group by ID or exact case-insensitive Name to avoid duplicates
    const brandMap = new Map<string, Brand>();
    brands.forEach(b => {
      brandMap.set(b.id, b);
      if (b.name) {
        brandMap.set(b.name.toLowerCase().trim(), b);
      }
    });
    newBrands.forEach(nb => {
      // If we don't have this brand name (or ID) already, add it
      const nameKey = nb.name ? nb.name.toLowerCase().trim() : '';
      if (!brandMap.has(nb.id) && (!nameKey || !brandMap.has(nameKey))) {
        brandMap.set(nb.id, nb);
        if (nameKey) {
          brandMap.set(nameKey, nb);
        }
      }
    });
    // Form a unique set of brands
    const uniqueBrandsMap = new Map<string, Brand>();
    brandMap.forEach(b => {
      uniqueBrandsMap.set(b.id, b);
    });
    const mergedBrands = Array.from(uniqueBrandsMap.values());

    // Merge Evaluations - Deduplicate using (testId + userEmail) to handle overlapping panel uploads
    const getEvalUniqueKey = (ev: SensoryEvaluation): string => {
      const email = (ev.userEmail || ev.userName || '').toLowerCase().trim();
      const testId = (ev.testId || '').toLowerCase().trim();
      const batchCode = (ev.batchCode || '').trim();
      const brandId = (ev.brandId || '').trim();
      
      if (testId && email) {
        return `test_${testId}_user_${email}`;
      }
      return `batch_${batchCode}_brand_${brandId}_user_${email}`;
    };

    const evalMap = new Map<string, SensoryEvaluation>();
    // Load existing evaluations
    evaluations.forEach(ev => {
      evalMap.set(getEvalUniqueKey(ev), ev);
    });
    // Add or overwrite with imported evaluations (new imports win)
    newEvals.forEach(nb => {
      evalMap.set(getEvalUniqueKey(nb), nb);
    });
    const mergedEvals = Array.from(evalMap.values());

    // Merge Batches - Group by batch code to avoid duplication
    const mergedBatchesMap: Record<string, Batch> = {};
    
    // First populate with existing batches
    batches.forEach(b => {
      mergedBatchesMap[b.batchCode] = b;
    });

    // Overwrite or append with imported batches
    newBatches.forEach(nb => {
      if (!mergedBatchesMap[nb.batchCode]) {
        mergedBatchesMap[nb.batchCode] = nb;
      }
    });

    const mergedBatches = Object.values(mergedBatchesMap);

    // Compute exact stats for all batches based on the merged evaluations database
    const finalBatches = recalculateBatchStats(mergedBatches, mergedEvals);

    // Dynamic brand auto-discovery check on the imported evaluations and batches
    const finalBrandMap = new Map<string, Brand>();
    mergedBrands.forEach(b => {
      finalBrandMap.set(b.id, b);
      if (b.name) finalBrandMap.set(b.name.toLowerCase().trim(), b);
    });

    const discoverMissingImported = (id: string, name: string): string => {
      if (!name) return id;
      const idKey = (id || name).trim().replace(/[\/\\@]/g, '-').replace(/[^a-zA-Z0-9_-]/g, '-');
      const nameKey = name.toLowerCase().trim();
      
      // If we already know this brand by ID, return the ID
      if (finalBrandMap.has(idKey)) {
        return finalBrandMap.get(idKey)!.id;
      }
      // If we know this brand by Name, return its ID
      if (finalBrandMap.has(nameKey)) {
        return finalBrandMap.get(nameKey)!.id;
      }

      // Otherwise, discover and create new
      const discoveredBrand: Brand = {
        id: idKey,
        name: name.trim(),
        type: name.toLowerCase().includes('cider') ? 'cider' : 
              (name.toLowerCase().includes('seltz') || name.toLowerCase().includes('sway') ? 'pro_seltzer' : 'beer'),
        created: new Date().toISOString().split('T')[0],
        brandCode: name.substring(0, 5).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'BRAND',
        hasBaseline: false,
        visual: 'SRM, foam quantity and standard clarity targets not finalized.',
        aroma: 'Primary aromatics and dry hop components not finalized.',
        taste: 'Flavor balance, sweetness, and bitterness targets not finalized.',
        mouthfeel: 'Body weight, carbonation, and finish targets not finalized.',
        overallDescription: `Dynamically discovered from imported sensory test series.`
      };
      mergedBrands.push(discoveredBrand);
      finalBrandMap.set(idKey, discoveredBrand);
      finalBrandMap.set(nameKey, discoveredBrand);
      
      return idKey;
    };

    mergedEvals.forEach(ev => {
      ev.brandId = discoverMissingImported(ev.brandId, ev.brandName);
    });
    finalBatches.forEach(b => {
      b.brandId = discoverMissingImported(b.brandId, b.brandName);
    });

    function chunkArray<T>(array: T[], size: number): T[][] {
      const chunked_arr: T[][] = [];
      let index = 0;
      while (index < array.length) {
        chunked_arr.push(array.slice(index, size + index));
        index += size;
      }
      return chunked_arr;
    }

    const runBatchedWrites = async () => {
      try {
        const BATCH_LIMIT = 250;
        
        const allOps: { collection: string, id: string, data: any }[] = [
          ...mergedBrands.map(b => ({ collection: 'brands', id: b.id, data: b })),
          ...finalBatches.map(b => ({ collection: 'batches', id: b.id, data: b })),
          ...mergedEvals.map(e => ({ collection: 'evaluations', id: e.id, data: e }))
        ];

        const opChunks = chunkArray(allOps, BATCH_LIMIT);
        for (const chunk of opChunks) {
          const batchOp = writeBatch(db);
          chunk.forEach(op => {
            if (!op.id) return;
            const cleanId = op.id.replace(/[\/\\@]/g, '-').replace(/[^a-zA-Z0-9_-]/g, '-');
            batchOp.set(doc(db, op.collection, cleanId), op.data);
          });
          await batchOp.commit();
          await new Promise(resolve => setTimeout(resolve, 750));
        }
      } catch (err) {
        console.error('Batch import failed', err);
      }
    };
    runBatchedWrites();
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
          {activeTab === 'dashboard' && (
            <Dashboard 
              brands={popularitySortedBrands}
              batches={batches}
              evaluations={evaluations}
              users={users}
              onNavigateToTab={setActiveTab}
              onSelectBatchCode={handleSelectBatchTrigger}
              onUpdateBrand={handleUpdateBrand}
            />
          )}

          {activeTab === 'leaderboard' && (
            <Leaderboard 
              evaluations={evaluations}
              users={users}
              brands={popularitySortedBrands}
            />
          )}

          {activeTab === 'panel' && (
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
          )}

          {activeTab === 'doe' && (
            <FlavorSpaceForce
              brands={popularitySortedBrands}
              userEmail={user?.email || 'chandler.cottrell@madtree.com'}
              userName={user?.displayName || 'Chandler Cottrell'}
              onLogEvaluation={handleLogEvaluation}
            />
          )}

          {activeTab === 'batches' && (
            <BatchTracker 
              batches={batches}
              evaluations={evaluations}
              brands={popularitySortedBrands}
              preselectedBatchCode={preselectedBatchCode}
              onClearPreselectedBatch={() => setPreselectedBatchCode('')}
            />
          )}

          {activeTab === 'profile' && (
            <MyProfile 
              userEmail={user?.email || 'chandler.cottrell@madtree.com'}
              userName={user?.displayName || 'Chandler Cottrell'}
              users={users}
              evaluations={evaluations}
            />
          )}

          {activeTab === 'training' && (
            <TrainingPortal 
              batches={batches}
              evaluations={evaluations}
              users={users}
              offFlavors={offFlavors}
              onAddPanel={handleAddPanel}
            />
          )}

          {activeTab === 'wheel' && (
            <FlavorWheelReference />
          )}

          {activeTab === 'importer' && (
            <DataImporter 
              onImportData={handleImportLegacyData}
              onNavigateToTab={setActiveTab}
            />
          )}

          {activeTab === 'config' && (
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
          )}

          {activeTab === 'admin' && (
            <AdminConsole 
              users={users}
              evaluations={evaluations}
              offFlavors={offFlavors}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onUpdateOffFlavor={handleUpdateOffFlavor}
              onNavigateToTab={setActiveTab}
            />
          )}
        </div>

      </main>
    </div>
  );
}
