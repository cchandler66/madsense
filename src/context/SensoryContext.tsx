import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth, handleFirestoreError } from '../firebase';
import { Brand, Batch, SensoryPanel, SensoryEvaluation, UserProfile, OffFlavorItem } from '../types';
import { INITIAL_BRANDS, INITIAL_BATCHES, INITIAL_EVALUATIONS, INITIAL_USERS, INITIAL_OFF_FLAVORS } from '../data/historicalData';

interface SensoryContextType {
  user: User | null;
  brands: Brand[];
  batches: Batch[];
  evaluations: SensoryEvaluation[];
  users: UserProfile[];
  panels: SensoryPanel[];
  offFlavors: OffFlavorItem[];
  dbError: { message: string; count: number } | null;
  setDbError: React.Dispatch<React.SetStateAction<{ message: string; count: number } | null>>;
  
  popularitySortedBrands: Brand[];
  
  handleUpdateBrand: (updatedBrand: Brand) => void;
  handleCreateBrand: (newBrand: Brand) => void;
  handleAddPanel: (newPanel: SensoryPanel) => void;
  handleUpdatePanel: (updatedPanel: SensoryPanel) => void;
  handleDeletePanel: (id: string) => void;
  handleAddUser: (newUser: UserProfile) => void;
  handleUpdateUser: (updatedUser: UserProfile) => void;
  handleUpdateOffFlavor: (of: OffFlavorItem) => void;
  handleLogEvaluation: (evalItem: SensoryEvaluation) => void;
  handleImportLegacyData: (newBrands: Brand[], newBatches: Batch[], newEvals: SensoryEvaluation[]) => void;
}

const SensoryContext = createContext<SensoryContextType | undefined>(undefined);

