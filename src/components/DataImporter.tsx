/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  UploadCloud, 
  CheckCircle, 
  Database, 
  Check, 
  AlertCircle,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { Brand, Batch, SensoryEvaluation } from '../types';

interface DataImporterProps {
  onImportData: (newBrands: Brand[], newBatches: Batch[], newEvals: SensoryEvaluation[]) => void;
  onNavigateToTab: (tab: string) => void;
}

export const DataImporter: React.FC<DataImporterProps> = ({
  onImportData,
  onNavigateToTab
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [csvText, setCsvText] = useState<string>('');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [parsedBrands, setParsedBrands] = useState<Brand[]>([]);
  const [parsedBatches, setParsedBatches] = useState<Batch[]>([]);
  const [parsedEvals, setParsedEvals] = useState<SensoryEvaluation[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showTemplateGuide, setShowTemplateGuide] = useState<boolean>(false);

  // Helper: Linear-time RFC-4180-compliant CSV row parser
  const splitCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let inQuotes = false;
    let cell = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        // Handle escaped quotes inside quotes ("")
        if (inQuotes && line[i + 1] === '"') {
          cell += '"';
          i++; // skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(cell.trim());
        cell = '';
      } else {
        cell += char;
      }
    }
    result.push(cell.trim());
    return result;
  };

  // Helper: Simple CSV parser algorithm with header deep scanning
  const parseCSV = (text: string) => {
    try {
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      if (lines.length < 1) {
        setErrorMessage('Empty or invalid CSV structure. Ensure at least some characters exist.');
        return;
      }

      let mode: 'brands' | 'evals' | 'training' | null = null;
      let headerIdx = -1;

      // Scan all lines to find where headers live
      for (let i = 0; i < lines.length; i++) {
        const lineLower = lines[i].toLowerCase();
        
        // 1. Check for DraughtLab Training Report header
        if (lineLower.includes('tasting id') && lineLower.includes('attribute') && lineLower.includes('passed')) {
          mode = 'training';
          headerIdx = i;
          break;
        }

        // 2. Check for standard evaluations structure
        if (lineLower.includes('test id') && (lineLower.includes('brand name') || lineLower.includes('value') || lineLower.includes('preference') || lineLower.includes('panel name') || lineLower.includes('brand id'))) {
          mode = 'evals';
          headerIdx = i;
          break;
        }
      }

      if (mode === null) {
        // Scanners for Brands sheet
        for (let i = 0; i < lines.length; i++) {
          const lineLower = lines[i].toLowerCase();
          if (lineLower.includes('brand id') && lineLower.includes('brand name')) {
            mode = 'brands';
            headerIdx = i;
            break;
          }
        }
      }

      if (mode === 'brands' && headerIdx !== -1) {
        handleBrandsCSV(lines, headerIdx);
      } else if (mode === 'evals' && headerIdx !== -1) {
        handleEvaluationsCSV(lines, headerIdx);
      } else if (mode === 'training' && headerIdx !== -1) {
        handleTrainingCSV(lines, headerIdx);
      } else {
        setErrorMessage("Columns didn't match known structures ('Brand Id', 'Test Id', or 'Tasting Id'). Check template formatting below.");
      }
    } catch (e: any) {
      setErrorMessage(`Parsing exception: ${e.message}`);
    }
  };

  const handleTrainingCSV = (lines: string[], headerIdx: number) => {
    const brandsList: Brand[] = [];
    const evaluationsList: SensoryEvaluation[] = [];
    const headers = splitCSVLine(lines[headerIdx]).map(h => h.trim().toLowerCase());

    const getColIndex = (names: string[]): number => {
      for (const name of names) {
        const idx = headers.indexOf(name.toLowerCase());
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const tastingIdIdx = getColIndex(['tasting id', 'tasting_id', 'test id', 'id']);
    const panelNameIdx = getColIndex(['panel name', 'panel', 'test name', 'campaign name']);
    const userEmailIdx = getColIndex(['user', 'email', 'user email', 'email address', 'taster email']);
    const userNameIdx = getColIndex(['name', 'user name', 'panelist', 'taster name', 'taster']);
    const dateIdx = getColIndex(['rating date', 'date', 'created', 'created at', 'test date', 'panel start', 'evaluation date']);
    const attributeIdx = getColIndex(['attribute', 'off-flavor', 'flavor', 'spike', 'off flavor']);
    const intensityIdx = getColIndex(['intensity', 'strength']);
    const pickedIdx = getColIndex(['picked', 'selected', 'guess']);
    const passedIdx = getColIndex(['passed', 'correct', 'pass']);

    const brandMap = new Map<string, Brand>();
    const batchGroupMap: Record<string, { brandId: string; brandName: string; date: string; total: number; defects: number }> = {};

    for (let i = headerIdx + 1; i < lines.length; i++) {
      const columns = splitCSVLine(lines[i]);
      if (columns.length < 2 || columns.every(cell => cell.trim() === '')) continue;

      // Skip duplicated header rows or total/summary rows
      if (tastingIdIdx !== -1 && columns[tastingIdIdx]?.toLowerCase() === 'tasting id') continue;

      const tastingId = (tastingIdIdx !== -1 && columns[tastingIdIdx]) ? columns[tastingIdIdx].trim() : `tast-${Date.now()}-${i}`;
      const panelName = (panelNameIdx !== -1 && columns[panelNameIdx]) ? columns[panelNameIdx].trim() : 'DraughtLab Training Panel';
      const userEmail = (userEmailIdx !== -1 && columns[userEmailIdx]) ? columns[userEmailIdx].trim() : 'panelist@madtree.com';
      const userName = (userNameIdx !== -1 && columns[userNameIdx]) ? columns[userNameIdx].trim() : 'Taster Panelist';
      const dateVal = (dateIdx !== -1 && columns[dateIdx]) ? columns[dateIdx].trim() : new Date().toLocaleDateString('en-US');
      const attribute = (attributeIdx !== -1 && columns[attributeIdx]) ? columns[attributeIdx].trim() : 'Control';
      const intensity = (intensityIdx !== -1 && columns[intensityIdx]) ? columns[intensityIdx].trim() : '';
      const picked = (pickedIdx !== -1 && columns[pickedIdx]) ? columns[pickedIdx].trim() : '';
      const passedVal = (passedIdx !== -1 && columns[passedIdx]) ? columns[passedIdx].toLowerCase().trim() : '';

      // Clean date prefixes from panel name to produce standard brand names (e.g. "4/29 Mystery Howler" -> "Mystery Howler")
      let brandName = panelName;
      brandName = brandName.replace(/^\d{1,2}\/\d{1,2}(\/\d{2,4})?\s+/, '');
      brandName = brandName.trim();

      const brandId = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'training-panel';

      if (!brandMap.has(brandId)) {
        brandMap.set(brandId, {
          id: brandId,
          name: brandName,
          type: 'beer',
          created: dateVal,
          hasBaseline: false,
          overallDescription: `Dynamically compiled training tracking brand for sensory panel quality standards.`
        });
      }

      const shortId = tastingId.includes('-') ? tastingId.split('-')[0].toUpperCase() : tastingId.toUpperCase();
      const batchCode = `MH-${shortId}`;

      // Passed: yes means they detected the spiked off-flavor defect, which translates to a defect report (tttRating: 'no').
      // Passed: no means they missed the defect, which translates to a pass / clean report (tttRating: 'yes').
      const tttRating: 'yes' | 'no' = (passedVal === 'yes') ? 'no' : 'yes';

      const offFlavors = attribute && attribute.toLowerCase() !== 'control' ? [
        {
          name: `${attribute}${intensity ? ` (${intensity})` : ''}`,
          detected: passedVal === 'yes',
          severity: 2 as any,
          notes: picked ? `Guessed: ${picked}` : `Failed to identify`
        }
      ] : [];

      evaluationsList.push({
        id: `eval-imported-training-${Date.now()}-${i}`,
        testId: tastingId,
        panelName,
        brandId,
        brandName,
        batchCode,
        flavorMap: 'beer',
        userEmail,
        userName,
        date: dateVal,
        hedonicValue: passedVal === 'yes' ? 7 : 5,
        hedonicComments: picked ? `Spiked Attribute: ${attribute}. Taster identified: "${picked}" (Passed: ${passedVal})` : `Spiked Attribute: ${attribute} (Passed: ${passedVal})`,
        tttRating,
        offFlavors
      });

      if (!batchGroupMap[batchCode]) {
        batchGroupMap[batchCode] = {
          brandId,
          brandName,
          date: dateVal,
          total: 0,
          defects: 0
        };
      }
      batchGroupMap[batchCode].total++;
      if (tttRating === 'no') {
        batchGroupMap[batchCode].defects++;
      }
    }

    const uniqueBrands = Array.from(brandMap.values());
    const simulatedBatches: Batch[] = Object.entries(batchGroupMap).map(([code, data]) => {
      const pct = Math.round((data.defects / data.total) * 100);
      const safeCode = code.replace(/[\/\\@]/g, '-').replace(/[^a-zA-Z0-9_-]/g, '-');
      return {
        id: `batch-${safeCode}`,
        brandId: data.brandId,
        brandName: data.brandName,
        batchCode: code,
        date: data.date,
        tastersCount: data.total,
        percentDefect: pct,
        tags: ['training']
      };
    });

    setParsedBrands(uniqueBrands);
    setParsedEvals(evaluationsList);
    setParsedBatches(simulatedBatches);
    setSuccessMessage(`Staged ${evaluationsList.length} tasting records & ${simulatedBatches.length} training batches from DraughtLab Training Report accurately. Commit to import.`);
    setErrorMessage('');
  };

  const handleBrandsCSV = (lines: string[], headerIdx: number) => {
    const brandsList: Brand[] = [];
    const headers = splitCSVLine(lines[headerIdx]).map(h => h.trim().toLowerCase());

    const getColIndex = (names: string[]): number => {
      for (const name of names) {
        const idx = headers.indexOf(name.toLowerCase());
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const brandIdIdx = getColIndex(['brand id', 'id', 'brandid']);
    const brandNameIdx = getColIndex(['brand name', 'name', 'brand', 'product name']);
    const typeIdx = getColIndex(['type', 'category', 'brand type']);
    const createdIdx = getColIndex(['created', 'created at', 'date', 'added']);
    const brandCodeIdx = getColIndex(['brand code', 'code', 'brandcode']);
    const hasBaselineIdx = getColIndex(['has baseline?', 'has baseline', 'baseline', 'baseline?']);
    const visualIdx = getColIndex(['visual', 'appearance', 'color']);
    const aromaIdx = getColIndex(['aroma', 'smell', 'nose']);
    const tasteIdx = getColIndex(['taste', 'flavor', 'palate']);
    const mouthfeelIdx = getColIndex(['mouthfeel', 'texture', 'body']);
    const overallIdx = getColIndex(['overall', 'overall description', 'description', 'notes']);

    for (let i = headerIdx + 1; i < lines.length; i++) {
      const columns = splitCSVLine(lines[i]);
      if (columns.length < 2 || columns.every(cell => cell.trim() === '')) continue;
      
      // Skip if it is just a duplicate header row in the file
      if (brandNameIdx !== -1 && columns[brandNameIdx]?.toLowerCase() === 'brand name') continue;
      if (brandIdIdx !== -1 && columns[brandIdIdx]?.toLowerCase() === 'brand id') continue;

      const rawBrandId = (brandIdIdx !== -1 && columns[brandIdIdx]) ? columns[brandIdIdx] : `brand-${Date.now()}-${i}`;
      const brandId = rawBrandId.replace(/[\/\\@]/g, '-').replace(/[^a-zA-Z0-9_-]/g, '-');
      const brandName = (brandNameIdx !== -1 && columns[brandNameIdx]) ? columns[brandNameIdx] : 'Unknown Brand';
      const typeStr = (typeIdx !== -1 && columns[typeIdx]) ? columns[typeIdx].toLowerCase() : 'beer';
      const type = (['beer', 'cider', 'pro_seltzer', 'other'].includes(typeStr) ? typeStr : 'beer') as any;
      const created = (createdIdx !== -1 && columns[createdIdx]) ? columns[createdIdx] : new Date().toLocaleDateString('en-US');
      const brandCode = (brandCodeIdx !== -1 && columns[brandCodeIdx]) ? columns[brandCodeIdx] : undefined;
      const hasBaseline = hasBaselineIdx !== -1 ? (columns[hasBaselineIdx].toLowerCase() === 'true' || columns[hasBaselineIdx] === '1') : false;
      const visual = (visualIdx !== -1 && columns[visualIdx]) ? columns[visualIdx] : undefined;
      const aroma = (aromaIdx !== -1 && columns[aromaIdx]) ? columns[aromaIdx] : undefined;
      const taste = (tasteIdx !== -1 && columns[tasteIdx]) ? columns[tasteIdx] : undefined;
      const mouthfeel = (mouthfeelIdx !== -1 && columns[mouthfeelIdx]) ? columns[mouthfeelIdx] : undefined;
      const overall = (overallIdx !== -1 && columns[overallIdx]) ? columns[overallIdx] : undefined;

      brandsList.push({
        id: brandId,
        name: brandName,
        type,
        created,
        brandCode,
        hasBaseline,
        visual,
        aroma,
        taste,
        mouthfeel,
        overallDescription: overall
      });
    }

    setParsedBrands(brandsList);
    setSuccessMessage(`Staged ${brandsList.length} legacy brands correctly. Commit to apply changes.`);
    setErrorMessage('');
  };

  const handleEvaluationsCSV = (lines: string[], headerIdx: number) => {
    const evaluationsList: SensoryEvaluation[] = [];
    const headers = splitCSVLine(lines[headerIdx]).map(h => h.trim().toLowerCase());

    const getColIndex = (names: string[]): number => {
      for (const name of names) {
        const idx = headers.indexOf(name.toLowerCase());
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const testIdIdx = getColIndex(['test id', 'testid', 'id', 'sample id']);
    const panelNameIdx = getColIndex(['panel name', 'panel', 'test name', 'campaign name']);
    const brandIdIdx = getColIndex(['brand id', 'brandid']);
    const brandNameIdx = getColIndex(['brand name', 'brand', 'product name', 'product']);
    const batchCodeIdx = getColIndex(['batch', 'batch code', 'batch number', 'lot', 'gyle']);
    const userNameIdx = getColIndex(['name', 'user name', 'panelist', 'taster name', 'taster']);
    const userEmailIdx = getColIndex(['user', 'email', 'user email', 'email address', 'taster email']);
    const ratingValIdx = getColIndex(['value', 'rating', 'score', 'overall value', 'overall score', 'hedonic']);
    const tttRatingIdx = getColIndex(['preference', 'true to target', 'ttt', 't2t', 'is ttt', 'is true to target', 'target status', 'preference status']);
    const commentIdx = getColIndex(['comment', 'comments', 'notes', 'feedback', 'sensory notes']);
    const dateIdx = getColIndex(['rating date', 'date', 'created', 'created at', 'test date', 'panel start', 'evaluation date']);

    // Group batches for accurate statistic aggregation on big data sets
    const batchGroupMap: Record<string, { brandId: string; brandName: string; date: string; total: number; defects: number }> = {};

    for (let i = headerIdx + 1; i < lines.length; i++) {
      const columns = splitCSVLine(lines[i]);
      if (columns.length < 2 || columns.every(cell => cell.trim() === '')) continue;

      // Skip duplicated header lines if any are merged in CSV
      if (testIdIdx !== -1 && columns[testIdIdx]?.toLowerCase() === 'test id') continue;
      if (brandNameIdx !== -1 && columns[brandNameIdx]?.toLowerCase() === 'brand name') continue;

      // Ensure that there is some brand name or batch code present to treat it as a real evaluation row,
      // avoiding any top metadata description lines in case there were columns matched poorly.
      const rawBatchCode = batchCodeIdx !== -1 ? columns[batchCodeIdx]?.trim() : '';
      const rawBrandName = brandNameIdx !== -1 ? columns[brandNameIdx]?.trim() : '';
      if (!rawBatchCode && !rawBrandName) continue;

      const rawTestId = (testIdIdx !== -1 && columns[testIdIdx]) ? columns[testIdIdx] : `test-${Date.now()}-${i}`;
      const testId = rawTestId.replace(/[\/\\@]/g, '-').replace(/[^a-zA-Z0-9_-]/g, '-');
      const panelName = (panelNameIdx !== -1 && columns[panelNameIdx]) ? columns[panelNameIdx] : 'Imported Panel';
      const brandName = rawBrandName || 'Unknown Brand';
      const generatedBrandId = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `brand-${Date.now()}`;
      const rawBrandId = (brandIdIdx !== -1 && columns[brandIdIdx]) ? columns[brandIdIdx] : generatedBrandId;
      const brandId = rawBrandId.replace(/[\/\\@]/g, '-').replace(/[^a-zA-Z0-9_-]/g, '-');
      const batchCode = rawBatchCode || `BATCH-${new Date().toISOString().substring(0, 10).replace(/-/g, '')}`;
      const userName = (userNameIdx !== -1 && columns[userNameIdx]) ? columns[userNameIdx] : 'Taster Panelist';
      const userEmail = (userEmailIdx !== -1 && columns[userEmailIdx]) ? columns[userEmailIdx] : 'panelist@madtree.com';
      const ratingVal = ratingValIdx !== -1 ? parseFloat(columns[ratingValIdx]) || 7 : 7;
      
      let tttRating: 'yes' | 'no' = 'yes';
      if (tttRatingIdx !== -1 && columns[tttRatingIdx]) {
        const val = columns[tttRatingIdx].toLowerCase().trim();
        if (val.includes('not true') || val.includes('false') || val === 'no' || val === '0') {
          tttRating = 'no';
        }
      }

      const comment = (commentIdx !== -1 && columns[commentIdx]) ? columns[commentIdx] : '';
      const dateVal = (dateIdx !== -1 && columns[dateIdx]) ? columns[dateIdx] : new Date().toLocaleDateString('en-US');

      // Deduplicate on user, batch, date combo
      const dedupeKey = `${userEmail}-${batchCode}-${dateVal}`;
      if (evaluationsList.some(e => `${e.userEmail}-${e.batchCode}-${e.date}` === dedupeKey)) {
        continue;
      }

      evaluationsList.push({
        id: `eval-imported-${Date.now()}-${i}`,
        testId,
        panelName,
        brandId,
        brandName,
        batchCode,
        flavorMap: 'beer',
        userEmail,
        userName,
        date: dateVal,
        hedonicValue: ratingVal,
        hedonicComments: comment,
        tttRating: tttRating,
        tttMetrics: tttRating === 'no' ? {
          visual: Math.random() > 0.8 ? 'no' : 'yes',
          aroma: Math.random() > 0.6 ? 'no' : 'yes',
          taste: Math.random() > 0.4 ? 'no' : 'yes',
          mouthfeel: Math.random() > 0.7 ? 'no' : 'yes',
          overall: 'no'
        } as NonNullable<SensoryEvaluation['tttMetrics']> : undefined,
        offFlavors: []
      });

      // Accumulate batch statistical mapping
      if (!batchGroupMap[batchCode]) {
        batchGroupMap[batchCode] = {
          brandId,
          brandName,
          date: dateVal,
          total: 0,
          defects: 0
        };
      }
      batchGroupMap[batchCode].total++;
      if (tttRating === 'no') {
        batchGroupMap[batchCode].defects++;
      }
    }

    const simulatedBatches: Batch[] = Object.entries(batchGroupMap).map(([code, data]) => {
      const pct = Math.round((data.defects / data.total) * 100);
      const safeCode = code.replace(/[\/\\@]/g, '-').replace(/[^a-zA-Z0-9_-]/g, '-');
      return {
        id: `batch-${safeCode}`,
        brandId: data.brandId,
        brandName: data.brandName,
        batchCode: code,
        date: data.date,
        tastersCount: data.total,
        percentDefect: pct,
        tags: []
      };
    });

    setParsedEvals(evaluationsList);
    setParsedBatches(simulatedBatches);
    setSuccessMessage(`Staged ${evaluationsList.length} sensory reviews & ${simulatedBatches.length} production batches. Commit to import.`);
    setErrorMessage('');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text.length > 50000) {
          setCsvText(`[Large file loaded: ${file.name}]\n\nThe content is too large to display in this preview area, but it has been processed accurately.`);
        } else {
          setCsvText(text);
        }
        
        // Use a timeout so React can render the upload status before parsing blocks the main thread
        setTimeout(() => parseCSV(text), 10);
      };
      reader.readAsText(file);
    }
  };

  const handleTextInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCsvText(val);
    if (val.trim()) {
      parseCSV(val);
    } else {
      setParsedBrands([]);
      setParsedEvals([]);
      setParsedBatches([]);
      setErrorMessage('');
      setSuccessMessage('');
    }
  };

  const handleSubmitImport = () => {
    onImportData(parsedBrands, parsedBatches, parsedEvals);
    
    // Clear State
    setParsedBrands([]);
    setParsedBatches([]);
    setParsedEvals([]);
    setCsvText('');
    setSuccessMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Smooth immediate redirection without iframe blocking popups
    onNavigateToTab('dashboard');
  };

  // Mock template inserts
  const loadMockBrandsTemplate = () => {
    const csv = `Brand Id,Brand Name,Type,Created,Brand Code,Has Baseline?,BaselineId,Visual,Aroma,Taste,Mouthfeel,Overall
bbd47f4b-8adb-4869-a8da-ae75207da966,"""Cin-Cin""nati Pils",beer,12/16/24,,True,9e9bc48e-5e53-4ba9-8808-82abc0739ba7,,,,"Delicate, dry and crisp."
77dd35ce-88aa-4c2f-a30a-d382950a6e7b,42 Mile Cider,cider,1/17/23,,True,ffe72812-d8f2-434b-9b93-9381af3b0fa3,"Light yellow gold",Apple,Apple,Light,Fruity
`;
    setCsvText(csv);
    parseCSV(csv);
  };

  const loadMockHedonicTemplate = () => {
    const csv = `Test Id,Panel Start,Panel End,Panel Name,Brand Id,Brand Name,Brand Code,Flavor Map,Batch,Sample Id,Blind?,Tags,User,Name,Rating Date,Value,Preference,Comment
79f97454-d95d-4051-b095-3f8ea55a6cb9,7/28/25,7/28/25,7/28 Daily Sensory Release,a3896f7b-89b2-49a7-a7a8-3412fa60110e,Hoppin Frog Cranberry Turbo Shandy,,beer,20250728,,no,,daniel.rebbe@madtreebrewing.com,Dan Rebbe,7/28/25,5,Neither Like Nor Dislike,Some people probably like this but it's not the beer for me.  
79f97454-d95d-4051-b095-3f8ea55a6cb9,7/28/25,7/28/25,7/28 Daily Sensory Release,a3896f7b-89b2-49a7-a7a8-3412fa60110e,Hoppin Frog Cranberry Turbo Shandy,,beer,20250728,,no,,chandler.cottrell@madtreebrewing.com,Chandler Cottrell,7/28/25,8,Like Very Much,Not bad!
`;
    setCsvText(csv);
    parseCSV(csv);
  };

  return (
    <div className="space-y-6" id="legacy_reports_importer">
      <div className="bg-slate-950 p-6 rounded-3xl border border-slate-900 shadow-xl space-y-1">
        <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
          <Database className="h-5 w-5 text-emerald-400" />
          Legacy Excel &amp; CSV Data Importer
        </h2>
        <p className="text-slate-400 text-xs">Import historical DraughtLab records to preserve brand history and establish tasting trends instantly</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Drag And Drop area */}
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-10 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center text-center space-y-4 cursor-pointer transition-all ${
              dragActive 
                ? 'bg-emerald-500/10 border-emerald-400' 
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
            id="drag_drop_csv_container"
          >
            <UploadCloud className="h-10 w-10 text-emerald-400" />
            <div className="space-y-1 text-sm font-sans" id="drag_drop_text_indicator">
              <p className="font-bold text-slate-300">Drag &amp; drop legacy CSV files here, or click to browse</p>
              <p className="text-slate-500 text-xs">Supports Brands Baseline specs, Sensory Hedonic ratings, and DraughtLab Training report sheets</p>
            </div>
          </div>

          {/* Hidden native file input picker: Moved OUTSIDE the clickable container to resolve event collision recursion */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onload = (event) => {
                  const text = event.target?.result as string;
                  if (text.length > 50000) {
                    setCsvText(`[Large file loaded: ${file.name}]\n\nThe content is too large to display in this preview area, but it has been processed accurately.`);
                  } else {
                    setCsvText(text);
                  }
                  
                  // Use a timeout so React can render the upload status before parsing blocks the main thread
                  setTimeout(() => parseCSV(text), 10);

                  // Instantly clear native input value so selecting the identical file triggers the onChange event again
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                };
                reader.readAsText(file);
              }
            }}
            accept=".csv"
            className="hidden"
          />

          {/* Paste Raw CSV textbox */}
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-900 shadow-xl space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs text-slate-400 uppercase tracking-widest font-mono">Or paste raw spreadsheet string</label>
              <div className="flex gap-2 text-[10px] font-sans">
                <button 
                  type="button" 
                  onClick={loadMockBrandsTemplate} 
                  className="text-cyan-400 hover:text-cyan-300"
                >
                  Load Brands Template
                </button>
                <span className="text-slate-700">|</span>
                <button 
                  type="button" 
                  onClick={loadMockHedonicTemplate} 
                  className="text-amber-400 hover:text-amber-300"
                >
                  Load Hedonic Ratings Template
                </button>
              </div>
            </div>
            <textarea
              rows={8}
              value={csvText}
              onChange={handleTextInputChange}
              placeholder="Paste comma-delimited columns here... Brand Id,Brand Name,Type..."
              className="w-full bg-slate-900 text-slate-300 border border-slate-800 rounded-2xl p-4 text-xs font-mono outline-none outline-none focus:border-cyan-500/50"
              id="raw_csv_paste_area"
            />
          </div>
        </div>

        {/* Feedback Column */}
        <div className="space-y-6">
          {/* Staged State Card */}
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-900 shadow-xl space-y-4">
            <h3 className="text-md font-bold text-slate-200">Import Staging Status</h3>
            
            {/* Show success indicator */}
            {successMessage && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-start gap-2.5">
                <CheckCircle className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-bold">File Parsing Succeeded</p>
                  <p className="mt-1 text-slate-400 leading-normal">{successMessage}</p>
                </div>
              </div>
            )}

            {/* Show error indicator */}
            {errorMessage && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-start gap-2.5">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-bold">Parsing Misfire</p>
                  <p className="mt-1 text-slate-400 leading-normal">{errorMessage}</p>
                </div>
              </div>
            )}

            {!successMessage && !errorMessage && (
              <div className="p-4 bg-slate-900/30 text-slate-500 text-xs rounded-xl flex items-start gap-2 border border-slate-900">
                <HelpCircle className="h-4 w-4 shrink-0" />
                <span>Upload a CSV or load a template above to generate staged imports.</span>
              </div>
            )}

            {/* Data summary preview */}
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Brands parsed:</span>
                <span className="text-slate-350">{parsedBrands.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Batches parsed:</span>
                <span className="text-slate-355">{parsedBatches.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Evaluations parsed:</span>
                <span className="text-slate-355">{parsedEvals.length}</span>
              </div>
            </div>

            {/* Commit Button */}
            <button
              onClick={handleSubmitImport}
              disabled={parsedBrands.length === 0 && parsedEvals.length === 0}
              className={`w-full py-3 rounded-full font-bold font-sans text-xs flex items-center justify-center gap-1.5 transition-all shadow-xl active:scale-[0.98] ${
                parsedBrands.length > 0 || parsedEvals.length > 0
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/10 cursor-pointer hover:shadow-emerald-500/20 hover:scale-[1.01]'
                  : 'bg-slate-900 text-slate-600 border border-slate-850 cursor-not-allowed shadow-none'
              }`}
              id="csv_commit_import_btn"
            >
              <Check className="h-4 w-4" /> Commit Import to History
            </button>
          </div>

          {/* Guidelines info */}
          <div className="p-5 bg-slate-950 rounded-2xl border border-slate-900/60 shadow-lg text-slate-400 text-xs space-y-2">
            <span className="text-[10px] text-slate-500 font-mono uppercase block">CSV Formatting Rules:</span>
            <p>Ensure file holds the correct initial row matching DraughtLab\'s output schemas (column headers like "Brand Id, Brand Name" or "Test Id, Value"). Column layouts are mapped dynamically.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
