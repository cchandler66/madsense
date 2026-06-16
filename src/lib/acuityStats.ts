export interface SpikeTestRecord {
  panelistId: string;
  batchCode: string; // The specific spiked batch
  targetCompound: string; // The known chemical (e.g., 'Diacetyl')
  targetConcentration: number; // e.g., 3x flavor threshold
  userDetectedCompound: string | null; // What they actually clicked
  userIntensity: number;
}

export interface PanelistAcuity {
  panelistId: string;
  totalTests: number;
  overallAccuracy: number;
  sensitivityMap: Record<string, {
    tests: number;
    hits: number;    // True Positives
    misses: number;  // False Negatives
    confusions: Record<string, number>; // What they clicked instead
  }>;
}

export function calculatePanelistAcuity(records: SpikeTestRecord[]): PanelistAcuity[] {
  const panelistMap = new Map<string, PanelistAcuity>();

  records.forEach(record => {
    if (!panelistMap.has(record.panelistId)) {
      panelistMap.set(record.panelistId, {
        panelistId: record.panelistId,
        totalTests: 0,
        overallAccuracy: 0,
        sensitivityMap: {}
      });
    }

    const stats = panelistMap.get(record.panelistId)!;
    stats.totalTests += 1;

    // Initialize the compound tracking if it doesn't exist
    if (!stats.sensitivityMap[record.targetCompound]) {
      stats.sensitivityMap[record.targetCompound] = { tests: 0, hits: 0, misses: 0, confusions: {} };
    }

    const compoundStats = stats.sensitivityMap[record.targetCompound];
    compoundStats.tests += 1;

    if (record.userDetectedCompound === record.targetCompound) {
      // True Positive
      compoundStats.hits += 1;
    } else {
      // False Negative (Missed it entirely) or Confusion (Guessed wrong)
      compoundStats.misses += 1;
      if (record.userDetectedCompound) {
        compoundStats.confusions[record.userDetectedCompound] = 
          (compoundStats.confusions[record.userDetectedCompound] || 0) + 1;
      }
    }
  });

  // Calculate final overall accuracy percentages
  return Array.from(panelistMap.values()).map(stats => {
    let totalHits = 0;
    Object.values(stats.sensitivityMap).forEach(c => { totalHits += c.hits; });
    stats.overallAccuracy = stats.totalTests > 0 ? (totalHits / stats.totalTests) * 100 : 0;
    return stats;
  });
}