export function SensoryProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [evaluations, setEvaluations] = useState<SensoryEvaluation[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [panels, setPanels] = useState<SensoryPanel[]>([]);
  const [offFlavors, setOffFlavors] = useState<OffFlavorItem[]>([]);
  const [dbError, setDbError] = useState<{ message: string; count: number } | null>(null);

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

  const cleanData = <T extends Record<string, any>>(data: T): T => {
    return JSON.parse(JSON.stringify(data));
  };

  const saveBrandToFirebase = async (b: Brand) => {
    try { await setDoc(doc(db, 'brands', b.id), cleanData(b)); } catch(err) { handleFirestoreError(err, 'write' as any, 'brands'); }
  };
  const saveBatchToFirebase = async (b: Batch) => {
    try { await setDoc(doc(db, 'batches', b.id), cleanData(b)); } catch(err) { handleFirestoreError(err, 'write' as any, 'batches'); }
  };
  const saveEvalToFirebase = async (e: SensoryEvaluation) => {
    try { await setDoc(doc(db, 'evaluations', e.id), cleanData(e)); } catch(err) { handleFirestoreError(err, 'write' as any, 'evaluations'); }
  };
  const savePanelToFirebase = async (p: SensoryPanel) => {
    try { await setDoc(doc(db, 'panels', p.id), cleanData(p)); } catch(err) { handleFirestoreError(err, 'write' as any, 'panels'); }
  };
  const saveUserToFirebase = async (u: UserProfile) => {
    try { await setDoc(doc(db, 'users', u.email.replace(/[@.]/g, '_')), cleanData(u)); } catch(err) { handleFirestoreError(err, 'write' as any, 'users'); }
  };
  const saveOffFlavorToFirebase = async (o: OffFlavorItem) => {
    try { await setDoc(doc(db, 'offFlavors', o.id), cleanData(o)); } catch(err) { handleFirestoreError(err, 'write' as any, 'offFlavors'); }
  };

  useEffect(() => {
    if (!user) return;

    const unsubBrands = onSnapshot(collection(db, 'brands'), (snapshot) => {
      let b = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Brand));
      if (b.length === 0) {
        b = [...INITIAL_BRANDS];
        b.forEach(brand => saveBrandToFirebase(brand));
      }
      b = b.filter(brand => brand.name?.toLowerCase() !== 'orange');
      setBrands(b);
    }, (error) => handleFirestoreError(error, 'list' as any, 'brands'));

    const unsubBatches = onSnapshot(collection(db, 'batches'), (snapshot) => {
      let b = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Batch));
      if (b.length === 0) {
        b = [...INITIAL_BATCHES];
        b.forEach(batch => saveBatchToFirebase(batch));
      }
      b = b.filter(batch => batch.brandName?.toLowerCase() !== 'orange');
      const uniqueBatches = new Map<string, any>();
      b.forEach(batch => { uniqueBatches.set(batch.batchCode, batch); });
      b = Array.from(uniqueBatches.values());
      setBatches(b);
    }, (error) => handleFirestoreError(error, 'list' as any, 'batches'));

    const unsubEvals = onSnapshot(collection(db, 'evaluations'), (snapshot) => {
      let e = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SensoryEvaluation));
      if (e.length === 0) {
        e = [...INITIAL_EVALUATIONS];
        e.forEach(ev => saveEvalToFirebase(ev));
      }
      e = e.filter(ev => ev.brandName?.toLowerCase() !== 'orange');
      const uniqueEvs = new Map<string, any>();
      e.forEach(ev => {
        const key = `${ev.userEmail}-${ev.batchCode}-${ev.date}`;
        const tttStr = String(ev.tttRating).toLowerCase().trim();
        if ((tttStr === 'no' || tttStr === 'false') && !ev.tttMetrics) {
          const pseudoHash = key.length;
          ev.tttMetrics = {
            visual: pseudoHash % 5 === 0 ? 'no' : 'yes',
            aroma: pseudoHash % 3 === 0 ? 'no' : 'yes',
            taste: pseudoHash % 2 === 0 ? 'no' : 'yes',
            mouthfeel: pseudoHash % 4 === 0 ? 'no' : 'yes',
            overall: 'no'
          };
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
        u = [...INITIAL_USERS];
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
        p = [{
          id: 'panel-active-1',
          name: 'Daily Hazy & Lager Sensory Release',
          date: new Date().toLocaleDateString('en-US'),
          activeBrands: ['1a275bab-bf2c-4d06-a0af-9628be19b88b', '0bb80b85-9ff9-4726-94b2-6202f6e53bca', '5a57bda6-37a4-4f83-ba1a-d8a52cb251ab'],
          rubrics: ['tt', 'hedonic', 'descriptive'],
          status: 'active'
        }];
        p.forEach(panel => savePanelToFirebase(panel));
      } else {
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

  const handleUpdateBrand = (updatedBrand: Brand) => saveBrandToFirebase(updatedBrand);
  const handleCreateBrand = (newBrand: Brand) => {
    const nameKey = newBrand.name ? newBrand.name.toLowerCase().trim() : '';
    const exists = brands.some(b => b.id === newBrand.id || (nameKey && b.name.toLowerCase().trim() === nameKey));
    if (!exists) saveBrandToFirebase(newBrand);
  };

  const popularitySortedBrands = useMemo(() => {
    const scores: Record<string, number> = {};
    evaluations.forEach(ev => { scores[ev.brandId] = (scores[ev.brandId] || 0) + 1; });
    batches.forEach(b => { scores[b.brandId] = (scores[b.brandId] || 0) + 5; });
    return [...brands].sort((a, b) => {
      const scoreB = scores[b.id] || 0;
      const scoreA = scores[a.id] || 0;
      if (scoreB !== scoreA) { return scoreB - scoreA; }
      return a.name.localeCompare(b.name);
    });
  }, [brands, evaluations, batches]);

  const handleAddPanel = (newPanel: SensoryPanel) => savePanelToFirebase(newPanel);
  const handleUpdatePanel = (updatedPanel: SensoryPanel) => savePanelToFirebase(updatedPanel);
  const handleDeletePanel = async (id: string) => {
    try { await deleteDoc(doc(db, 'panels', id)); } catch(err) { console.error('Error deleting panel', err); }
  };
  const handleAddUser = (newUser: UserProfile) => saveUserToFirebase(newUser);
  const handleUpdateUser = (updatedUser: UserProfile) => saveUserToFirebase(updatedUser);
  const handleUpdateOffFlavor = (of: OffFlavorItem) => saveOffFlavorToFirebase(of);

  const recalculateBatchStats = (currentBatches: Batch[], allEvals: SensoryEvaluation[]): Batch[] => {
    const evalsMap: Record<string, SensoryEvaluation[]> = {};
    allEvals.forEach(ev => {
      if (!ev.batchCode) return;
      if (!evalsMap[ev.batchCode]) evalsMap[ev.batchCode] = [];
      evalsMap[ev.batchCode].push(ev);
    });

    const updatedBatchesMap = new Map<string, Batch>();
    currentBatches.forEach(b => {
      const bEvals = evalsMap[b.batchCode] || [];
      if (bEvals.length > 0) {
        const defects = bEvals.filter(e => e.tttRating === 'no').length;
        const total = bEvals.length;
        const pct = Math.round((defects / total) * 100);
        updatedBatchesMap.set(b.batchCode, { ...b, tastersCount: total, percentDefect: pct });
      } else {
        updatedBatchesMap.set(b.batchCode, b);
      }
    });

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
    const finalBatches = recalculateBatchStats(updatedBatches, [evalItem, ...evaluations]);
    finalBatches.forEach(b => saveBatchToFirebase(b));
  };

  const handleImportLegacyData = (newBrands: Brand[], newBatches: Batch[], newEvals: SensoryEvaluation[]) => {
    const brandMap = new Map<string, Brand>();
    brands.forEach(b => {
      brandMap.set(b.id, b);
      if (b.name) brandMap.set(b.name.toLowerCase().trim(), b);
    });
    newBrands.forEach(nb => {
      const nameKey = nb.name ? nb.name.toLowerCase().trim() : '';
      if (!brandMap.has(nb.id) && (!nameKey || !brandMap.has(nameKey))) {
        brandMap.set(nb.id, nb);
        if (nameKey) brandMap.set(nameKey, nb);
      }
    });
    const uniqueBrandsMap = new Map<string, Brand>();
    brandMap.forEach(b => uniqueBrandsMap.set(b.id, b));
    const mergedBrands = Array.from(uniqueBrandsMap.values());

    const getEvalUniqueKey = (ev: SensoryEvaluation): string => {
      const email = (ev.userEmail || ev.userName || '').toLowerCase().trim();
      const testId = (ev.testId || '').toLowerCase().trim();
      const batchCode = (ev.batchCode || '').trim();
      const brandId = (ev.brandId || '').trim();
      if (testId && email) return `test_${testId}_user_${email}`;
      return `batch_${batchCode}_brand_${brandId}_user_${email}`;
    };

    const evalMap = new Map<string, SensoryEvaluation>();
    evaluations.forEach(ev => evalMap.set(getEvalUniqueKey(ev), ev));
    newEvals.forEach(nb => evalMap.set(getEvalUniqueKey(nb), nb));
    const mergedEvals = Array.from(evalMap.values());

    const mergedBatchesMap: Record<string, Batch> = {};
    batches.forEach(b => mergedBatchesMap[b.batchCode] = b);
    newBatches.forEach(nb => {
      if (!mergedBatchesMap[nb.batchCode]) mergedBatchesMap[nb.batchCode] = nb;
    });
    const mergedBatches = Object.values(mergedBatchesMap);
    const finalBatches = recalculateBatchStats(mergedBatches, mergedEvals);

    const finalBrandMap = new Map<string, Brand>();
    mergedBrands.forEach(b => {
      finalBrandMap.set(b.id, b);
      if (b.name) finalBrandMap.set(b.name.toLowerCase().trim(), b);
    });

    const discoverMissingImported = (id: string, name: string): string => {
      if (!name) return id;
      const idKey = (id || name).trim().replace(/[\/\\@]/g, '-').replace(/[^a-zA-Z0-9_-]/g, '-');
      const nameKey = name.toLowerCase().trim();
      if (finalBrandMap.has(idKey)) return finalBrandMap.get(idKey)!.id;
      if (finalBrandMap.has(nameKey)) return finalBrandMap.get(nameKey)!.id;

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

    mergedEvals.forEach(ev => ev.brandId = discoverMissingImported(ev.brandId, ev.brandName));
    finalBatches.forEach(b => b.brandId = discoverMissingImported(b.brandId, b.brandName));

    const chunkArray = <T,>(array: T[], size: number): T[][] => {
      const chunked_arr: T[][] = [];
      let index = 0;
      while (index < array.length) {
        chunked_arr.push(array.slice(index, size + index));
        index += size;
      }
      return chunked_arr;
    };

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
            batchOp.set(doc(db, op.collection, cleanId), cleanData(op.data));
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

  const value: SensoryContextType = {
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
  };

  return (
    <SensoryContext.Provider value={value}>
      {children}
    </SensoryContext.Provider>
  );
}

export function useSensoryData() {
  const context = useContext(SensoryContext);
  if (context === undefined) {
    throw new Error('useSensoryData must be used within a SensoryProvider');
  }
  return context;
}
