/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Brand {
  id: string;
  name: string;
  type: 'beer' | 'cider' | 'pro_seltzer' | 'other';
  created: string;
  brandCode?: string;
  hasBaseline: boolean;
  baselineId?: string;
  visual?: string;
  aroma?: string;
  taste?: string;
  mouthfeel?: string;
  overallDescription?: string;
}

export interface Batch {
  id: string;
  brandId: string;
  brandName: string;
  batchCode: string;
  date: string;
  tastersCount: number;
  percentDefect: number; // For True To Target
  tags: string[];
}

export interface OffFlavorEvaluation {
  name: string;
  detected: boolean;
  severity: 0 | 1 | 2 | 3; // 0: None, 1: Weak, 2: Moderate, 3: Heavy
  notes?: string;
}

export interface SensoryEvaluation {
  id: string;
  testId: string;
  panelName: string;
  brandId: string;
  brandName: string;
  batchCode: string;
  flavorMap: string; // e.g. "beer", "cider", "pro_seltzer"
  userEmail: string;
  userName: string;
  date: string;
  
  // TTT Evaluation
  tttMetrics?: {
    visual: 'yes' | 'no';
    aroma: 'yes' | 'no';
    taste: 'yes' | 'no';
    mouthfeel: 'yes' | 'no';
    overall: 'yes' | 'no';
  };
  tttRating?: 'yes' | 'no';
  tttComments?: string;

  // Hedonic Evaluation
  hedonicValue?: number; // 1-9 rating
  hedonicComments?: string;

  // DOE Evaluation scores (0-7 scale)
  doeAttributes?: Record<string, number>;

  // Descriptive Evaluation scores (1-5 or descriptive keywords string)
  visualScores?: {
    foamQuantity?: number;
    color?: string;
    foamColor?: string;
    particulateSize?: string;
    haze?: string;
    lacing?: number;
  };
  aromaScores?: {
    sweetAromatic?: string[]; // e.g. ["Vanilla", "Chocolate"]
    burnt?: string[];
    cereal?: string[];
    nutty?: string[];
    roasty?: string[];
    other?: string;
  };
  tasteScores?: {
    sweet?: number;
    salty?: number;
    bitter?: number;
    sour?: number;
    sweetLinger?: number;
    bitterLinger?: number;
  };
  mouthfeelScores?: {
    carbonation?: number;
    body?: number;
    mouthwatering?: number;
    alcohol?: number;
    spicy?: number;
    astringency?: number;
  };

  // Off Flavors
  offFlavors: OffFlavorEvaluation[];
}

export interface SensoryPanel {
  id: string;
  name: string;
  date: string;
  activeBrands: string[]; // Brand IDs
  rubrics: ('tt' | 'hedonic' | 'descriptive' | 'training')[];
  status: 'active' | 'completed';
  trainingSpikedAttribute?: string; // specific off-flavor or attribute being tested
  trainingNotes?: string;
  trainingStations?: number;
}

export interface UserProfile {
  email: string;
  name: string;
  avatarInitials: string;
  role: 'admin' | 'panelist';
  panelistScorecard?: {
    panelsCount: number;
    testsCompletedCount: number;
    attendanceRate: number; // e.g. 0.85
  };
}

export interface OffFlavorItem {
  id: string;
  name: string;
  sensoryDescription: string;
  commonCauses: string;
  prevention: string;
}
